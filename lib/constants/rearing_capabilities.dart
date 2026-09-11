import 'package:flutter/material.dart';

enum RearingCapabilityKind {
  cycles,
  lifecycle,
  feeding,
  growth,
  mortality,
  cocoon,
  compare,
  reports,
}

class RearingCapability {
  const RearingCapability({
    required this.number,
    required this.kind,
    required this.title,
    required this.description,
    required this.icon,
  });

  final int number;
  final RearingCapabilityKind kind;
  final String title;
  final String description;
  final IconData icon;

  static const all = [
    RearingCapability(
      number: 1,
      kind: RearingCapabilityKind.cycles,
      title: 'Plan and track rearing cycles',
      description: 'Create batches and follow each cycle from egg to harvest.',
      icon: Icons.calendar_month_outlined,
    ),
    RearingCapability(
      number: 2,
      kind: RearingCapabilityKind.lifecycle,
      title: 'Predict lifecycle dates',
      description:
          'Hatch, harvest, and moth dates that move with weather and how much leaf you give.',
      icon: Icons.auto_graph_outlined,
    ),
    RearingCapability(
      number: 3,
      kind: RearingCapabilityKind.feeding,
      title: 'Record feeding schedules',
      description: 'Log daily feed type and quantity per batch.',
      icon: Icons.restaurant_outlined,
    ),
    RearingCapability(
      number: 4,
      kind: RearingCapabilityKind.growth,
      title: 'Monitor larval growth stages',
      description: 'Mark observed instars to keep predictions accurate.',
      icon: Icons.timeline_outlined,
    ),
    RearingCapability(
      number: 5,
      kind: RearingCapabilityKind.mortality,
      title: 'Record mortality and disease',
      description: 'Track losses, disease, treatment, and environment stress.',
      icon: Icons.healing_outlined,
    ),
    RearingCapability(
      number: 6,
      kind: RearingCapabilityKind.cocoon,
      title: 'Analyze cocoon quality and yield',
      description: 'Record harvest weight, count, and shell samples.',
      icon: Icons.egg_outlined,
    ),
    RearingCapability(
      number: 7,
      kind: RearingCapabilityKind.compare,
      title: 'Compare batch performance',
      description: 'Survival, feed use, and side-by-side batch charts.',
      icon: Icons.compare_arrows_outlined,
    ),
    RearingCapability(
      number: 8,
      kind: RearingCapabilityKind.reports,
      title: 'Productivity and profitability reports',
      description: 'Export CSV and PDF for farm records and finance.',
      icon: Icons.assessment_outlined,
    ),
  ];
}
