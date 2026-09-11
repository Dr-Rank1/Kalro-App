import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../utils/kalro_formatters.dart';

import '../../models/purchase_order.dart';
import '../../theme/kalro_colors.dart';

class PurchaseOrderTile extends StatelessWidget {
  const PurchaseOrderTile({
    super.key,
    required this.order,
    this.onDelete,
  });

  final PurchaseOrder order;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final currency = KalroFormatters.currency;
    final dateFormat = DateFormat('MMM d, yyyy');

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
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
              color: KalroColors.peach.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.shopping_bag_outlined, color: KalroColors.primaryGreen, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.itemDescription,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                Text(
                  '${order.producerName} · ${order.quantity.toStringAsFixed(order.quantity == order.quantity.roundToDouble() ? 0 : 1)} ${order.unit}',
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                ),
                Text(
                  '${dateFormat.format(order.orderedAt)}'
                  '${order.species != null ? ' · ${order.species!.label}' : ''}',
                  style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textLight),
                ),
              ],
            ),
          ),
          if (order.amount != null)
            Text(
              currency.format(order.amount),
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: KalroColors.accentBrown,
              ),
            ),
          if (onDelete != null)
            IconButton(
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline, size: 20),
              color: KalroColors.textMuted,
            ),
        ],
      ),
    );
  }
}
