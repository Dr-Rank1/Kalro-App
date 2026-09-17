import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../l10n/translator.dart';
import '../../models/cycle_memory.dart';
import '../../theme/kalro_colors.dart';
import '../../utils/kalro_formatters.dart';

class CycleMemoryCard extends StatelessWidget {
  const CycleMemoryCard({
    super.key,
    required this.memory,
    this.onOpen,
    this.onStartLikeThis,
    this.showMoney = false,
  });

  final CycleMemory memory;
  final VoidCallback? onOpen;
  final VoidCallback? onStartLikeThis;
  final bool showMoney;

  @override
  Widget build(BuildContext context) {
    final dates = DateFormat.MMMd(Translator.dateLocale);
    final harvest = memory.harvestKg > 0
        ? '${memory.harvestKg.toStringAsFixed(2)} kg'
        : 'No harvest'.tr;
    final window = memory.harvestStart != null && memory.harvestEnd != null
        ? '${dates.format(memory.harvestStart!)} – ${dates.format(memory.harvestEnd!)}'
        : null;
    final shift = memory.harvestShiftDays;
    final shiftLabel = shift == null || shift == 0
        ? null
        : shift > 0
            ? Translator.fill('{n}d later than predicted', {'n': '$shift'})
            : Translator.fill('{n}d earlier than predicted', {'n': '${-shift}'});

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: KalroColors.divider),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      memory.batch.species.label,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  ),
                  Text(
                    harvest,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      color: KalroColors.harvest,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                [
                  Translator.fill('{pct}% survival', {
                    'pct': memory.survivalPercent.toStringAsFixed(0),
                  }),
                  Translator.fill('{kg} kg leaf', {
                    'kg': memory.leafKg.toStringAsFixed(1),
                  }),
                  if (window != null) window,
                ].join(' · '),
                style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
              ),
              if (shiftLabel != null) ...[
                const SizedBox(height: 4),
                Text(
                  shiftLabel,
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.accentBrown),
                ),
              ],
              if (showMoney && memory.costPerKg != null) ...[
                const SizedBox(height: 6),
                Text(
                  Translator.fill('Cost {cost} / kg cocoons', {
                    'cost': KalroFormatters.formatCurrency(memory.costPerKg!),
                  }),
                  style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ],
              if (onStartLikeThis != null) ...[
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: onStartLikeThis,
                    child: Text('Start next lot like this'.tr),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
