import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/batch.dart';

Future<void> pickBatch({
  required BuildContext context,
  required List<Batch> batches,
  required String action,
  required void Function(String batchId) onSelected,
  VoidCallback? onCreateBatch,
}) async {
  if (batches.isEmpty) {
    if (onCreateBatch != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Create a batch first to $action'),
          action: SnackBarAction(label: 'Create', onPressed: onCreateBatch),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Create a batch first to $action')),
      );
    }
    return;
  }

  if (batches.length == 1) {
    onSelected(batches.first.id);
    return;
  }

  await showModalBottomSheet<void>(
    context: context,
    builder: (context) {
      return SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Select batch',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
              ),
            ),
            ...batches.map(
              (batch) => ListTile(
                title: Text('${batch.species.label} · ${batch.eggCount} larvae'),
                subtitle: Text(batch.status.label),
                onTap: () {
                  Navigator.pop(context);
                  onSelected(batch.id);
                },
              ),
            ),
          ],
        ),
      );
    },
  );
}
