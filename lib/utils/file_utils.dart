import 'dart:io';

class FileUtils {
  /// Writes [contents] to [file] atomically.
  /// 
  /// This prevents data corruption (e.g. empty or truncated files) if the app
  /// crashes or loses power during the write operation.
  static Future<void> atomicWriteAsString(File file, String contents) async {
    final parentDir = file.parent;
    if (!await parentDir.exists()) {
      await parentDir.create(recursive: true);
    }
    final tempFile = File('${file.path}.${DateTime.now().microsecondsSinceEpoch}.tmp');
    await tempFile.writeAsString(contents, flush: true);
    try {
      if (Platform.isWindows && await file.exists()) {
        await file.delete();
      }
      await tempFile.rename(file.path);
    } catch (_) {
      await tempFile.copy(file.path);
      try {
        await tempFile.delete();
      } catch (_) {}
    }
  }
}