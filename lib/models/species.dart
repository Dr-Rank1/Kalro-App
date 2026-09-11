enum Species {
  eri('Eri', 'Samia ricini'),
  bombyx('Bombyx mori', 'Bombyx mori');

  const Species(this.label, this.scientificName);

  final String label;
  final String scientificName;
}
