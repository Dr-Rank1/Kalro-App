import '../l10n/translator.dart';

enum MilestoneType {
  hatch('Hatch'),
  instar('Instar'),
  moult('Moult'),
  mounting('Mounting'),
  spinning('Spinning'),
  cocoonHarvest('Cocoon harvest'),
  mothEmergence('Moth emergence');

  const MilestoneType(this._label);

  final String _label;

  String get label => _label.tr;
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

  bool get isPast {
    final now = DateTime.now();
    return effectiveDate.isBefore(DateTime(now.year, now.month, now.day));
  }

  bool get isToday {
    final now = DateTime.now();
    final day = effectiveDate;
    return day.year == now.year && day.month == now.month && day.day == now.day;
  }
}
