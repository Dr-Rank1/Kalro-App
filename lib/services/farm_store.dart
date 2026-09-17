import 'dart:convert';
import 'dart:ffi';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/open.dart';
import 'package:sqlite3/sqlite3.dart';

/// One SQLite file per farm (`kalro.db`). Records stay JSON so the rest of
/// the app does not need SQL tables per model. CRC backups stay JSON files.
class FarmStore {
  FarmStore({Directory? directory}) : _directory = directory;

  final Directory? _directory;
  Database? _db;
  static var _sqliteReady = false;

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

  Future<List<Map<String, dynamic>>> getCollection(String name) async {
    final db = await _database();
    final rows = db.select(
      'SELECT json FROM records WHERE collection = ? ORDER BY rowid',
      [name],
    );
    return [
      for (final row in rows)
        jsonDecode(row['json'] as String) as Map<String, dynamic>,
    ];
  }

  Future<void> upsert(
    String collection,
    String id,
    Map<String, dynamic> record,
  ) async {
    final db = await _database();
    db.execute(
      'INSERT OR REPLACE INTO records (collection, id, json) VALUES (?, ?, ?)',
      [collection, id, jsonEncode(record)],
    );
  }

  Future<void> delete(String collection, String id) async {
    final db = await _database();
    db.execute(
      'DELETE FROM records WHERE collection = ? AND id = ?',
      [collection, id],
    );
  }

  Future<void> replaceCollection(
    String collection,
    List<Map<String, dynamic>> records,
  ) async {
    final db = await _database();
    db.execute('BEGIN IMMEDIATE');
    try {
      db.execute('DELETE FROM records WHERE collection = ?', [collection]);
      final stmt = db.prepare(
        'INSERT INTO records (collection, id, json) VALUES (?, ?, ?)',
      );
      try {
        for (final record in records) {
          final id = record['id']?.toString();
          if (id == null || id.isEmpty) continue;
          stmt.execute([collection, id, jsonEncode(record)]);
        }
      } finally {
        stmt.dispose();
      }
      db.execute('COMMIT');
    } catch (_) {
      db.execute('ROLLBACK');
      rethrow;
    }
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

  Future<void> close() async {
    _db?.dispose();
    _db = null;
  }

  Future<Database> _database() async {
    if (_db != null) return _db!;
    _ensureSqlite();
    final dir = await directory();
    if (!dir.existsSync()) {
      dir.createSync(recursive: true);
    }
    final path = p.join(dir.path, fileName);
    final db = sqlite3.open(path);
    db.execute('PRAGMA journal_mode=WAL');
    db.execute('PRAGMA synchronous=NORMAL');
    db.execute('PRAGMA foreign_keys=ON');
    db.execute('''
      CREATE TABLE IF NOT EXISTS records (
        collection TEXT NOT NULL,
        id TEXT NOT NULL,
        json TEXT NOT NULL,
        PRIMARY KEY (collection, id)
      )
    ''');
    db.execute('''
      CREATE TABLE IF NOT EXISTS singletons (
        name TEXT NOT NULL PRIMARY KEY,
        json TEXT NOT NULL
      )
    ''');
    _db = db;
    _migrateLegacyJson(dir, db);
    return db;
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

  void _migrateLegacyJson(Directory dir, Database db) {
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
        try {
          for (final item in items) {
            final id = item['id']?.toString();
            if (id == null || id.isEmpty) continue;
            stmt.execute([entry.key, id, jsonEncode(item)]);
          }
        } finally {
          stmt.dispose();
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
      db.execute('ROLLBACK');
      rethrow;
    }
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
