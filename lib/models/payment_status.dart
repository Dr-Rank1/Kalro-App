import '../l10n/translator.dart';

enum PaymentStatus {
  pending('Pending'),
  settled('Settled');

  const PaymentStatus(this._label);

  final String _label;

  String get label => _label.tr;
}
