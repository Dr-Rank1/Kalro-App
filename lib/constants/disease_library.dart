class DiseaseInfo {
  const DiseaseInfo({
    required this.name,
    required this.signs,
    required this.action,
    this.seedLotRisk = false,
  });

  final String name;
  final String signs;
  final String action;
  final bool seedLotRisk;
}

/// Common sericulture diseases for mortality logging and the field guide.
class DiseaseLibrary {
  static const info = [
    DiseaseInfo(
      name: 'Grasserie (NPV)',
      signs: 'Shiny, swollen larvae; milky fluid if crushed. Often after crowding or heat.',
      action: 'Pick out sick worms immediately. Keep the bed dry and less crowded. Burn or bury the dead. Do not feed wet leaf.',
    ),
    DiseaseInfo(
      name: 'Flacherie (IFV)',
      signs: 'Soft, dark, foul-smelling larvae; they stop eating and hang limp.',
      action: 'Remove all sick and dead worms. Clean trays. Feed fresh, well-dried leaf. Reduce density.',
    ),
    DiseaseInfo(
      name: 'Pebrine',
      signs: 'Pepper-like black spots, slow growth, irregular moults. Can pass through eggs.',
      action: 'Treat as a seed-lot risk. Isolate the batch. Tell CRC / seed producer. Do not use moths from this lot for eggs.',
      seedLotRisk: true,
    ),
    DiseaseInfo(
      name: 'Muscardine',
      signs: 'Larvae stiffen and later show white or green powder (fungus).',
      action: 'Remove mummies. Dry the house. Improve ventilation. Do not overcrowd wet beds.',
    ),
    DiseaseInfo(
      name: 'Bacterial wilt',
      signs: 'Sudden collapse, watery body, bad smell.',
      action: 'Remove dead worms. Hygiene and dry leaf. Watch neighbouring trays.',
    ),
    DiseaseInfo(
      name: 'Unknown / other',
      signs: 'Anything that is not on this list.',
      action: 'Isolate, photograph if you can, and ask CRC. Record count so live larvae stay honest.',
    ),
  ];

  static List<String> get entries => info.map((e) => e.name).toList();

  static DiseaseInfo? byName(String? name) {
    if (name == null) return null;
    for (final item in info) {
      if (item.name == name) return item;
    }
    return null;
  }
}
