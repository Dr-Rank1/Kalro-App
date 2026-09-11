import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

Future<bool> confirmDeleteRecord(
  BuildContext context, {
  required String what,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Delete record?'),
      content: Text('Remove this $what? This cannot be undone.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
      ],
    ),
  );
  return confirmed ?? false;
}

String formatRecordDate(DateTime date) => DateFormat('MMM d, h:mm a').format(date);

String formatRecordDay(DateTime date) => DateFormat.yMMMd().format(date);

String formatGrams(double grams) {
  if (grams >= 1000) {
    return '${(grams / 1000).toStringAsFixed(1)} kg';
  }
  return '${grams.toStringAsFixed(grams.truncateToDouble() == grams ? 0 : 1)} g';
}

String? joinNonEmpty(List<String?> parts, {String separator = ' · '}) {
  final filtered = parts.where((p) => p != null && p.trim().isNotEmpty).cast<String>().toList();
  return filtered.isEmpty ? null : filtered.join(separator);
}
