import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class KalroDateRow extends StatelessWidget {
  const KalroDateRow({
    super.key,
    required this.label,
    required this.date,
    required this.onTap,
    this.enabled = true,
  });

  final String label;
  final DateTime date;
  final VoidCallback? onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: GoogleFonts.poppins()),
      subtitle: Text(MaterialLocalizations.of(context).formatMediumDate(date)),
      trailing: const Icon(Icons.calendar_today, color: KalroColors.primaryGreen),
      onTap: enabled ? onTap : null,
    );
  }
}
