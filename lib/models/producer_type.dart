import '../l10n/translator.dart';

enum ProducerType {
  seedProducer('Registered Seed Producer'),
  chawkiRearingCenter('Rearing Support Unit');

  const ProducerType(this._label);

  final String _label;

  String get label => _label.tr;
}
