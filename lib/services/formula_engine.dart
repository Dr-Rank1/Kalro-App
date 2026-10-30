import 'dart:math' as math;

/// Standard variables available to sericulture formulas.
class FormulaVariables {
  static const cocoonCount = 'cocoonCount';
  static const totalWeightGrams = 'totalWeightGrams';
  static const defectiveCount = 'defectiveCount';
  static const goodCount = 'goodCount';
  static const averageCocoonWeightGrams = 'averageCocoonWeightGrams';
  static const shellWeightGrams = 'shellWeightGrams';
  static const shellRatioPercent = 'shellRatioPercent';
  static const eggCount = 'eggCount';
  static const renditta = 'renditta';
  static const pricePerKg = 'pricePerKg';
  static const totalCosts = 'totalCosts';
}

/// Pre-configured standard sericulture formulas recommended by KALRO.
class PresetFormula {
  const PresetFormula({
    required this.id,
    required this.name,
    required this.expression,
    required this.description,
    required this.unit,
  });

  final String id;
  final String name;
  final String expression;
  final String description;
  final String unit;
}

/// Evaluates and manages user-defined and preset sericulture equations.
class FormulaEngine {
  const FormulaEngine();

  static const List<PresetFormula> defaultPresets = [
    PresetFormula(
      id: 'avg_weight',
      name: 'Average Cocoon Weight',
      expression: 'totalWeightGrams / cocoonCount',
      description: 'Single cocoon weight average across the harvested lot.',
      unit: 'g',
    ),
    PresetFormula(
      id: 'err_percent',
      name: 'Effective Rearing Rate (ERR)',
      expression: '(goodCount / eggCount) * 100',
      description: 'Percentage of viable eggs that produced harvestable cocoons.',
      unit: '%',
    ),
    PresetFormula(
      id: 'defect_rate',
      name: 'Defect Rate',
      expression: '(defectiveCount / cocoonCount) * 100',
      description: 'Percentage of flawed or unreelable cocoons.',
      unit: '%',
    ),
    PresetFormula(
      id: 'est_silk_yield',
      name: 'Estimated Raw Silk Yield',
      expression: '(totalWeightGrams / 1000) / renditta',
      description: 'Expected raw silk output in kilograms based on Renditta.',
      unit: 'kg',
    ),
    PresetFormula(
      id: 'gross_revenue',
      name: 'Gross Cocoon Revenue',
      expression: '(totalWeightGrams / 1000) * pricePerKg',
      description: 'Total revenue from green cocoon sales.',
      unit: 'KES',
    ),
    PresetFormula(
      id: 'net_margin',
      name: 'Net Farm Margin',
      expression: '((totalWeightGrams / 1000) * pricePerKg) - totalCosts',
      description: 'Gross cocoon revenue minus feed, seed, and labor expenses.',
      unit: 'KES',
    ),
  ];

  /// Parses and evaluates [expression] using the provided [variables].
  double evaluate(String expression, Map<String, double> variables) {
    final sanitized = expression.trim();
    if (sanitized.isEmpty) return 0.0;
    final tokens = _tokenize(sanitized);
    final rpn = _toRpn(tokens);
    return _evaluateRpn(rpn, variables);
  }

  List<String> _tokenize(String expression) {
    final tokens = <String>[];
    final buffer = StringBuffer();

    for (var i = 0; i < expression.length; i++) {
      final c = expression[i];
      if (c == ' ' || c == '\t' || c == '\n') continue;

      if ('+-*/^(),'.contains(c)) {
        if (buffer.isNotEmpty) {
          tokens.add(buffer.toString());
          buffer.clear();
        }
        tokens.add(c);
      } else {
        buffer.write(c);
      }
    }
    if (buffer.isNotEmpty) {
      tokens.add(buffer.toString());
    }
    return tokens;
  }

  List<String> _toRpn(List<String> tokens) {
    final output = <String>[];
    final ops = <String>[];

    final precedence = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '^': 3,
    };

    for (var i = 0; i < tokens.length; i++) {
      final t = tokens[i];
      if (double.tryParse(t) != null || _isIdentifier(t)) {
        output.add(t);
      } else if (t == '(') {
        ops.add(t);
      } else if (t == ')') {
        while (ops.isNotEmpty && ops.last != '(') {
          output.add(ops.removeLast());
        }
        if (ops.isNotEmpty && ops.last == '(') {
          ops.removeLast();
        }
      } else if (precedence.containsKey(t)) {
        // Handle unary minus
        if (t == '-' && (i == 0 || '(*+/-^'.contains(tokens[i - 1]))) {
          output.add('0');
        }
        while (ops.isNotEmpty &&
            ops.last != '(' &&
            (precedence[ops.last] ?? 0) >= (precedence[t] ?? 0)) {
          output.add(ops.removeLast());
        }
        ops.add(t);
      }
    }

    while (ops.isNotEmpty) {
      final op = ops.removeLast();
      if (op != '(' && op != ')') output.add(op);
    }

    return output;
  }

  double _evaluateRpn(List<String> rpn, Map<String, double> variables) {
    final stack = <double>[];

    for (final token in rpn) {
      final numVal = double.tryParse(token);
      if (numVal != null) {
        stack.add(numVal);
      } else if (_isIdentifier(token)) {
        final val = variables[token] ?? 0.0;
        stack.add(val);
      } else if ('+-*/^'.contains(token)) {
        if (stack.length < 2) continue;
        final b = stack.removeLast();
        final a = stack.removeLast();
        switch (token) {
          case '+':
            stack.add(a + b);
            break;
          case '-':
            stack.add(a - b);
            break;
          case '*':
            stack.add(a * b);
            break;
          case '/':
            stack.add(b == 0 ? 0.0 : a / b);
            break;
          case '^':
            stack.add(math.pow(a, b).toDouble());
            break;
        }
      }
    }

    return stack.isEmpty ? 0.0 : stack.last;
  }

  bool _isIdentifier(String s) {
    if (s.isEmpty) return false;
    final first = s.codeUnitAt(0);
    final isLetter = (first >= 65 && first <= 90) ||
        (first >= 97 && first <= 122) ||
        first == 95;
    return isLetter;
  }
}
