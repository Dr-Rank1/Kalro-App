import 'package:flutter/material.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../services/app_repositories.dart';

class HealthScreen extends StatefulWidget {
  const HealthScreen({
    super.key,
    required this.repositories,
    required this.canEdit,
  });

  final AppRepositories repositories;
  final bool canEdit;

  @override
  State<HealthScreen> createState() => _HealthScreenState();
}

class _HealthScreenState extends State<HealthScreen> {
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
                    title: 'Health & Mortality',
                    subtitle: 'Record losses, disease, and treatment.',
                  ),
                  const SizedBox(height: 24),
                  if (activeBatches.isEmpty)
                    const RecordEmptyState(
                      icon: Icons.layers_outlined,
                      title: 'No active batches',
                      message: 'Start a rearing cycle to log health records.',
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
                      MortalityLogSection(
                        batchId: _selectedBatch!.id,
                        repository: widget.repositories.mortalityLogs,
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
