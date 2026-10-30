import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../l10n/translator.dart';

class AudioGuidanceService {
  AudioGuidanceService({FlutterTts? tts}) : _tts = tts ?? FlutterTts();

  final FlutterTts _tts;
  bool _initialized = false;
  bool _isSpeaking = false;

  bool get isSpeaking => _isSpeaking;

  Future<void> _init() async {
    if (_initialized) return;
    try {
      if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
        await _tts.setSpeechRate(0.48);
        await _tts.setVolume(1.0);
        await _tts.setPitch(1.0);
      }
      _tts.setStartHandler(() => _isSpeaking = true);
      _tts.setCompletionHandler(() => _isSpeaking = false);
      _tts.setErrorHandler((msg) => _isSpeaking = false);
      _initialized = true;
    } catch (_) {
      // Graceful fallback on desktop or unsupported devices
    }
  }

  Future<void> speak(String text) async {
    if (text.trim().isEmpty) return;
    try {
      await _init();
      final lang = Translator.currentLanguage;
      if (lang == 'sw') {
        try {
          await _tts.setLanguage('sw');
        } catch (_) {
          await _tts.setLanguage('en');
        }
      } else {
        await _tts.setLanguage('en');
      }
      await _tts.stop();
      await _tts.speak(text);
    } catch (_) {
      // Audio guidance is non-blocking on platforms without speech engine
    }
  }

  Future<void> speakTodayPlan({
    required String species,
    required String stage,
    required double suggestedGrams,
    required bool isMoult,
    required String actionTitle,
  }) async {
    final lang = Translator.currentLanguage;
    final String message;

    if (lang == 'sw') {
      if (isMoult) {
        message = 'Kundi la $species. Hatua ya $stage. Leo ni siku ya kupumzika kuvua ngozi. Usilishe mabuu chakula chochote leo.';
      } else if (suggestedGrams > 0) {
        message = 'Kundi la $species. Hatua ya $stage. Lisha gramu ${suggestedGrams.round()} za majani leo. $actionTitle.';
      } else {
        message = 'Kundi la $species. Hatua ya $stage. $actionTitle.';
      }
    } else {
      if (isMoult) {
        message = 'Batch $species. Stage $stage. Today is a moult rest day. Do not feed larvae today. Allow them to shed.';
      } else if (suggestedGrams > 0) {
        message = 'Batch $species. Stage $stage. Feed ${suggestedGrams.round()} grams of fresh leaf today. $actionTitle.';
      } else {
        message = 'Batch $species. Stage $stage. $actionTitle.';
      }
    }

    await speak(message);
  }

  Future<void> stop() async {
    try {
      await _tts.stop();
      _isSpeaking = false;
    } catch (_) {}
  }
}
