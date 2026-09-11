import 'package:intl/intl.dart';

/// Kenyan shilling formatting for Kalro Sericulture.
abstract final class KalroFormatters {
  static NumberFormat get currency => NumberFormat.currency(
        locale: 'en_KE',
        symbol: 'KSh ',
        decimalDigits: 0,
      );

  static String formatCurrency(num amount) => currency.format(amount);

  static const currencyPrefix = 'KSh ';
}
