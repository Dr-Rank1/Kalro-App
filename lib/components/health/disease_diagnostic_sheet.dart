import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../constants/disease_library.dart';
import '../../l10n/translator.dart';
import '../../theme/kalro_colors.dart';

class DiseaseDiagnosticSheet extends StatefulWidget {
  const DiseaseDiagnosticSheet({super.key, this.onSelectDisease});

  final ValueChanged<String>? onSelectDisease;

  static Future<void> show(
    BuildContext context, {
    ValueChanged<String>? onSelectDisease,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => DiseaseDiagnosticSheet(onSelectDisease: onSelectDisease),
    );
  }

  @override
  State<DiseaseDiagnosticSheet> createState() => _DiseaseDiagnosticSheetState();
}

class _DiseaseDiagnosticSheetState extends State<DiseaseDiagnosticSheet> {
  DiseaseInfo? _selected;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: KalroColors.divider,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: KalroColors.danger.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.healing_outlined,
                      color: KalroColors.danger,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Symptom Checker & Disease Guide'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.textDark,
                          ),
                        ),
                        Text(
                          'Tap matching symptoms to see quarantine steps'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: KalroColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                children: [
                  if (_selected != null) ...[
                    _buildActiveDiagnosticCard(_selected!),
                    const SizedBox(height: 20),
                    Text(
                      'Other known diseases'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  for (final item in DiseaseLibrary.info)
                    if (item.name != _selected?.name)
                      _buildDiseaseTile(item),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildActiveDiagnosticCard(DiseaseInfo info) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: info.seedLotRisk
            ? KalroColors.danger.withValues(alpha: 0.08)
            : KalroColors.primaryGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: info.seedLotRisk ? KalroColors.danger : KalroColors.primaryGreen,
          width: 1.5,
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
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: info.seedLotRisk
                        ? KalroColors.danger
                        : KalroColors.headerGreen,
                  ),
                ),
              ),
              if (info.seedLotRisk)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: KalroColors.danger,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'CRITICAL QUARANTINE'.tr,
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Observed Signs:'.tr,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: KalroColors.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            info.signs.tr,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: KalroColors.textDark,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Immediate Action:'.tr,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: KalroColors.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            info.action.tr,
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: KalroColors.textDark,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              if (widget.onSelectDisease != null)
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: KalroColors.buttonGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                      widget.onSelectDisease!(info.name);
                    },
                    icon: const Icon(Icons.check, size: 18),
                    label: Text('Select for Mortality Log'.tr),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDiseaseTile(DiseaseInfo info) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: KalroColors.divider),
      ),
      elevation: 0,
      color: Colors.white,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        title: Text(
          info.name.tr,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            fontSize: 15,
            color: KalroColors.textDark,
          ),
        ),
        subtitle: Text(
          info.signs.tr,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: KalroColors.textMuted,
          ),
        ),
        trailing: const Icon(Icons.chevron_right, color: KalroColors.textMuted),
        onTap: () {
          setState(() => _selected = info);
        },
      ),
    );
  }
}
