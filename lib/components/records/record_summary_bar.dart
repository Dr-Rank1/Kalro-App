import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class RecordSummaryItem {
  RecordSummaryItem({required this.label, required this.value});

  final String label;
  final String value;
}

class RecordSummaryBar extends StatelessWidget {
  RecordSummaryBar({super.key, required this.items});

  final List<RecordSummaryItem> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: KalroColors.background,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0)
              Container(
                width: 1,
                height: 28,
                margin: EdgeInsets.symmetric(horizontal: 10),
                color: KalroColors.divider,
              ),
            Expanded(
              child: Column(
                children: [
                  Text(
                    items[i].value,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: KalroColors.textDark,
                    ),
                  ),
                  Text(
                    items[i].label,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 10,
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
