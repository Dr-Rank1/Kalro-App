import '../l10n/translator.dart';

enum PaymentDirection {
  receivable('Receivable'),
  payable('Payable');

  const PaymentDirection(this._label);

  final String _label;

  String get label => _label.tr;
}
