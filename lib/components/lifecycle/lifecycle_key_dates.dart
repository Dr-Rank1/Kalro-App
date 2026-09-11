import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/lifecycle_milestone.dart';
import '../../services/lifecycle_planning_service.dart';
import '../../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

/// Compact hatch / spinning / harvest / moth dates for planning.
class LifecycleKeyDatesCard extends StatelessWidget {
  LifecycleKeyDatesCard({
    super.key,
    required this.cycle,
    this.footnote,
  });

  final PlannedCycle cycle;
  final String? footnote;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();
    final items = [
      _KeyDate(
        label: 'Egg hatch'.tr,
        milestone: cycle.hatch,
        icon: Icons.egg_outlined,
      ),
      _KeyDate(
        label: cycle.mounting != null ? 'Mounting' : 'Spinning',
        milestone: cycle.mounting ?? cycle.spinning,
        icon: Icons.auto_awesome_outlined,
      ),
      _KeyDate(
        label: 'Cocoon harvest'.tr,
        milestone: cycle.harvest,
        icon: Icons.inventory_2_outlined,
      ),
      _KeyDate(
        label: 'Moths emerge'.tr,
        milestone: cycle.mothEmergence,
        icon: Icons.flutter_dash_outlined,
      ),
    ];

    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            [
              '${cycle.species.label} · ${cycle.cycleDays} day cycle',
              if (cycle.shiftSummary != null) cycle.shiftSummary!,
            ].join(' · '),
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: KalroColors.headerGreen,
            ),
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _tile(items[0], dateFormat)),
              SizedBox(width: 8),
              Expanded(child: _tile(items[1], dateFormat)),
            ],
          ),
          SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _tile(items[2], dateFormat)),
              SizedBox(width: 8),
              Expanded(child: _tile(items[3], dateFormat)),
            ],
          ),
          if (footnote != null) ...[
            SizedBox(height: 10),
            Text(
              footnote!,
              style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
            ),
          ],
        ],
      ),
    );
  }

  Widget _tile(_KeyDate item, DateFormat dateFormat) {
    final milestone = item.milestone;
    final date = milestone?.effectiveDate;
    final shift = milestone?.daysVsTypical;
    final typical = milestone?.typicalDate;

    return Container(
      padding: EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: KalroColors.background,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(item.icon, size: 18, color: KalroColors.accentBrown),
              if (shift != null && shift != 0) ...[
                Spacer(),
                Text(
                  '${shift > 0 ? '+' : ''}${shift}d',
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.accentBrown,
                  ),
                ),
              ],
            ],
          ),
          SizedBox(height: 6),
          Text(
            item.label,
            style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
          ),
          SizedBox(height: 2),
          Text(
            date == null ? '—' : dateFormat.format(date),
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: KalroColors.textDark,
            ),
          ),
          if (typical != null && shift != null && shift != 0)
            Text(
              'typical ${dateFormat.format(typical)}',
              style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
            ),
        ],
      ),
    );
  }
}

class _KeyDate {
  const _KeyDate({
    required this.label,
    required this.milestone,
    required this.icon,
  });

  final String label;
  final LifecycleMilestone? milestone;
  final IconData icon;
}

/// Typical vs predicted dates for hatch, harvest, and moths.
class PredictionOutcomeCard extends StatelessWidget {
  PredictionOutcomeCard({
    super.key,
    required this.cycle,
  });

  final PlannedCycle cycle;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();
    final rows = [
      ('Egg hatch', cycle.hatch),
      (
        cycle.mounting != null ? 'Mounting' : 'Spinning',
        cycle.mounting ?? cycle.spinning,
      ),
      ('Cocoon harvest', cycle.harvest),
      ('Moths emerge', cycle.mothEmergence),
    ];

    return Container(
      padding: EdgeInsets.fromLTRB(14, 14, 14, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.headerGreen.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'How dates change',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: KalroColors.headerGreen,
            ),
          ),
          SizedBox(height: 2),
          Text(
            cycle.shiftSummary == null
                ? 'Same as a typical house with enough leaf.'
                : cycle.shiftSummary!,
            style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
          ),
          SizedBox(height: 10),
          Row(
            children: [
              SizedBox(width: 108),
              Expanded(
                child: Text(
                  'Typical',
                  style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
                ),
              ),
              Expanded(
                child: Text(
                  'Predicted',
                  style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
                ),
              ),
              SizedBox(
                width: 48,
                child: Text(
                  'Shift',
                  textAlign: TextAlign.end,
                  style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
                ),
              ),
            ],
          ),
          Divider(height: 16),
          ...rows.map((row) {
            final milestone = row.$2;
            final predicted = milestone?.effectiveDate;
            final typical = milestone?.typicalDate ?? predicted;
            final shift = milestone?.daysVsTypical ?? 0;
            return Padding(
              padding: EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  SizedBox(
                    width: 108,
                    child: Text(
                      row.$1,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      typical == null ? '—' : dateFormat.format(typical),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      predicted == null ? '—' : dateFormat.format(predicted),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 48,
                    child: Text(
                      shift == 0 ? '—' : '${shift > 0 ? '+' : ''}${shift}d',
                      textAlign: TextAlign.end,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: shift == 0
                            ? KalroColors.textMuted
                            : KalroColors.accentBrown,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class PlanningTimeline extends StatelessWidget {
  PlanningTimeline({
    super.key,
    required this.cycle,
    required this.planning,
  });

  final PlannedCycle cycle;
  final LifecyclePlanningService planning;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        children: [
          for (var i = 0; i < cycle.milestones.length; i++) ...[
            if (i > 0) Divider(height: 1),
            _row(cycle.milestones[i], dateFormat, today),
          ],
        ],
      ),
    );
  }

  Widget _row(LifecycleMilestone milestone, DateFormat dateFormat, DateTime today) {
    final day = DateTime(
      milestone.effectiveDate.year,
      milestone.effectiveDate.month,
      milestone.effectiveDate.day,
    );
    final daysUntil = day.difference(today).inDays;
    final isKey = planning.isKeyPlanningDate(milestone);
    final range = cycle.typicalRangeFor(milestone);

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 56,
            child: Text(
              dateFormat.format(milestone.effectiveDate),
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: isKey ? FontWeight.w700 : FontWeight.w500,
                color: daysUntil < 0 ? KalroColors.textMuted : KalroColors.textDark,
              ),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  planning.planningTitle(milestone),
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: isKey ? FontWeight.w600 : FontWeight.w500,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  [
                    if (range != null) 'Typically $range',
                    if (milestone.daysVsTypical != null && milestone.daysVsTypical != 0)
                      milestone.daysVsTypical! > 0
                          ? '+${milestone.daysVsTypical}d with this weather / feeding'
                          : '${milestone.daysVsTypical}d with this weather / feeding',
                    planning.prepNote(milestone, cycle.species),
                  ].join(' · '),
                  style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
