import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/rearing_conditions.dart';
import '../../services/prediction_adjuster.dart';
import '../../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class PredictionScenarioBar extends StatelessWidget {
  PredictionScenarioBar({
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
            label: Text('Recorded'.tr),
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
  PredictionConditionsBanner({
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
        padding: EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: KalroColors.divider),
        ),
        child: Row(
          children: [
            Icon(Icons.thermostat_outlined, color: KalroColors.headerGreen),
            SizedBox(width: 10),
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
                    SizedBox(height: 4),
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
      padding: EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.peach),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            logged
                ? 'Logged conditions affecting dates'
                : 'How this scenario moves dates',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: KalroColors.headerGreen,
            ),
          ),
          if (snapshot != null) ...[
            SizedBox(height: 4),
            Text(
              snapshot!,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: KalroColors.textDark,
              ),
            ),
          ],
          if (headline != null) ...[
            SizedBox(height: 6),
            Text(
              headline,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: KalroColors.accentBrown,
              ),
            ),
          ],
          SizedBox(height: 8),
          ...adjustment.reasons.map(
            (reason) => Padding(
              padding: EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: EdgeInsets.only(top: 3),
                    child: Icon(
                      Icons.circle,
                      size: 6,
                      color: KalroColors.accentBrown,
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      reason,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textDark,
                      ),
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
  LifecyclePlanHomeCard({
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
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            boxShadow: KalroColors.softShadow,
            border: Border.all(
              color: KalroColors.headerGreen.withValues(alpha: 0.12),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: KalroColors.headerGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.auto_graph_outlined,
                  color: KalroColors.headerGreen,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Lifecycle planner'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      nextLabel == null
                          ? 'See hatch, harvest, and moth dates. Test cool weather, heat, or short leaf.'
                                .tr
                          : '$nextLabel · $nextWhen',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                      ),
                    ),
                    if (conditionNote != null) ...[
                      SizedBox(height: 4),
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
              Icon(Icons.chevron_right, color: KalroColors.textLight),
            ],
          ),
        ),
      ),
    );
  }
}
