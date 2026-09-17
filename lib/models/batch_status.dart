import '../l10n/translator.dart';

enum BatchStatus {
  active('Active'),
  mounting('Mounting'),
  cocooning('Cocooning'),
  harvested('Harvested'),
  closed('Closed');

  const BatchStatus(this._label);

  final String _label;

  String get label => _label.tr;
}
