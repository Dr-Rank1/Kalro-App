import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/utils/file_utils.dart';

void main() {
  group('FileUtils.atomicWriteAsString', () {
    late Directory tempDir;

    setUp(() async {
      tempDir = await Directory.systemTemp.createTemp('file_utils_test_');
    });

    tearDown(() async {
      if (await tempDir.exists()) {
        await tempDir.delete(recursive: true);
      }
    });

    test('writes content safely and creates missing parent directories', () async {
      final targetFile = File('${tempDir.path}/nested/dir/data.json');
      const testContent = '{"status":"ok","value":42}';

      await FileUtils.atomicWriteAsString(targetFile, testContent);

      expect(await targetFile.exists(), isTrue);
      expect(await targetFile.readAsString(), equals(testContent));
    });

    test('overwrites existing file contents without leaving temp files behind', () async {
      final targetFile = File('${tempDir.path}/data.txt');
      await targetFile.writeAsString('initial');

      await FileUtils.atomicWriteAsString(targetFile, 'updated content');

      expect(await targetFile.readAsString(), equals('updated content'));

      final files = await tempDir.list().toList();
      expect(files.length, equals(1));
      expect(files.first.path, equals(targetFile.path));
    });
  });
}
