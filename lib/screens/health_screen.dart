import 'package:flutter/material.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/mortality_log.dart';
import '../services/app_repositories.dart';
import 'package:kalro/l10n/translator.dart';

class HealthScreen extends StatefulWidget {
  HealthScreen({super.key, required this.repositories, required this.canEdit});

  final AppRepositories repositories;
  final bool canEdit;

  @override
  State<HealthScreen> createState() => _HealthScreenState();
}

class _HealthBundle {
  const _HealthBundle({required this.batches, required this.mortality});

  final List<Batch> batches;
  final List<MortalityLog> mortality;
}

class _HealthScreenState extends State<HealthScreen> {
  late Future<_HealthBundle> _bundleFuture;
  Batch? _selectedBatch;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _bundleFuture = _load();
    });
  }

  Future<_HealthBundle> _load() async {
    final all = await widget.repositories.batches.getAll();
    final active = all.where((b) => b.status != BatchStatus.closed).toList();
    final selectedId = _selectedBatch?.id;
    if (selectedId != null && active.any((b) => b.id == selectedId)) {
      _selectedBatch = active.firstWhere((b) => b.id == selectedId);
    } else {
      _selectedBatch = active.isNotEmpty ? active.first : null;
    }
    final mortality = await widget.repositories.mortalityLogs.getAll();
    return _HealthBundle(batches: active, mortality: mortality);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: KalroBackground(
        child: SafeArea(
          child: FutureBuilder<_HealthBundle>(
            future: _bundleFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting &&
                  !snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              final bundle = snapshot.data;
              final activeBatches = bundle?.batches ?? [];
              final photos = [
                for (final log in bundle?.mortality ?? const <MortalityLog>[])
                  if ((log.photoPath ?? '').isNotEmpty)
                    MortalityPhotoItem(
                      log: log,
                      batchLabel: activeBatches
                              .where((b) => b.id == log.batchId)
                              .map((b) => b.species.label)
                              .firstOrNull ??
                          'Lot'.tr,
                    ),
              ];

              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  KalroToolbar(
                    title: 'Health & Mortality'.tr,
                    subtitle:
                        'Record losses, disease photos, and house conditions.'.tr,
                  ),
                  const SizedBox(height: 24),
                  if (activeBatches.isEmpty)
                    RecordEmptyState(
                      icon: Icons.layers_outlined,
                      title: 'No active batches'.tr,
                      message:
                          'Start a rearing cycle to log health records.'.tr,
                    )
                  else ...[
                    if (photos.isNotEmpty) ...[
                      MortalityPhotoGallery(items: photos),
                      const SizedBox(height: 24),
                    ],
                    InputDecorator(
                      decoration: InputDecoration(labelText: 'Select Batch'.tr),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<Batch>(
                          value: _selectedBatch,
                          isExpanded: true,
                          items: activeBatches.map((b) {
                            return DropdownMenuItem(
                              value: b,
                              child: Text(
                                '${b.species.label} - ${b.eggCount} larvae',
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() => _selectedBatch = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_selectedBatch != null) ...[
                      MortalityLogSection(
                        key: ValueKey('m-${_selectedBatch!.id}'),
                        batchId: _selectedBatch!.id,
                        batchLabel: _selectedBatch!.species.label,
                        repository: widget.repositories.mortalityLogs,
                        onChanged: _reload,
                      ),
                      const SizedBox(height: 24),
                      EnvironmentLogSection(
                        key: ValueKey('e-${_selectedBatch!.id}'),
                        batch: _selectedBatch!,
                        repository: widget.repositories.environmentLogs,
                        onChanged: _reload,
                      ),
                    ],
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
