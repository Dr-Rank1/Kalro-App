import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';

class PinHasher {
  static String hashPin(String pin, {String? salt}) {
    final effectiveSalt = salt ?? _generateSalt();
    final digest = sha256.convert(utf8.encode('$effectiveSalt:$pin'));
    return '$effectiveSalt:${digest.toString()}';
  }

  static bool verifyPin(String pin, String storedHash) {
    final parts = storedHash.split(':');
    if (parts.length != 2) return false;
    final salt = parts[0];
    final expected = hashPin(pin, salt: salt);
    return expected == storedHash;
  }

  static String _generateSalt() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    return base64Url.encode(bytes);
  }
}
