import 'package:flutter/material.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../services/app_repositories.dart';
import 'package:kalro/l10n/translator.dart';

class HarvestScreen extends StatefulWidget {
  HarvestScreen({
    super.key,
    required this.repositories,
    required this.canEdit,
  });

  final AppRepositories repositories;
  final bool canEdit;

  @override
  State<HarvestScreen> createState() => _HarvestScreenState();
}

class _HarvestScreenState extends State<HarvestScreen> {
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
                return Center(child: CircularProgressIndicator());
              }

              final activeBatches = snapshot.data ?? [];

              return ListView(
                padding: EdgeInsets.all(20),
                children: [
                  KalroToolbar(
                    title: 'Cocoon Harvest'.tr,
                    subtitle: 'Record harvest weight, count, and shell samples.'.tr,
                  ),
                  SizedBox(height: 24),
                  if (activeBatches.isEmpty)
                    RecordEmptyState(
                      icon: Icons.layers_outlined,
                      title: 'No active batches'.tr,
                      message: 'Start a rearing cycle to record harvests.',
                    )
                  else ...[
                    InputDecorator(
                      decoration: InputDecoration(labelText: 'Select Batch'),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<Batch>(
                      value: _selectedBatch,
                      isExpanded: true,
                      
                      items: activeBatches.map((b) {
                        return DropdownMenuItem(
                          value: b,
                          child: Text('${b.species.label} - ${b.eggCount} larvae'.tr),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedBatch = val);
                      },
                    ),
                      ),
                    ),
                    SizedBox(height: 24),
                    if (_selectedBatch != null)
                      CocoonHarvestSection(
                        batchId: _selectedBatch!.id,
                        startingCount: _selectedBatch!.eggCount,
                        harvestRepository: widget.repositories.cocoonHarvests,
                        batchRepository: widget.repositories.batches,
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
