import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../constants/disease_library.dart';
import '../models/species.dart';
import '../theme/kalro_colors.dart';

import 'package:kalro/l10n/translator.dart';

class FieldGuideScreen extends StatelessWidget {
  const FieldGuideScreen({
    super.key,
    this.species,
    this.cycleDay,
    this.stageKey,
    this.isMoult = false,
    this.isLightFeedDay = false,
    this.actionTitle,
  });

  final Species? species;
  final int? cycleDay;
  final String? stageKey;
  final bool isMoult;
  final bool isLightFeedDay;
  final String? actionTitle;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KalroColors.headerGreen,
      appBar: AppBar(title: Text('Field guide'.tr)),
      body: Container(
        decoration: const BoxDecoration(
          color: KalroColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: KalroBackground(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'From KALRO predictive rearing sheets'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  color: KalroColors.textMuted,
                ),
              ),
              const SizedBox(height: 16),
              if (_todayFocus() != null) ...[
                _section(_todayFocus()!.$1, _todayFocus()!.$2, highlight: true),
                const SizedBox(height: 16),
              ],
              _section('Bombyx — day of cycle', [
                'Days 1–12: incubate eggs, watch temperature and humidity, prepare the room.',
                'Days 10–12: hatching and brushing onto the rearing bed.',
                'Each instar: feed, hygiene, spacing, disease watch.',
                'Moult days 14, 18, 22, 26: stop feeding and watch the moult.',
                'Days 27–33: heavy feeding. Days 32–35: stop feed and mount.',
                'Harvest mature cocoons on days 38–40.',
              ]),
              const SizedBox(height: 16),
              _section('Ready to spin (Bombyx)', [
                'They stop eating and ignore fresh mulberry.',
                'Body looks translucent or creamy around the head.',
                'Body is softer and slightly shrunken.',
                'They raise and wave the head, searching for a place to attach silk.',
              ]),
              const SizedBox(height: 16),
              _section('Eri — from hatch', [
                'Instar day 1 (2nd–5th): light feeding in the morning, then full.',
                'Last day of instars 1–4: no feeding (moult).',
                '5th instar: feed days 1–7, then spinning; keep feeding until all have spun.',
                'Cocoon measurements around day 32. Moths emerge from day 39 (1–4 days).',
              ]),
              const SizedBox(height: 16),
              Text(
                'Disease field cards'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Use these when logging deaths. Pebrine is a seed-lot risk — tell CRC.'
                    .tr,
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  color: KalroColors.textMuted,
                ),
              ),
              const SizedBox(height: 12),
              ...DiseaseLibrary.info.map(_diseaseCard),
            ],
          ),
        ),
      ),
    );
  }

  (String, List<String>)? _todayFocus() {
    if (species == null && stageKey == null && cycleDay == null) return null;
    final day = cycleDay ?? 0;
    final title = actionTitle ?? 'Today on the bed';
    if (isMoult) {
      return (
        title,
        [
          'Stop feeding. Watch the moult. Do not disturb the bed.',
          'Resume tender leaf when they have finished moulting together.',
        ],
      );
    }
    if (isLightFeedDay) {
      return (
        title,
        [
          'Instar day 1: light feeding in the morning, then full.',
          'Keep young larvae warm and uncrowded.',
        ],
      );
    }
    if (species == Species.bombyx) {
      if (day <= 12) {
        return (
          title,
          [
            'Days 1–12: incubate eggs, watch temperature and humidity, prepare the room.',
            'Days 10–12: hatching and brushing onto the rearing bed.',
          ],
        );
      }
      if (day >= 32 && day <= 35) {
        return (
          title,
          [
            'Days 32–35: stop feed and mount.',
            'They stop eating and ignore fresh mulberry.',
            'They raise and wave the head, searching for a place to attach silk.',
          ],
        );
      }
      if (day >= 27 && day <= 33) {
        return (
          title,
          [
            'Days 27–33: heavy feeding.',
            'Watch spinning signs. Prepare mountages.',
          ],
        );
      }
      if (day >= 38) {
        return (
          title,
          ['Harvest mature cocoons on days 38–40.'],
        );
      }
    }
    if (species == Species.eri) {
      if (stageKey == 'spinning' || stageKey == 'instar5') {
        return (
          title,
          [
            '5th instar: feed days 1–7, then spinning; keep feeding until all have spun.',
            'Cocoon measurements around day 32. Moths emerge from day 39 (1–4 days).',
          ],
        );
      }
    }
    return (title, ['Check the batch and mark the stage when you see it.']);
  }

  Widget _section(String title, List<String> lines, {bool highlight = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: highlight ? KalroColors.headerGreen : KalroColors.divider,
          width: highlight ? 1.4 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.tr,
            style: GoogleFonts.poppins(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: KalroColors.headerGreen,
            ),
          ),
          const SizedBox(height: 8),
          ...lines.asMap().entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: KalroColors.headerGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: Text(
                      '${entry.key + 1}',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: KalroColors.headerGreen,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      entry.value.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        height: 1.4,
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

  Widget _diseaseCard(DiseaseInfo info) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: info.seedLotRisk
                ? KalroColors.danger.withValues(alpha: 0.4)
                : KalroColors.divider,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    info.name.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: KalroColors.headerGreen,
                    ),
                  ),
                ),
                if (info.seedLotRisk)
                  Text(
                    'Seed-lot risk'.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: KalroColors.danger,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              info.signs.tr,
              style: GoogleFonts.poppins(fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 6),
            Text(
              info.action.tr,
              style: GoogleFonts.poppins(
                fontSize: 13,
                height: 1.4,
                color: KalroColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
