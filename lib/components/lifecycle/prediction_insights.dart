import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/rearing_conditions.dart';
import '../../services/prediction_adjuster.dart';
import '../../theme/kalro_colors.dart';

class PredictionScenarioBar extends StatelessWidget {
  const PredictionScenarioBar({
    super.key,
    required this.selected,
    required this.onSelected,
    this.includeRecorded = false,
  });

  /// Null means "Recorded" when [includeRecorded] is true.
  final RearingScenario? selected;
  final ValueChanged<RearingScenario?> onSelected;
  final bool includeRecorded;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (includeRecorded)
          FilterChip(
            label: const Text('Recorded'),
            selected: selected == null,
            selectedColor: KalroColors.peach,
            checkmarkColor: KalroColors.primaryGreen,
            labelStyle: GoogleFonts.poppins(fontSize: 12),
            onSelected: (_) => onSelected(null),
          ),
        ...RearingScenario.values.map((scenario) {
          final isSelected = scenario == selected;
          return FilterChip(
            label: Text(scenario.label),
            selected: isSelected,
            selectedColor: KalroColors.peach,
            checkmarkColor: KalroColors.primaryGreen,
            labelStyle: GoogleFonts.poppins(fontSize: 12),
            onSelected: (_) => onSelected(scenario),
          );
        }),
      ],
    );
  }
}

class PredictionConditionsBanner extends StatelessWidget {
  const PredictionConditionsBanner({
    super.key,
    required this.adjustment,
    this.logged = false,
    this.harvestShiftDays,
    this.shiftSummary,
    this.snapshot,
  });

  final PredictionAdjustment adjustment;
  final bool logged;
  final int? harvestShiftDays;
  final String? shiftSummary;
  final String? snapshot;

  @override
  Widget build(BuildContext context) {
    final headline = shiftSummary ?? _harvestLabel(harvestShiftDays);

    if (!adjustment.affectsDates && adjustment.reasons.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: KalroColors.divider),
        ),
        child: Row(
          children: [
            const Icon(Icons.thermostat_outlined, color: KalroColors.headerGreen),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    logged
                        ? 'Weather and feeding look typical — dates follow the standard cycle.'
                        : 'Dates use typical durations. Log temperature, humidity, and feeding to refine them, or try a scenario.',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: KalroColors.textMuted,
                    ),
                  ),
                  if (snapshot != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      snapshot!,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: KalroColors.textDark,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.peach),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            logged ? 'Logged conditions affecting dates' : 'How this scenario moves dates',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: KalroColors.headerGreen,
            ),
          ),
          if (snapshot != null) ...[
            const SizedBox(height: 4),
            Text(
              snapshot!,
              style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textDark),
            ),
          ],
          if (headline != null) ...[
            const SizedBox(height: 6),
            Text(
              headline,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: KalroColors.accentBrown,
              ),
            ),
          ],
          const SizedBox(height: 8),
          ...adjustment.reasons.map(
            (reason) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 3),
                    child: Icon(Icons.circle, size: 6, color: KalroColors.accentBrown),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      reason,
                      style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textDark),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String? _harvestLabel(int? shift) {
    if (shift == null || shift == 0) return null;
    return shift > 0
        ? 'Harvest ~$shift day${shift == 1 ? '' : 's'} later than typical'
        : 'Harvest ~${-shift} day${shift == -1 ? '' : 's'} earlier than typical';
  }
}

class LifecyclePlanHomeCard extends StatelessWidget {
  const LifecyclePlanHomeCard({
    super.key,
    required this.onOpenPlanner,
    this.nextLabel,
    this.nextWhen,
    this.conditionNote,
  });

  final VoidCallback onOpenPlanner;
  final String? nextLabel;
  final String? nextWhen;
  final String? conditionNote;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onOpenPlanner,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: KalroColors.headerGreen.withValues(alpha: 0.25)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: KalroColors.headerGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.auto_graph_outlined, color: KalroColors.headerGreen),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Lifecycle plan',
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      nextLabel == null
                          ? 'See hatch, harvest, and moth dates. Test cool weather, heat, or short leaf.'
                          : '$nextLabel · $nextWhen',
                      style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                    ),
                    if (conditionNote != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        conditionNote!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: KalroColors.accentBrown,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: KalroColors.textLight),
            ],
          ),
        ),
      ),
    );
  }
}
