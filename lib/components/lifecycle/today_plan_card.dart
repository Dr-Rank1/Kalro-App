import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/rearing_day_service.dart';
import '../../theme/kalro_colors.dart';

import 'package:kalro/l10n/translator.dart';

class TodayPlanCard extends StatelessWidget {
  const TodayPlanCard({
    super.key,
    required this.plan,
    this.speciesLabel,
    this.onTap,
    this.compact = false,
  });

  final RearingDayPlan plan;
  final String? speciesLabel;
  final VoidCallback? onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();
    final stop = plan.stopFeeding;
    final harvest = plan.isHarvestWork;
    final accent = harvest
        ? KalroColors.harvest
        : stop
        ? KalroColors.rest
        : KalroColors.headerGreen;
    final header = harvest
        ? KalroColors.harvest
        : stop
        ? KalroColors.accentBrown
        : KalroColors.headerGreen;

    final child = Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: KalroColors.softShadow,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [header, header.withValues(alpha: 0.82)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.16),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.35),
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '${plan.cycleDay}',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          height: 1.1,
                        ),
                      ),
                      Text(
                        'DAY'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 8,
                          letterSpacing: 0.6,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        harvest
                            ? 'Harvest window'.tr
                            : stop
                            ? 'Rest day'.tr
                            : 'Today’s work'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.white70,
                          letterSpacing: 0.3,
                        ),
                      ),
                      Text(
                        plan.actionTitle,
                        style: GoogleFonts.poppins(
                          fontSize: compact ? 16 : 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ),
                      if (speciesLabel != null)
                        Text(
                          '$speciesLabel · ${Translator.fill('day {d} of {n}', {'d': '${plan.cycleDay}', 'n': '${plan.cycleLengthDays}'})}',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: Colors.white70,
                          ),
                        ),
                    ],
                  ),
                ),
                Text(
                  '${(plan.progress * 100).round()}%',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: plan.progress,
                    minHeight: 7,
                    backgroundColor: KalroColors.divider,
                    color: accent,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  plan.actionDetail,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: KalroColors.textMuted,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: stop
                        ? KalroColors.peach.withValues(alpha: 0.55)
                        : harvest
                        ? KalroColors.peach.withValues(alpha: 0.35)
                        : KalroColors.headerGreen.withValues(alpha: 0.07),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        harvest
                            ? Icons.inventory_2_outlined
                            : stop
                            ? Icons.pause_circle_outline
                            : plan.isLightFeedDay
                            ? Icons.wb_sunny_outlined
                            : Icons.eco_outlined,
                        color: accent,
                        size: 24,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          plan.feedLabel,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: KalroColors.textDark,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (plan.harvestWindowStart != null &&
                    plan.harvestWindowEnd != null) ...[
                  const SizedBox(height: 10),
                  _MetaChip(
                    icon: Icons.event_outlined,
                    color: KalroColors.harvest,
                    label:
                        'Harvest'.tr +
                        ' ${dateFormat.format(plan.harvestWindowStart!)} – ${dateFormat.format(plan.harvestWindowEnd!)}',
                  ),
                ],
                if (plan.leafKgToHarvest != null &&
                    plan.leafKgToHarvest! > 0) ...[
                  const SizedBox(height: 8),
                  _MetaChip(
                    icon: Icons.grass_outlined,
                    color: KalroColors.leaf,
                    label:
                        '${'About'.tr} ${plan.leafKgToHarvest!.toStringAsFixed(1)} ${'kg leaf still needed to harvest'.tr}',
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    if (onTap == null) return child;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: child,
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({
    required this.icon,
    required this.color,
    required this.label,
  });

  final IconData icon;
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: KalroColors.textDark,
              height: 1.3,
            ),
          ),
        ),
      ],
    );
  }
}

class ReadinessChecklist extends StatelessWidget {
  const ReadinessChecklist({
    super.key,
    required this.title,
    required this.signs,
    this.onConfirm,
    this.confirmLabel = 'I see this — mark today',
  });

  final String title;
  final List<String> signs;
  final VoidCallback? onConfirm;
  final String confirmLabel;

  @override
  Widget build(BuildContext context) {
    if (signs.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: KalroColors.softShadow,
        border: Border.all(color: KalroColors.peach),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.visibility_outlined,
                color: KalroColors.headerGreen,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: KalroColors.headerGreen,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...signs.map(
            (sign) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(5),
                      border: Border.all(
                        color: KalroColors.accentBrown,
                        width: 1.4,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      sign,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: KalroColors.textDark,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (onConfirm != null) ...[
            const SizedBox(height: 4),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: onConfirm,
                style: FilledButton.styleFrom(
                  backgroundColor: KalroColors.headerGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  confirmLabel.tr,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
