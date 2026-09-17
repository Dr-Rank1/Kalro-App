import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class StockSplitRow extends StatelessWidget {
  StockSplitRow({
    super.key,
    required this.leftTitle,
    required this.leftValue,
    required this.rightTitle,
    required this.rightValue,
  });

  final String leftTitle;
  final String leftValue;
  final String rightTitle;
  final String rightValue;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StockCell(title: leftTitle, value: leftValue),
        ),
        Container(width: 1, height: 40, color: KalroColors.divider),
        Expanded(
          child: _StockCell(title: rightTitle, value: rightValue),
        ),
      ],
    );
  }
}

class _StockCell extends StatelessWidget {
  const _StockCell({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          title,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            color: KalroColors.textDark,
          ),
        ),
        SizedBox(height: 4),
        Text(value, style: GoogleFonts.poppins(color: KalroColors.textMuted)),
      ],
    );
  }
}
