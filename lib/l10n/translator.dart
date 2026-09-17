import 'sw_messages.dart';

/// Single translation path for farmer-facing copy.
///
/// [AppLocalizations] still drives generated ARB keys (nav, a few dashboard
/// labels). Everything else — including `.tr` and domain labels — goes through
/// this class so the Swahili toggle cannot miss a screen.
class Translator {
  static String currentLanguage = 'en';

  static bool get isSwahili {
    final lang = currentLanguage.toLowerCase();
    return lang.startsWith('sw') || lang == 'swahili' || lang == 'kiswahili';
  }

  static String get dateLocale => isSwahili ? 'sw' : 'en';

  static String translate(String text) {
    if (text.isEmpty || !isSwahili) return text;
    return _translateSwahili(text);
  }

  static String _translateSwahili(String text) {
    final exact = _lookupExact(text);
    if (exact != null) return exact;

    final fromTemplate = _fromTemplate(text);
    if (fromTemplate != null) return fromTemplate;

    if (text.contains(' · ')) {
      return text.split(' · ').map(_translateSwahili).join(' · ');
    }

    for (final entry in swahiliPrefixes.entries) {
      if (text.startsWith(entry.key) && text.length > entry.key.length) {
        return entry.value +
            _translateSwahili(text.substring(entry.key.length));
      }
    }

    for (final entry in swahiliSuffixes.entries) {
      if (text.endsWith(entry.key) && text.length > entry.key.length) {
        return _translateSwahili(
              text.substring(0, text.length - entry.key.length),
            ) +
            entry.value;
      }
    }

    return text;
  }

  static String? _lookupExact(String text) {
    final exact = swahiliMessages[text];
    if (exact != null) return exact;

    final trimmed = text.trim();
    if (trimmed != text) {
      final hit = swahiliMessages[trimmed];
      if (hit != null) return hit;
    }

    final lower = trimmed.toLowerCase();
    for (final entry in swahiliMessages.entries) {
      if (entry.key.toLowerCase() == lower) return entry.value;
    }
    return null;
  }

  static String? _fromTemplate(String text) {
    Map<String, String>? bestVars;
    String? bestValue;
    var bestKeyLen = -1;

    for (final entry in swahiliMessages.entries) {
      if (!entry.key.contains('{')) continue;
      final vars = _templateMatch(entry.key, text);
      if (vars == null) continue;
      if (entry.key.length > bestKeyLen) {
        bestKeyLen = entry.key.length;
        bestVars = vars;
        bestValue = entry.value;
      }
    }
    if (bestVars == null || bestValue == null) return null;

    var out = bestValue;
    bestVars.forEach((key, value) {
      out = out.replaceAll('{$key}', _translateSwahili(value));
    });
    return out;
  }

  static Map<String, String>? _templateMatch(String template, String text) {
    final vars = <String>[];
    final pattern = StringBuffer('^');
    var i = 0;
    while (i < template.length) {
      if (template.codeUnitAt(i) == 0x7B) {
        final end = template.indexOf('}', i);
        if (end < 0) return null;
        vars.add(template.substring(i + 1, end));
        pattern.write(_captureGroup(vars.last));
        i = end + 1;
      } else {
        pattern.write(RegExp.escape(template[i]));
        i++;
      }
    }
    pattern.write(r'$');
    final match = RegExp(pattern.toString(), dotAll: true).firstMatch(text);
    if (match == null) return null;
    final map = <String, String>{};
    for (var n = 0; n < vars.length; n++) {
      map[vars[n]] = match.group(n + 1)!;
    }
    return map;
  }

  static String _captureGroup(String name) {
    const numeric = {
      'n',
      'g',
      'd',
      'pct',
      'temp',
      'min',
      'max',
      'today',
      'stock',
      'remaining',
      'live',
      'start',
      'code',
    };
    if (numeric.contains(name)) return r'([\d.,+\-–~]+)';
    return r'(.+?)';
  }

  /// Translate a template that uses `{name}` placeholders.
  static String fill(String template, Map<String, String> vars) {
    var out = translate(template);
    vars.forEach((key, value) {
      out = out.replaceAll('{$key}', translate(value));
    });
    return out;
  }
}

extension TranslationExtension on String {
  String get tr => Translator.translate(this);
}
