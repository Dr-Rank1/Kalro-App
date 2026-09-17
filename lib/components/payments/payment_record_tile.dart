import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../utils/kalro_formatters.dart';

import '../../models/payment_direction.dart';
import '../../models/payment_record.dart';
import '../../theme/kalro_colors.dart';

import 'package:kalro/l10n/translator.dart';

class PaymentRecordTile extends StatelessWidget {
  PaymentRecordTile({
    super.key,
    required this.record,
    this.onSettle,
    this.onDelete,
  });

  final PaymentRecord record;
  final VoidCallback? onSettle;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final currency = KalroFormatters.currency;
    final dateFormat = DateFormat('MMM d, yyyy');
    final isReceivable = record.direction == PaymentDirection.receivable;
    final amountColor = isReceivable
        ? KalroColors.primaryGreen
        : KalroColors.accentBrown;
    final prefix = isReceivable ? '+' : '-';

    return Container(
      margin: EdgeInsets.only(bottom: 8),
      padding: EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (isReceivable ? KalroColors.peach : KalroColors.divider)
                  .withValues(alpha: isReceivable ? 0.4 : 0.6),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isReceivable ? Icons.arrow_downward : Icons.arrow_upward,
              color: amountColor,
              size: 20,
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  record.counterparty,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  record.description,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.textMuted,
                  ),
                ),
                Text(
                  '${dateFormat.format(record.recordedAt)} · ${record.status.label}',
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    color: KalroColors.textLight,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$prefix${currency.format(record.amount)}',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: amountColor,
                ),
              ),
              if (record.isPending && onSettle != null)
                TextButton(
                  onPressed: onSettle,
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size(0, 28),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'Mark settled'.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: KalroColors.primaryGreen,
                    ),
                  ),
                ),
            ],
          ),
          if (onDelete != null) ...[
            SizedBox(width: 4),
            IconButton(
              onPressed: onDelete,
              icon: Icon(Icons.delete_outline, size: 20),
              color: KalroColors.textMuted,
            ),
          ],
        ],
      ),
    );
  }
}
