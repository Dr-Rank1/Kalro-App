import 'package:flutter/material.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../services/app_repositories.dart';

class FeedingScreen extends StatefulWidget {
  const FeedingScreen({
    super.key,
    required this.repositories,
    required this.canEdit,
  });

  final AppRepositories repositories;
  final bool canEdit;

  @override
  State<FeedingScreen> createState() => _FeedingScreenState();
}

class _FeedingScreenState extends State<FeedingScreen> {
  late Future<List<Batch>> _batchesFuture;
  Batch? _selectedBatch;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _batchesFuture = widget.repositories.batches.getAll().then((all) {
        final active = all.where((b) => b.status != BatchStatus.closed).toList();
        if (_selectedBatch != null) {
          final stillExists = active.where((b) => b.id == _selectedBatch!.id).isNotEmpty;
          if (!stillExists) _selectedBatch = active.isNotEmpty ? active.first : null;
        } else if (active.isNotEmpty) {
          _selectedBatch = active.first;
        }
        return active;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: KalroBackground(
        child: SafeArea(
          child: FutureBuilder<List<Batch>>(
            future: _batchesFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }

              final activeBatches = snapshot.data ?? [];

              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const KalroToolbar(
                    title: 'Feeding',
                    subtitle: 'Log daily feed type and quantity per batch.',
                  ),
                  const SizedBox(height: 24),
                  if (activeBatches.isEmpty)
                    const RecordEmptyState(
                      icon: Icons.layers_outlined,
                      title: 'No active batches',
                      message: 'Start a rearing cycle to log feeding.',
                    )
                  else ...[
                    InputDecorator(
                      decoration: const InputDecoration(labelText: 'Select Batch'),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<Batch>(
                      value: _selectedBatch,
                      isExpanded: true,
                      
                      items: activeBatches.map((b) {
                        return DropdownMenuItem(
                          value: b,
                          child: Text('${b.species.label} - ${b.eggCount} larvae'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedBatch = val);
                      },
                    ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_selectedBatch != null)
                      FeedLogSection(
                        batchId: _selectedBatch!.id,
                        repository: widget.repositories.feedLogs,
                      ),
                  ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
