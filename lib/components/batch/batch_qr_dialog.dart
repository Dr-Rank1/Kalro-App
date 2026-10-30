import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../../l10n/translator.dart';
import '../../models/batch.dart';
import '../../theme/kalro_colors.dart';

class BatchQrDialog extends StatelessWidget {
  const BatchQrDialog({super.key, required this.batch});

  final Batch batch;

  static Future<void> show(BuildContext context, Batch batch) {
    return showDialog(
      context: context,
      builder: (_) => BatchQrDialog(batch: batch),
    );
  }

  String get _qrPayload =>
      'kalro://batch?id=${batch.id}&species=${batch.species.name}&eggs=${batch.eggCount}&start=${batch.startDate.toIso8601String().split('T').first}';

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: KalroColors.headerGreen.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.qr_code_2_outlined,
                    color: KalroColors.headerGreen,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Rearing Tray Tag'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: KalroColors.textDark,
                        ),
                      ),
                      Text(
                        'Batch ${batch.id.substring(0, batch.id.length > 8 ? 8 : batch.id.length)}',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: KalroColors.divider),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: QrImageView(
                data: _qrPayload,
                version: QrVersions.auto,
                size: 200.0,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: KalroColors.headerGreen,
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: KalroColors.textDark,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: KalroColors.background,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _InfoRow(
                    label: 'Species'.tr,
                    value: batch.species.label,
                  ),
                  const SizedBox(height: 4),
                  _InfoRow(
                    label: 'Egg count'.tr,
                    value: '${batch.eggCount}',
                  ),
                  if (batch.location != null && batch.location!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    _InfoRow(
                      label: 'House / Tray'.tr,
                      value: batch.location!,
                    ),
                  ],
                  if (batch.caretaker != null && batch.caretaker!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    _InfoRow(
                      label: 'Caretaker'.tr,
                      value: batch.caretaker!,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.share_outlined, size: 18),
                    label: Text('Share tag'.tr),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: KalroColors.headerGreen,
                      side: const BorderSide(color: KalroColors.headerGreen),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () {
                      SharePlus.instance.share(
                        ShareParams(
                          text: 'KALRO Sericulture Tray Tag:\n'
                              'Batch: ${batch.id}\n'
                              'Species: ${batch.species.label}\n'
                              'Eggs: ${batch.eggCount}\n'
                              'QR Payload: $_qrPayload',
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: KalroColors.textMuted,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: KalroColors.textDark,
          ),
        ),
      ],
    );
  }
}
