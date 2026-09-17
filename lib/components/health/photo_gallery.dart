import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../l10n/translator.dart';
import '../../models/mortality_log.dart';
import '../../theme/kalro_colors.dart';

class MortalityPhotoItem {
  const MortalityPhotoItem({
    required this.log,
    required this.batchLabel,
  });

  final MortalityLog log;
  final String batchLabel;
}

class MortalityPhotoGallery extends StatelessWidget {
  const MortalityPhotoGallery({super.key, required this.items});

  final List<MortalityPhotoItem> items;

  @override
  Widget build(BuildContext context) {
    final photos = items.where((i) => (i.log.photoPath ?? '').isNotEmpty).toList();
    if (photos.isEmpty) return const SizedBox.shrink();
    final dates = DateFormat.MMMd(Translator.dateLocale);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Disease photos'.tr,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 108,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: photos.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final item = photos[index];
              return GestureDetector(
                onTap: () => openMortalityPhoto(context, item),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    children: [
                      Image.file(
                        File(item.log.photoPath!),
                        width: 108,
                        height: 108,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 108,
                          height: 108,
                          color: KalroColors.divider,
                          child: const Icon(Icons.broken_image_outlined),
                        ),
                      ),
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 0,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          color: Colors.black54,
                          child: Text(
                            '${item.log.disease ?? 'Unknown'.tr} · ${dates.format(item.log.recordedAt)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.poppins(color: Colors.white, fontSize: 10),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

Future<void> openMortalityPhoto(BuildContext context, MortalityPhotoItem item) {
  final dates = DateFormat.yMMMd(Translator.dateLocale);
  return Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          title: Text(
            '${item.batchLabel} · ${item.log.disease ?? 'Unknown'.tr}',
            style: GoogleFonts.poppins(fontSize: 14),
          ),
        ),
        body: Column(
          children: [
            Expanded(
              child: InteractiveViewer(
                child: Center(
                  child: Image.file(
                    File(item.log.photoPath!),
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(Icons.broken_image_outlined, color: Colors.white),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                '${dates.format(item.log.recordedAt)} · ${Translator.fill('{n} larvae', {'n': '${item.log.count}'})}',
                style: GoogleFonts.poppins(color: Colors.white70),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
