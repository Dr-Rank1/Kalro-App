import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/services/formula_engine.dart';

void main() {
  const engine = FormulaEngine();

  test('evaluates basic arithmetic expressions', () {
    expect(engine.evaluate('2 + 3 * 4', {}), 14.0);
    expect(engine.evaluate('(2 + 3) * 4', {}), 20.0);
    expect(engine.evaluate('10 / 2 - 1', {}), 4.0);
    expect(engine.evaluate('2 ^ 3 + 1', {}), 9.0);
  });

  test('evaluates variables from sericulture context', () {
    final vars = {
      FormulaVariables.totalWeightGrams: 2000.0,
      FormulaVariables.cocoonCount: 1000.0,
      FormulaVariables.defectiveCount: 50.0,
      FormulaVariables.eggCount: 1200.0,
      FormulaVariables.pricePerKg: 450.0,
      FormulaVariables.renditta: 7.5,
      FormulaVariables.goodCount: 950.0,
    };

    // Average cocoon weight: 2000 / 1000 = 2.0g
    expect(
      engine.evaluate('totalWeightGrams / cocoonCount', vars),
      closeTo(2.0, 0.001),
    );

    // ERR%: (950 / 1200) * 100 = 79.166%
    expect(
      engine.evaluate('(goodCount / eggCount) * 100', vars),
      closeTo(79.166, 0.01),
    );

    // Gross revenue: (2000 / 1000) * 450 = 900 KES
    expect(
      engine.evaluate('(totalWeightGrams / 1000) * pricePerKg', vars),
      closeTo(900.0, 0.01),
    );

    // Estimated silk yield: (2000 / 1000) / 7.5 = 0.266 kg
    expect(
      engine.evaluate('(totalWeightGrams / 1000) / renditta', vars),
      closeTo(0.266, 0.01),
    );
  });

  test('returns 0 for empty or invalid expressions safely', () {
    expect(engine.evaluate('', {}), 0.0);
    expect(engine.evaluate('   ', {}), 0.0);
    expect(engine.evaluate('10 / 0', {}), 0.0);
  });
}
