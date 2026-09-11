import 'package:flutter/material.dart';

import '../../models/species.dart';

class KalroSpeciesDropdown extends StatelessWidget {
  const KalroSpeciesDropdown({
    super.key,
    required this.value,
    required this.onChanged,
    this.enabled = true,
  });

  final Species value;
  final ValueChanged<Species?>? onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Species>(
      initialValue: value,
      decoration: const InputDecoration(
        labelText: 'Species',
        border: OutlineInputBorder(),
      ),
      items: Species.values
          .map(
            (species) => DropdownMenuItem(
              value: species,
              child: Text('${species.label} (${species.scientificName})'),
            ),
          )
          .toList(),
      onChanged: enabled
          ? (value) {
              if (value != null) onChanged?.call(value);
            }
          : null,
    );
  }
}
