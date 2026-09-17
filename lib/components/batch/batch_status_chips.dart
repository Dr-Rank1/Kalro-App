import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/batch.dart';
import '../../models/batch_status.dart';
import '../../theme/kalro_colors.dart';

class BatchStatusChips extends StatelessWidget {
  BatchStatusChips({
    super.key,
    required this.current,
    required this.onSelected,
  });

  final BatchStatus current;
  final ValueChanged<BatchStatus> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: BatchStatus.values.map((status) {
        final selected = current == status;
        return FilterChip(
          label: Text(status.label),
          selected: selected,
          selectedColor: KalroColors.peach,
          checkmarkColor: KalroColors.primaryGreen,
          labelStyle: GoogleFonts.poppins(fontSize: 13),
          onSelected: selected ? null : (_) => onSelected(status),
        );
      }).toList(),
    );
  }
}

class BatchInfoPanel extends StatelessWidget {
  BatchInfoPanel({super.key, required this.batch, required this.rows});

  final Batch batch;
  final List<BatchInfoRow> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${batch.species.label} batch',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 12),
          ...rows.map(
            (row) => Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 130,
                    child: Text(
                      row.label,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: KalroColors.textMuted,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      row.value,
                      style: GoogleFonts.poppins(fontSize: 13),
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
}

class BatchInfoRow {
  BatchInfoRow(this.label, this.value);

  final String label;
  final String value;
}
