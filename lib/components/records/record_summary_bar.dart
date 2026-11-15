import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class RecordSummaryItem {
  RecordSummaryItem({required this.label, required this.value});

  final String label;
  final String value;
}

class RecordSummaryBar extends StatelessWidget {
  const RecordSummaryBar({super.key, required this.items});

  final List<RecordSummaryItem> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0)
              Container(
                width: 1,
                height: 26,
                margin: const EdgeInsets.symmetric(horizontal: 8),
                color: KalroColors.divider,
              ),
            Expanded(
              child: Column(
                children: [
                  Text(
                    items[i].value,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: KalroColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    items[i].label,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: KalroColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
