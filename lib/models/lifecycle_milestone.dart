enum MilestoneType {
  hatch('Hatch'),
  instar('Instar'),
  moult('Moult'),
  mounting('Mounting'),
  spinning('Spinning'),
  cocoonHarvest('Cocoon harvest'),
  mothEmergence('Moth emergence');

  const MilestoneType(this.label);

  final String label;
}

class LifecycleMilestone {
  const LifecycleMilestone({
    required this.type,
    required this.label,
    required this.expectedDate,
    this.stageKey,
    this.instarNumber,
    this.observedDate,
    this.typicalDate,
  });

  final MilestoneType type;
  final String label;
  final DateTime expectedDate;
  final String? stageKey;
  final int? instarNumber;
  final DateTime? observedDate;

  /// Date if weather and feeding were typical. Null when no adjustment applied.
  final DateTime? typicalDate;

  bool get isObserved => observedDate != null;

  DateTime get effectiveDate => observedDate ?? expectedDate;

  int? get daysVsTypical {
    if (typicalDate == null) return null;
    final expected = DateTime(expectedDate.year, expectedDate.month, expectedDate.day);
    final typical = DateTime(typicalDate!.year, typicalDate!.month, typicalDate!.day);
    return expected.difference(typical).inDays;
  }

  bool get isPast => expectedDate.isBefore(DateTime.now());

  bool get isToday {
    final now = DateTime.now();
    return expectedDate.year == now.year &&
        expectedDate.month == now.month &&
        expectedDate.day == now.day;
  }
}
