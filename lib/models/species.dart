import '../l10n/translator.dart';

enum Species {
  eri('Eri', 'Samia ricini'),
  bombyx('Bombyx mori', 'Bombyx mori');

  const Species(this._label, this.scientificName);

  final String _label;
  final String scientificName;

  String get label => _label.tr;
}
