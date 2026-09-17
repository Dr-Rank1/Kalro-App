import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../constants/disease_library.dart';
import '../../models/batch.dart';
import '../../services/app_repositories.dart';
import '../../services/floor_log_service.dart';
import '../../services/rearing_day_service.dart';
import '../../theme/kalro_colors.dart';

import 'package:kalro/l10n/translator.dart';

class FloorActionsBar extends StatelessWidget {
  const FloorActionsBar({
    super.key,
    required this.batch,
    required this.plan,
    required this.repositories,
    required this.onChanged,
    this.canEdit = true,
    this.onMarkStage,
  });

  final Batch batch;
  final RearingDayPlan plan;
  final AppRepositories repositories;
  final VoidCallback onChanged;
  final bool canEdit;
  final Future<void> Function()? onMarkStage;

  static const _floor = FloorLogService();

  Future<void> _feed(BuildContext context) async {
    final ok = await _floor.logSuggestedFeed(
      repositories: repositories,
      batch: batch,
      plan: plan,
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          ok
              ? 'Logged ${plan.suggestedGrams.round()} g ${FloorLogService.defaultFeedType(batch)}'
              : 'Rest day — no leaf to log',
        ),
      ),
    );
    if (ok) onChanged();
  }

  Future<void> _deaths(BuildContext context) async {
    var count = 1;
    String? disease;
    String? photoPath;
    final saved = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModal) {
            final info = DiseaseLibrary.byName(disease);
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Log deaths'.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      IconButton(
                        onPressed: count > 1
                            ? () => setModal(() => count--)
                            : null,
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text(
                        '$count',
                        style: GoogleFonts.poppins(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      IconButton(
                        onPressed: () => setModal(() => count++),
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                      Text(
                        'larvae'.tr,
                        style: GoogleFonts.poppins(
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String?>(
                    initialValue: disease,
                    decoration: InputDecoration(
                      labelText: 'Disease (optional)'.tr,
                    ),
                    items: [
                      DropdownMenuItem(
                        value: null,
                        child: Text('None / not sure'.tr),
                      ),
                      ...DiseaseLibrary.info.map(
                        (d) => DropdownMenuItem(
                          value: d.name,
                          child: Text(d.name.tr),
                        ),
                      ),
                    ],
                    onChanged: (value) => setModal(() => disease = value),
                  ),
                  if (info != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      info.signs.tr,
                      style: GoogleFonts.poppins(fontSize: 13),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      info.action.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: KalroColors.textMuted,
                      ),
                    ),
                    if (info.seedLotRisk)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'Seed-lot risk — isolate and tell CRC. Do not use moths for eggs.'
                              .tr,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: KalroColors.danger,
                          ),
                        ),
                      ),
                  ],
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        final picked = await ImagePicker().pickImage(
                          source: ImageSource.camera,
                          imageQuality: 70,
                        );
                        if (picked == null) return;
                        photoPath = await _floor.savePhoto(
                          repositories: repositories,
                          sourcePath: picked.path,
                        );
                        setModal(() {});
                      } catch (_) {}
                    },
                    icon: const Icon(Icons.photo_camera_outlined, size: 18),
                    label: Text(
                      photoPath == null ? 'Photo (optional)' : 'Photo attached',
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: FilledButton.styleFrom(
                      backgroundColor: KalroColors.headerGreen,
                    ),
                    child: Text('Save'.tr),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    if (saved != true) return;
    await _floor.logDeaths(
      repositories: repositories,
      batchId: batch.id,
      count: count,
      disease: disease,
      photoPath: photoPath,
      isolated: DiseaseLibrary.byName(disease)?.seedLotRisk ?? false,
    );
    onChanged();
  }

  Future<void> _house(BuildContext context) async {
    HouseFeel? temp;
    HouseFeel? wet;
    final saved = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModal) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'House now'.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Three taps. This moves hatch and harvest on Plan.'.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      color: KalroColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Temperature'.tr,
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _chip('Too cool'.tr, temp?.temperatureC == 20, () {
                        setModal(
                          () => temp = HouseFeel(
                            temperatureC: 20,
                            humidityPercent: 75,
                            label: 'Too cool'.tr,
                          ),
                        );
                      }),
                      _chip('OK'.tr, temp?.temperatureC == 26, () {
                        setModal(
                          () => temp = HouseFeel(
                            temperatureC: 26,
                            humidityPercent: 75,
                            label: 'House OK'.tr,
                          ),
                        );
                      }),
                      _chip('Too hot'.tr, temp?.temperatureC == 32, () {
                        setModal(
                          () => temp = HouseFeel(
                            temperatureC: 32,
                            humidityPercent: 75,
                            label: 'Too hot'.tr,
                          ),
                        );
                      }),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Air'.tr,
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _chip('Dry'.tr, wet?.humidityPercent == 55, () {
                        setModal(
                          () => wet = HouseFeel(
                            temperatureC: 26,
                            humidityPercent: 55,
                            label: 'Too dry'.tr,
                          ),
                        );
                      }),
                      _chip('OK'.tr, wet?.humidityPercent == 75, () {
                        setModal(
                          () => wet = HouseFeel(
                            temperatureC: 26,
                            humidityPercent: 75,
                            label: 'Humidity OK'.tr,
                          ),
                        );
                      }),
                      _chip('Wet'.tr, wet?.humidityPercent == 90, () {
                        setModal(
                          () => wet = HouseFeel(
                            temperatureC: 26,
                            humidityPercent: 90,
                            label: 'Too wet'.tr,
                          ),
                        );
                      }),
                    ],
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: FilledButton.styleFrom(
                      backgroundColor: KalroColors.headerGreen,
                    ),
                    child: Text('Save house'.tr),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    if (saved != true) return;
    final feel = HouseFeel(
      temperatureC: temp?.temperatureC ?? 26,
      humidityPercent: wet?.humidityPercent ?? 75,
      label: [temp?.label, wet?.label].whereType<String>().join(' · '),
    );
    await _floor.logHouseFeel(
      repositories: repositories,
      batchId: batch.id,
      feel: feel,
    );
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'House logged — Plan dates will shift if it stays like this.'.tr,
          ),
        ),
      );
    }
    onChanged();
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: KalroColors.peach,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!canEdit) return const SizedBox.shrink();
    final rest = plan.stopFeeding;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            FilledButton.icon(
              onPressed: rest ? null : () => _feed(context),
              icon: const Icon(Icons.eco_outlined, size: 18),
              label: Text(
                rest
                    ? 'No feed'.tr
                    : Translator.fill('Feed {g} g', {
                        'g': '${plan.suggestedGrams.round()}',
                      }),
              ),
              style: FilledButton.styleFrom(backgroundColor: KalroColors.leaf),
            ),
            OutlinedButton.icon(
              onPressed: () => _deaths(context),
              icon: const Icon(Icons.healing_outlined, size: 18),
              label: Text('Deaths'.tr),
            ),
            OutlinedButton.icon(
              onPressed: () => _house(context),
              icon: const Icon(Icons.thermostat_outlined, size: 18),
              label: Text('House'.tr),
            ),
            if (onMarkStage != null)
              OutlinedButton.icon(
                onPressed: () => onMarkStage!(),
                icon: const Icon(Icons.visibility_outlined, size: 18),
                label: Text(
                  plan.stage.isMoult ? 'I see moult'.tr : 'Mark stage'.tr,
                ),
              ),
          ],
        ),
      ],
    );
  }
}
