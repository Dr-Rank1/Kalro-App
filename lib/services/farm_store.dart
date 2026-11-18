import 'dart:async';
import 'dart:convert';
import 'dart:ffi';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:powersync/powersync.dart';
import 'package:sqlite3/open.dart';
import 'package:sqlite3/sqlite3.dart' as sqlite;

/// Client-side PowerSync schema matching batches, feed_logs, and mortality_logs
/// collections for active-active replication to central NSRC PostgreSQL instance.
const kalroPowerSyncSchema = Schema([
  Table(
    'batches',
    [
      Column.text('species'),
      Column.text('startDate'),
      Column.integer('eggCount'),
      Column.text('status'),
      Column.text('createdAt'),
      Column.text('strain'),
      Column.text('location'),
      Column.text('caretaker'),
      Column.text('feedMaterial'),
      Column.text('eggSource'),
      Column.text('rearingType'),
      Column.text('batchTag'),
    ],
    indexes: [
      Index('idx_batches_status', [IndexedColumn('status')]),
      Index('idx_batches_created', [IndexedColumn('createdAt')]),
    ],
  ),
  Table(
    'feed_logs',
    [
      Column.text('batchId'),
      Column.text('recordedAt'),
      Column.text('feedType'),
      Column.real('quantityGrams'),
      Column.text('feedingStage'),
      Column.text('notes'),
      Column.integer('isSkipped'),
      Column.text('skipReason'),
    ],
    indexes: [
      Index('idx_feed_batch', [IndexedColumn('batchId')]),
      Index('idx_feed_stage', [IndexedColumn('feedingStage')]),
    ],
  ),
  Table(
    'mortality_logs',
    [
      Column.text('batchId'),
      Column.text('recordedAt'),
      Column.integer('count'),
      Column.text('reason'),
      Column.text('disease'),
      Column.text('treatment'),
      Column.text('notes'),
      Column.integer('isolated'),
      Column.text('photoPath'),
    ],
    indexes: [
      Index('idx_mort_batch', [IndexedColumn('batchId')]),
    ],
  ),
]);

/// PowerSync backend connector for KALRO Sericulture Farm Management System.
/// Replicates local SQLite transactions against the central NSRC PostgreSQL instance
/// when rural cellular / network connectivity is restored.
class NsrcPowerSyncConnector extends PowerSyncBackendConnector {
  NsrcPowerSyncConnector({
    this.endpoint = 'https://powersync.kalro-nsrc.go.ke',
    this.token,
    this.userId,
    http.Client? httpClient,
  }) : _http = httpClient ?? http.Client();

  final String endpoint;
  final String? token;
  final String? userId;
  final http.Client _http;

  @override
  Future<PowerSyncCredentials?> fetchCredentials() async {
    if (token == null || token!.trim().isEmpty) return null;
    return PowerSyncCredentials(
      endpoint: endpoint,
      token: token!.trim(),
      userId: userId,
    );
  }

  @override
  Future<void> uploadData(PowerSyncDatabase database) async {
    final batch = await database.getCrudBatch();
    if (batch == null) return;

    final credentials = await getCredentialsCached();
    if (credentials == null) {
      // Offline mode: keep local queue in SQLite
      return;
    }

    try {
      final uri = credentials.endpointUri('/api/powersync/crud');
      final res = await _http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${credentials.token}',
        },
        body: jsonEncode({'data': batch.crud}),
      );

      if (res.statusCode == 401) {
        invalidateCredentials();
        return;
      }

      if (res.statusCode >= 200 && res.statusCode < 300) {
        await batch.complete();
      }
    } catch (_) {
      // Offline cellular disruption: changes remain safely queued locally
    }
  }
}

/// FarmStore wrapping SQLite with PowerSync offline replication.
/// Synchronizes batches, feed_logs, and mortality_logs to central NSRC PostgreSQL
/// while maintaining full offline availability with zero cloud dependencies.
class FarmStore {
  FarmStore({
    Directory? directory,
    PowerSyncBackendConnector? connector,
  })  : _directory = directory,
        _connector = connector;

  final Directory? _directory;
  final PowerSyncBackendConnector? _connector;
  sqlite.Database? _db;
  PowerSyncDatabase? _powerSyncDb;
  static var _sqliteReady = false;
  static final Map<String, sqlite.Database> _databases = {};
  static final StreamController<String> _changesController =
      StreamController<String>.broadcast();

  static const fileName = 'kalro.db';
  static const _metaKey = '_meta';

  static const collections = <String, String>{
    'batches': 'batches.json',
    'feed_logs': 'feed_logs.json',
    'mortality_logs': 'mortality_logs.json',
    'environment_logs': 'environment_logs.json',
    'cocoon_harvests': 'cocoon_harvests.json',
    'milestone_observations': 'milestone_observations.json',
    'payments': 'payments.json',
    'producers': 'producers.json',
    'purchase_orders': 'purchase_orders.json',
    'leaf_movements': 'leaf_movements.json',
  };

  static const singletons = <String, String>{
    'inventory_settings': 'inventory_settings.json',
    'leaf_inventory': 'leaf_inventory.json',
  };

  Future<Directory> directory() async {
    return _directory ?? await getApplicationDocumentsDirectory();
  }

  /// Returns the underlying PowerSync database instance wrapped with the KALRO schema.
  Future<PowerSyncDatabase> getPowerSyncDatabase() async {
    if (_powerSyncDb != null) return _powerSyncDb!;
    final dir = await directory();
    final path = p.canonicalize(p.join(dir.path, fileName));
    final psDb = PowerSyncDatabase(
      schema: kalroPowerSyncSchema,
      path: path,
    );
    await psDb.initialize();
    if (_connector != null) {
      psDb.connect(connector: _connector).catchError((_) {});
    }
    _powerSyncDb = psDb;
    return psDb;
  }

  Future<List<Map<String, dynamic>>> getCollection(String name) async {
    final db = await _database();
    final rows = db.select(
      'SELECT json FROM records WHERE collection = ? ORDER BY rowid',
      [name],
    );
    if (rows.isNotEmpty) {
      return [
        for (final row in rows)
          jsonDecode(row['json'] as String) as Map<String, dynamic>,
      ];
    }

    return switch (name) {
      'batches' => [
          for (final r in db.select('SELECT * FROM batches ORDER BY id'))
            _batchRowToMap(r),
        ],
      'feed_logs' => [
          for (final r in db.select('SELECT * FROM feed_logs ORDER BY id'))
            _feedLogRowToMap(r),
        ],
      'mortality_logs' => [
          for (final r in db.select('SELECT * FROM mortality_logs ORDER BY id'))
            _mortalityLogRowToMap(r),
        ],
      _ => [],
    };
  }

  Future<List<Map<String, dynamic>>> getCollectionWhere(
    String collection, {
    required String jsonKey,
    required Object value,
    int? limit,
    bool descending = false,
  }) async {
    final db = await _database();
    final strVal = value.toString();
    final limitClause = limit != null ? 'LIMIT $limit' : '';

    // Fast-path indexed queries using virtual generated columns & switch expression
    final sqlite.ResultSet rows = switch (jsonKey) {
      'batchId' || 'batch_id' => db.select(
          'SELECT json FROM records WHERE collection = ? AND batch_id = ? ${descending ? 'ORDER BY created_at DESC' : 'ORDER BY rowid'} $limitClause',
          [collection, strVal],
        ),
      'stage' || 'feedingStage' || 'stageKey' => db.select(
          'SELECT json FROM records WHERE collection = ? AND stage = ? ORDER BY rowid $limitClause',
          [collection, strVal],
        ),
      'createdAt' || 'recordedAt' || 'startDate' => db.select(
          'SELECT json FROM records WHERE collection = ? AND created_at = ? ORDER BY rowid $limitClause',
          [collection, strVal],
        ),
      _ => () {
          final safeKey = jsonKey.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '');
          return db.select(
            "SELECT json FROM records WHERE collection = ? AND json_extract(json, '\$.$safeKey') = ? ORDER BY rowid $limitClause",
            [collection, strVal],
          );
        }(),
    };

    if (rows.isNotEmpty) {
      return [
        for (final row in rows)
          jsonDecode(row['json'] as String) as Map<String, dynamic>,
      ];
    }

    return switch ((collection, jsonKey)) {
      ('feed_logs', 'batchId' || 'batch_id') => [
          for (final r in db.select('SELECT * FROM feed_logs WHERE batchId = ? $limitClause', [strVal]))
            _feedLogRowToMap(r),
        ],
      ('mortality_logs', 'batchId' || 'batch_id') => [
          for (final r in db.select('SELECT * FROM mortality_logs WHERE batchId = ? $limitClause', [strVal]))
            _mortalityLogRowToMap(r),
        ],
      _ => [],
    };
  }

  Future<void> upsert(
    String collection,
    String id,
    Map<String, dynamic> record,
  ) async {
    await upsertAll(collection, [record]);
  }

  /// Bulk upsert performing all operations inside an explicit SQLite transaction
  /// with pre-compiled prepared statements to prevent mobile disk I/O bottlenecks.
  Future<void> upsertAll(
    String collection,
    List<Map<String, dynamic>> records,
  ) async {
    if (records.isEmpty) return;
    final db = await _database();
    db.execute('BEGIN IMMEDIATE');

    final stmt = db.prepare(
      'INSERT OR REPLACE INTO records (collection, id, json) VALUES (?, ?, ?)',
    );

    sqlite.PreparedStatement? batchStmt;
    sqlite.PreparedStatement? feedStmt;
    sqlite.PreparedStatement? mortStmt;

    if (collection == 'batches') {
      batchStmt = db.prepare('''
        INSERT OR REPLACE INTO batches (
          id, species, startDate, eggCount, status, createdAt,
          strain, location, caretaker, feedMaterial, eggSource, rearingType, batchTag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ''');
    } else if (collection == 'feed_logs') {
      feedStmt = db.prepare('''
        INSERT OR REPLACE INTO feed_logs (
          id, batchId, recordedAt, feedType, quantityGrams,
          feedingStage, notes, isSkipped, skipReason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ''');
    } else if (collection == 'mortality_logs') {
      mortStmt = db.prepare('''
        INSERT OR REPLACE INTO mortality_logs (
          id, batchId, recordedAt, count, reason,
          disease, treatment, notes, isolated, photoPath
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ''');
    }

    try {
      for (final record in records) {
        final id = record['id']?.toString();
        if (id == null || id.isEmpty) continue;

        stmt.execute([collection, id, jsonEncode(record)]);

        if (batchStmt != null) {
          batchStmt.execute([
            id,
            record['species']?.toString() ?? 'bombyx',
            record['startDate']?.toString() ?? DateTime.now().toIso8601String(),
            record['eggCount'] is int
                ? record['eggCount']
                : int.tryParse(record['eggCount']?.toString() ?? '') ?? 0,
            record['status']?.toString() ?? 'active',
            record['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
            record['strain']?.toString(),
            record['location']?.toString(),
            record['caretaker']?.toString(),
            record['feedMaterial']?.toString(),
            record['eggSource']?.toString(),
            record['rearingType']?.toString(),
            record['batchTag']?.toString(),
          ]);
        } else if (feedStmt != null) {
          feedStmt.execute([
            id,
            record['batchId']?.toString() ?? '',
            record['recordedAt']?.toString() ?? DateTime.now().toIso8601String(),
            record['feedType']?.toString() ?? 'mulberry',
            record['quantityGrams'] is num
                ? (record['quantityGrams'] as num).toDouble()
                : double.tryParse(record['quantityGrams']?.toString() ?? '') ?? 0.0,
            record['feedingStage']?.toString(),
            record['notes']?.toString(),
            (record['isSkipped'] == true || record['isSkipped'] == 1) ? 1 : 0,
            record['skipReason']?.toString(),
          ]);
        } else if (mortStmt != null) {
          mortStmt.execute([
            id,
            record['batchId']?.toString() ?? '',
            record['recordedAt']?.toString() ?? DateTime.now().toIso8601String(),
            record['count'] is int
                ? record['count']
                : int.tryParse(record['count']?.toString() ?? '') ?? 0,
            record['reason']?.toString(),
            record['disease']?.toString(),
            record['treatment']?.toString(),
            record['notes']?.toString(),
            (record['isolated'] == true || record['isolated'] == 1) ? 1 : 0,
            record['photoPath']?.toString(),
          ]);
        }
      }
      db.execute('COMMIT');
    } catch (_) {
      try {
        db.execute('ROLLBACK');
      } catch (_) {}
      rethrow;
    } finally {
      stmt.dispose();
      batchStmt?.dispose();
      feedStmt?.dispose();
      mortStmt?.dispose();
    }

    _changesController.add(collection);
  }

  Future<void> delete(String collection, String id) async {
    final db = await _database();
    db.execute(
      'DELETE FROM records WHERE collection = ? AND id = ?',
      [collection, id],
    );
    if (collection == 'batches') {
      db.execute('DELETE FROM batches WHERE id = ?', [id]);
    } else if (collection == 'feed_logs') {
      db.execute('DELETE FROM feed_logs WHERE id = ?', [id]);
    } else if (collection == 'mortality_logs') {
      db.execute('DELETE FROM mortality_logs WHERE id = ?', [id]);
    }
    _changesController.add(collection);
  }

  Future<void> replaceCollection(
    String collection,
    List<Map<String, dynamic>> records,
  ) async {
    final db = await _database();
    db.execute('BEGIN IMMEDIATE');

    sqlite.PreparedStatement? batchStmt;
    sqlite.PreparedStatement? feedStmt;
    sqlite.PreparedStatement? mortStmt;
    final stmt = db.prepare(
      'INSERT OR REPLACE INTO records (collection, id, json) VALUES (?, ?, ?)',
    );

    if (collection == 'batches') {
      batchStmt = db.prepare('''
        INSERT OR REPLACE INTO batches (
          id, species, startDate, eggCount, status, createdAt,
          strain, location, caretaker, feedMaterial, eggSource, rearingType, batchTag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ''');
    } else if (collection == 'feed_logs') {
      feedStmt = db.prepare('''
        INSERT OR REPLACE INTO feed_logs (
          id, batchId, recordedAt, feedType, quantityGrams,
          feedingStage, notes, isSkipped, skipReason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ''');
    } else if (collection == 'mortality_logs') {
      mortStmt = db.prepare('''
        INSERT OR REPLACE INTO mortality_logs (
          id, batchId, recordedAt, count, reason,
          disease, treatment, notes, isolated, photoPath
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ''');
    }

    try {
      db.execute('DELETE FROM records WHERE collection = ?', [collection]);
      if (collection == 'batches') {
        db.execute('DELETE FROM batches');
      } else if (collection == 'feed_logs') {
        db.execute('DELETE FROM feed_logs');
      } else if (collection == 'mortality_logs') {
        db.execute('DELETE FROM mortality_logs');
      }

      for (final record in records) {
        final id = record['id']?.toString();
        if (id == null || id.isEmpty) continue;
        stmt.execute([collection, id, jsonEncode(record)]);

        if (batchStmt != null) {
          batchStmt.execute([
            id,
            record['species']?.toString() ?? 'bombyx',
            record['startDate']?.toString() ?? DateTime.now().toIso8601String(),
            record['eggCount'] is int
                ? record['eggCount']
                : int.tryParse(record['eggCount']?.toString() ?? '') ?? 0,
            record['status']?.toString() ?? 'active',
            record['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
            record['strain']?.toString(),
            record['location']?.toString(),
            record['caretaker']?.toString(),
            record['feedMaterial']?.toString(),
            record['eggSource']?.toString(),
            record['rearingType']?.toString(),
            record['batchTag']?.toString(),
          ]);
        } else if (feedStmt != null) {
          feedStmt.execute([
            id,
            record['batchId']?.toString() ?? '',
            record['recordedAt']?.toString() ?? DateTime.now().toIso8601String(),
            record['feedType']?.toString() ?? 'mulberry',
            record['quantityGrams'] is num
                ? (record['quantityGrams'] as num).toDouble()
                : double.tryParse(record['quantityGrams']?.toString() ?? '') ?? 0.0,
            record['feedingStage']?.toString(),
            record['notes']?.toString(),
            (record['isSkipped'] == true || record['isSkipped'] == 1) ? 1 : 0,
            record['skipReason']?.toString(),
          ]);
        } else if (mortStmt != null) {
          mortStmt.execute([
            id,
            record['batchId']?.toString() ?? '',
            record['recordedAt']?.toString() ?? DateTime.now().toIso8601String(),
            record['count'] is int
                ? record['count']
                : int.tryParse(record['count']?.toString() ?? '') ?? 0,
            record['reason']?.toString(),
            record['disease']?.toString(),
            record['treatment']?.toString(),
            record['notes']?.toString(),
            (record['isolated'] == true || record['isolated'] == 1) ? 1 : 0,
            record['photoPath']?.toString(),
          ]);
        }
      }
      db.execute('COMMIT');
      _changesController.add(collection);
    } catch (_) {
      try {
        db.execute('ROLLBACK');
      } catch (_) {}
      rethrow;
    } finally {
      stmt.dispose();
      batchStmt?.dispose();
      feedStmt?.dispose();
      mortStmt?.dispose();
    }
  }

  /// Watch real-time updates on a collection powered by PowerSync and SQLite streams.
  Stream<List<Map<String, dynamic>>> watchCollection(String collection) async* {
    yield await getCollection(collection);
    yield* _changesController.stream
        .where((col) => col == collection)
        .asyncMap((_) => getCollection(collection));
  }

  /// Watch filtered collection updates matching a specific key-value pair.
  Stream<List<Map<String, dynamic>>> watchCollectionWhere(
    String collection, {
    required String jsonKey,
    required Object value,
  }) async* {
    yield await getCollectionWhere(collection, jsonKey: jsonKey, value: value);
    yield* _changesController.stream
        .where((col) => col == collection)
        .asyncMap((_) => getCollectionWhere(collection, jsonKey: jsonKey, value: value));
  }

  Future<Map<String, dynamic>?> getSingleton(String name) async {
    final db = await _database();
    final rows = db.select(
      'SELECT json FROM singletons WHERE name = ?',
      [name],
    );
    if (rows.isEmpty) return null;
    return jsonDecode(rows.first['json'] as String) as Map<String, dynamic>;
  }

  Future<void> putSingleton(String name, Map<String, dynamic> value) async {
    final db = await _database();
    db.execute(
      'INSERT OR REPLACE INTO singletons (name, json) VALUES (?, ?)',
      [name, jsonEncode(value)],
    );
  }

  /// Disposes open resources and delegates to [close].
  Future<void> dispose() async {
    await close();
  }

  /// Whether the database connection is closed.
  bool get isDisposed => _db == null && _powerSyncDb == null;

  Future<void> close() async {
    final dir = await directory();
    final path = p.canonicalize(p.join(dir.path, fileName));
    final db = _databases.remove(path) ?? _db;
    try {
      db?.dispose();
    } catch (_) {}
    try {
      await _powerSyncDb?.close();
    } catch (_) {}
    _db = null;
    _powerSyncDb = null;
  }

  static Future<void> closeAll() async {
    for (final db in _databases.values) {
      try {
        db.dispose();
      } catch (_) {}
    }
    _databases.clear();
  }

  Future<sqlite.Database> _database() async {
    if (_db != null) return _db!;
    _ensureSqlite();
    final dir = await directory();
    if (!dir.existsSync()) {
      dir.createSync(recursive: true);
    }
    final path = p.canonicalize(p.join(dir.path, fileName));
    if (_databases.containsKey(path)) {
      _db = _databases[path];
      return _db!;
    }
    final db = sqlite.sqlite3.open(path);
    db.execute('PRAGMA journal_mode=WAL');
    db.execute('PRAGMA synchronous=NORMAL');
    db.execute('PRAGMA foreign_keys=ON');
    db.execute('''
      CREATE TABLE IF NOT EXISTS records (
        collection TEXT NOT NULL,
        id TEXT NOT NULL,
        json TEXT NOT NULL,
        batch_id TEXT GENERATED ALWAYS AS (json_extract(json, '\$.batchId')) VIRTUAL,
        created_at TEXT GENERATED ALWAYS AS (COALESCE(json_extract(json, '\$.recordedAt'), json_extract(json, '\$.createdAt'), json_extract(json, '\$.startDate'))) VIRTUAL,
        stage TEXT GENERATED ALWAYS AS (COALESCE(json_extract(json, '\$.feedingStage'), json_extract(json, '\$.stageKey'), json_extract(json, '\$.stage'))) VIRTUAL,
        PRIMARY KEY (collection, id)
      )
    ''');

    // Migration fallbacks for databases initialized prior to generated virtual columns
    try {
      db.execute("ALTER TABLE records ADD COLUMN batch_id TEXT GENERATED ALWAYS AS (json_extract(json, '\$.batchId')) VIRTUAL;");
    } catch (_) {}
    try {
      db.execute("ALTER TABLE records ADD COLUMN created_at TEXT GENERATED ALWAYS AS (COALESCE(json_extract(json, '\$.recordedAt'), json_extract(json, '\$.createdAt'), json_extract(json, '\$.startDate'))) VIRTUAL;");
    } catch (_) {}
    try {
      db.execute("ALTER TABLE records ADD COLUMN stage TEXT GENERATED ALWAYS AS (COALESCE(json_extract(json, '\$.feedingStage'), json_extract(json, '\$.stageKey'), json_extract(json, '\$.stage'))) VIRTUAL;");
    } catch (_) {}

    // High-performance B-tree indexes avoiding full table scans
    db.execute('CREATE INDEX IF NOT EXISTS idx_records_collection ON records(collection);');
    db.execute('CREATE INDEX IF NOT EXISTS idx_records_collection_batch ON records(collection, batch_id);');
    db.execute('CREATE INDEX IF NOT EXISTS idx_records_collection_created ON records(collection, created_at);');
    db.execute('CREATE INDEX IF NOT EXISTS idx_records_batch_created ON records(collection, batch_id, created_at DESC);');
    db.execute('CREATE INDEX IF NOT EXISTS idx_records_collection_stage ON records(collection, stage);');
    db.execute('CREATE INDEX IF NOT EXISTS idx_batches_id ON records(id);');
    db.execute('CREATE INDEX IF NOT EXISTS idx_logs_batch_id ON records(batch_id);');
    db.execute('CREATE INDEX IF NOT EXISTS idx_logs_created_at ON records(created_at);');
    db.execute('CREATE INDEX IF NOT EXISTS idx_batches_stage ON records(stage);');
    try {
      db.execute("CREATE INDEX IF NOT EXISTS idx_batches_stage_json ON records(json_extract(json, '\$.stage'));");
    } catch (_) {}

    db.execute('''
      CREATE TABLE IF NOT EXISTS singletons (
        name TEXT NOT NULL PRIMARY KEY,
        json TEXT NOT NULL
      )
    ''');

    _initPowerSyncTables(db);

    _db = db;
    _databases[path] = db;
    _migrateLegacyJson(dir, db);
    return db;
  }

  void _initPowerSyncTables(sqlite.Database db) {
    db.execute('''
      CREATE TABLE IF NOT EXISTS batches (
        id TEXT NOT NULL PRIMARY KEY,
        species TEXT,
        startDate TEXT,
        eggCount INTEGER,
        status TEXT,
        createdAt TEXT,
        strain TEXT,
        location TEXT,
        caretaker TEXT,
        feedMaterial TEXT,
        eggSource TEXT,
        rearingType TEXT,
        batchTag TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
      CREATE INDEX IF NOT EXISTS idx_batches_created ON batches(createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_batches_id ON batches(id);
    ''');

    db.execute('''
      CREATE TABLE IF NOT EXISTS feed_logs (
        id TEXT NOT NULL PRIMARY KEY,
        batchId TEXT,
        recordedAt TEXT,
        feedType TEXT,
        quantityGrams REAL,
        feedingStage TEXT,
        notes TEXT,
        isSkipped INTEGER,
        skipReason TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_feed_batch ON feed_logs(batchId);
      CREATE INDEX IF NOT EXISTS idx_feed_batch_recorded ON feed_logs(batchId, recordedAt DESC);
      CREATE INDEX IF NOT EXISTS idx_feed_stage ON feed_logs(feedingStage);
      CREATE INDEX IF NOT EXISTS idx_logs_batch_id ON feed_logs(batchId);
      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON feed_logs(recordedAt DESC);
    ''');

    db.execute('''
      CREATE TABLE IF NOT EXISTS mortality_logs (
        id TEXT NOT NULL PRIMARY KEY,
        batchId TEXT,
        recordedAt TEXT,
        count INTEGER,
        reason TEXT,
        disease TEXT,
        treatment TEXT,
        notes TEXT,
        isolated INTEGER,
        photoPath TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_mort_batch ON mortality_logs(batchId);
      CREATE INDEX IF NOT EXISTS idx_mort_batch_recorded ON mortality_logs(batchId, recordedAt DESC);
    ''');
  }

  static void _ensureSqlite() {
    if (_sqliteReady) return;
    if (Platform.isLinux) {
      open.overrideFor(
        OperatingSystem.linux,
        () => DynamicLibrary.open('libsqlite3.so.0'),
      );
    }
    _sqliteReady = true;
  }

  void _migrateLegacyJson(Directory dir, sqlite.Database db) {
    final metaRows = db.select(
      'SELECT json FROM singletons WHERE name = ?',
      [_metaKey],
    );
    var migrated = false;
    if (metaRows.isNotEmpty) {
      final meta = jsonDecode(metaRows.first['json'] as String) as Map<String, dynamic>;
      migrated = meta['jsonMigrated'] == true;
    }
    if (migrated) return;

    db.execute('BEGIN IMMEDIATE');
    try {
      for (final entry in collections.entries) {
        final existing = db.select(
          'SELECT 1 FROM records WHERE collection = ? LIMIT 1',
          [entry.key],
        );
        if (existing.isNotEmpty) continue;
        final items = _readJsonList(File(p.join(dir.path, entry.value)));
        final stmt = db.prepare(
          'INSERT OR REPLACE INTO records (collection, id, json) VALUES (?, ?, ?)',
        );

        sqlite.PreparedStatement? batchStmt;
        sqlite.PreparedStatement? feedStmt;
        sqlite.PreparedStatement? mortStmt;

        if (entry.key == 'batches') {
          batchStmt = db.prepare('''
            INSERT OR REPLACE INTO batches (
              id, species, startDate, eggCount, status, createdAt,
              strain, location, caretaker, feedMaterial, eggSource, rearingType, batchTag
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ''');
        } else if (entry.key == 'feed_logs') {
          feedStmt = db.prepare('''
            INSERT OR REPLACE INTO feed_logs (
              id, batchId, recordedAt, feedType, quantityGrams,
              feedingStage, notes, isSkipped, skipReason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ''');
        } else if (entry.key == 'mortality_logs') {
          mortStmt = db.prepare('''
            INSERT OR REPLACE INTO mortality_logs (
              id, batchId, recordedAt, count, reason,
              disease, treatment, notes, isolated, photoPath
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ''');
        }

        try {
          for (final item in items) {
            final id = item['id']?.toString();
            if (id == null || id.isEmpty) continue;
            stmt.execute([entry.key, id, jsonEncode(item)]);
            if (batchStmt != null) {
              batchStmt.execute([
                id,
                item['species']?.toString() ?? 'bombyx',
                item['startDate']?.toString() ?? DateTime.now().toIso8601String(),
                item['eggCount'] is int
                    ? item['eggCount']
                    : int.tryParse(item['eggCount']?.toString() ?? '') ?? 0,
                item['status']?.toString() ?? 'active',
                item['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
                item['strain']?.toString(),
                item['location']?.toString(),
                item['caretaker']?.toString(),
                item['feedMaterial']?.toString(),
                item['eggSource']?.toString(),
                item['rearingType']?.toString(),
                item['batchTag']?.toString(),
              ]);
            } else if (feedStmt != null) {
              feedStmt.execute([
                id,
                item['batchId']?.toString() ?? '',
                item['recordedAt']?.toString() ?? DateTime.now().toIso8601String(),
                item['feedType']?.toString() ?? 'mulberry',
                item['quantityGrams'] is num
                    ? (item['quantityGrams'] as num).toDouble()
                    : double.tryParse(item['quantityGrams']?.toString() ?? '') ?? 0.0,
                item['feedingStage']?.toString(),
                item['notes']?.toString(),
                (item['isSkipped'] == true || item['isSkipped'] == 1) ? 1 : 0,
                item['skipReason']?.toString(),
              ]);
            } else if (mortStmt != null) {
              mortStmt.execute([
                id,
                item['batchId']?.toString() ?? '',
                item['recordedAt']?.toString() ?? DateTime.now().toIso8601String(),
                item['count'] is int
                    ? item['count']
                    : int.tryParse(item['count']?.toString() ?? '') ?? 0,
                item['reason']?.toString(),
                item['disease']?.toString(),
                item['treatment']?.toString(),
                item['notes']?.toString(),
                (item['isolated'] == true || item['isolated'] == 1) ? 1 : 0,
                item['photoPath']?.toString(),
              ]);
            }
          }
        } finally {
          stmt.dispose();
          batchStmt?.dispose();
          feedStmt?.dispose();
          mortStmt?.dispose();
        }
      }

      for (final entry in singletons.entries) {
        final existing = db.select(
          'SELECT 1 FROM singletons WHERE name = ? LIMIT 1',
          [entry.key],
        );
        if (existing.isNotEmpty) continue;
        final object = _readJsonObject(File(p.join(dir.path, entry.value)));
        if (object == null) continue;
        db.execute(
          'INSERT OR REPLACE INTO singletons (name, json) VALUES (?, ?)',
          [entry.key, jsonEncode(object)],
        );
      }

      db.execute(
        'INSERT OR REPLACE INTO singletons (name, json) VALUES (?, ?)',
        [_metaKey, jsonEncode({'jsonMigrated': true})],
      );
      db.execute('COMMIT');
    } catch (_) {
      try {
        db.execute('ROLLBACK');
      } catch (_) {}
      rethrow;
    }
  }

  Map<String, dynamic> _batchRowToMap(sqlite.Row row) {
    return <String, dynamic>{
      'id': row['id'],
      'species': row['species'] ?? 'bombyx',
      'startDate': row['startDate'] ?? DateTime.now().toIso8601String(),
      'eggCount': row['eggCount'] is int
          ? row['eggCount']
          : int.tryParse(row['eggCount']?.toString() ?? '') ?? 0,
      'status': row['status'] ?? 'active',
      'createdAt': row['createdAt'] ?? DateTime.now().toIso8601String(),
      if (row['strain'] != null) 'strain': row['strain'],
      if (row['location'] != null) 'location': row['location'],
      if (row['caretaker'] != null) 'caretaker': row['caretaker'],
      if (row['feedMaterial'] != null) 'feedMaterial': row['feedMaterial'],
      if (row['eggSource'] != null) 'eggSource': row['eggSource'],
      if (row['rearingType'] != null) 'rearingType': row['rearingType'],
      if (row['batchTag'] != null) 'batchTag': row['batchTag'],
    };
  }

  Map<String, dynamic> _feedLogRowToMap(sqlite.Row row) {
    final isSkipped = row['isSkipped'] == 1 || row['isSkipped'] == true;
    return <String, dynamic>{
      'id': row['id'],
      'batchId': row['batchId'],
      'recordedAt': row['recordedAt'],
      'feedType': row['feedType'] ?? 'mulberry',
      'quantityGrams': (row['quantityGrams'] as num?)?.toDouble() ?? 0.0,
      if (row['feedingStage'] != null) 'feedingStage': row['feedingStage'],
      if (row['notes'] != null) 'notes': row['notes'],
      'isSkipped': isSkipped,
      if (row['skipReason'] != null) 'skipReason': row['skipReason'],
    };
  }

  Map<String, dynamic> _mortalityLogRowToMap(sqlite.Row row) {
    final isolated = row['isolated'] == 1 || row['isolated'] == true;
    return <String, dynamic>{
      'id': row['id'],
      'batchId': row['batchId'],
      'recordedAt': row['recordedAt'],
      'count': (row['count'] as num?)?.toInt() ?? 0,
      if (row['reason'] != null) 'reason': row['reason'],
      if (row['disease'] != null) 'disease': row['disease'],
      if (row['treatment'] != null) 'treatment': row['treatment'],
      if (row['notes'] != null) 'notes': row['notes'],
      'isolated': isolated,
      if (row['photoPath'] != null) 'photoPath': row['photoPath'],
    };
  }

  List<Map<String, dynamic>> _readJsonList(File file) {
    if (!file.existsSync()) return [];
    final contents = file.readAsStringSync();
    if (contents.trim().isEmpty) return [];
    final decoded = jsonDecode(contents);
    if (decoded is! List) return [];
    return [
      for (final item in decoded)
        if (item is Map)
          Map<String, dynamic>.from(item),
    ];
  }

  Map<String, dynamic>? _readJsonObject(File file) {
    if (!file.existsSync()) return null;
    final contents = file.readAsStringSync();
    if (contents.trim().isEmpty) return null;
    final decoded = jsonDecode(contents);
    if (decoded is! Map) return null;
    return Map<String, dynamic>.from(decoded);
  }
}
