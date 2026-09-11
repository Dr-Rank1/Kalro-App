import 'dart:io';

class FileUtils {
  /// Writes [contents] to [file] atomically.
  /// 
  /// This prevents data corruption (e.g. empty or truncated files) if the app
  /// crashes or loses power during the write operation.
  static Future<void> atomicWriteAsString(File file, String contents) async {
    final tempFile = File('${file.path}.tmp');
    await tempFile.writeAsString(contents, flush: true);
    await tempFile.rename(file.path);
  }
}
