import 'package:flutter/material.dart';

class FeedSkipReasonOption {
  const FeedSkipReasonOption({
    required this.id,
    required this.label,
    required this.description,
    required this.icon,
  });

  final String id;
  final String label;
  final String description;
  final IconData icon;
}

class FeedSkipReasons {
  static const moultRest = 'Moult rest';
  static const leafShortage = 'Leaf shortage';
  static const adverseWeather = 'Adverse weather / Wet leaf';
  static const bedCleaning = 'Bed cleaning / Fasting';
  static const diseaseIsolation = 'Disease check / Isolation';
  static const excessHeat = 'Excess heat (>30°C)';
  static const other = 'Other reason';

  static const List<FeedSkipReasonOption> options = [
    FeedSkipReasonOption(
      id: 'moult_rest',
      label: moultRest,
      description: 'Larvae are quiescent and shedding cuticle. Feeding must stop.',
      icon: Icons.pause_circle_outline,
    ),
    FeedSkipReasonOption(
      id: 'leaf_shortage',
      label: leafShortage,
      description: 'Fresh quality mulberry or castor leaf is temporarily unavailable.',
      icon: Icons.eco_outlined,
    ),
    FeedSkipReasonOption(
      id: 'adverse_weather',
      label: adverseWeather,
      description: 'Heavy rainfall or excess humidity; wet leaves induce flacherie.',
      icon: Icons.water_drop_outlined,
    ),
    FeedSkipReasonOption(
      id: 'bed_cleaning',
      label: bedCleaning,
      description: 'Larvae are fasting before net placing and transfer to clean trays.',
      icon: Icons.cleaning_services_outlined,
    ),
    FeedSkipReasonOption(
      id: 'disease_isolation',
      label: diseaseIsolation,
      description: 'Bed dusted with lime/bleaching powder or sick worms segregated.',
      icon: Icons.healing_outlined,
    ),
    FeedSkipReasonOption(
      id: 'excess_heat',
      label: excessHeat,
      description: 'High house temperature (>30°C); feeding held until cool evening.',
      icon: Icons.thermostat_outlined,
    ),
    FeedSkipReasonOption(
      id: 'other',
      label: other,
      description: 'Custom factor or situation (recorded in notes).',
      icon: Icons.edit_note_outlined,
    ),
  ];

  static FeedSkipReasonOption byLabelOrId(String? val) {
    if (val == null) return options.first;
    for (final opt in options) {
      if (opt.id == val || opt.label == val) return opt;
    }
    return options.first;
  }
}
