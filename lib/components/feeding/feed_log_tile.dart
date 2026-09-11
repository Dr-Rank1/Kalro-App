import 'package:flutter/material.dart';

import '../../models/feed_log.dart';
import '../../theme/kalro_colors.dart';
import '../../utils/record_helpers.dart';
import '../records/record_log_tile.dart';

class FeedLogTile extends StatelessWidget {
  const FeedLogTile({
    super.key,
    required this.log,
    this.onDelete,
  });

  final FeedLog log;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return RecordLogTile(
      icon: Icons.restaurant_outlined,
      iconColor: KalroColors.primaryGreen,
      iconBackground: KalroColors.peach.withValues(alpha: 0.35),
      title: '${formatGrams(log.quantityGrams)} · ${log.feedType}',
      subtitle: log.feedingStage?.trim().isNotEmpty == true ? log.feedingStage : null,
      meta: formatRecordDate(log.recordedAt),
      note: log.notes,
      onDelete: onDelete,
    );
  }
}
