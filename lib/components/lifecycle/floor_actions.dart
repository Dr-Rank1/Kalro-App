import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../constants/disease_library.dart';
import '../../constants/feed_skip_reasons.dart';
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
    this.fedToday = false,
    this.fedGramsToday,
    this.skippedToday = false,
    this.skipReason,
  });

  final Batch batch;
  final RearingDayPlan plan;
  final AppRepositories repositories;
  final VoidCallback onChanged;
  final bool canEdit;
  final Future<void> Function()? onMarkStage;
  final bool fedToday;
  final double? fedGramsToday;
  final bool skippedToday;
  final String? skipReason;

  static const _floor = FloorLogService();

  Future<void> _feed(BuildContext context, {double? grams}) async {
    final qty = grams ??
        (plan.suggestedGrams > 0
            ? plan.suggestedGrams
            : RearingDayService.fullRationGrams(
                batch.species,
                plan.stage.instarNumber ?? 1,
                batch.eggCount > 0 ? batch.eggCount : 400,
              ));
    final feedGrams = qty > 0 ? qty : 50.0;
    await _floor.logCustomFeed(
      repositories: repositories,
      batch: batch,
      quantityGrams: feedGrams,
      feedType: FloorLogService.defaultFeedType(batch),
      feedingStage: plan.stage.label,
      notes: 'Logged from dashboard work card',
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '✓ Logged ${feedGrams.round()} g ${FloorLogService.defaultFeedType(batch)}',
        ),
        backgroundColor: KalroColors.headerGreen,
      ),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      onChanged();
    });
  }

  Future<void> _openFeedOptions(BuildContext context) async {
    final gramsController = TextEditingController();
    final feedMaterialController = TextEditingController(
      text: FloorLogService.defaultFeedType(batch),
    );
    final notesController = TextEditingController();

    // Default to feeding larvae!
    var isSkipping = false;
    var selectedReason = plan.stage.isMoult
        ? FeedSkipReasons.moultRest
        : FeedSkipReasons.options.first.label;

    final messenger = ScaffoldMessenger.maybeOf(context);
    final saved = await showModalBottomSheet<bool>(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModal) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(modalContext).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Icon(
                          isSkipping
                              ? Icons.pause_circle_outline
                              : Icons.eco_outlined,
                          color: isSkipping
                              ? KalroColors.harvest
                              : KalroColors.leaf,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            isSkipping ? 'Record Skipped Feed'.tr : 'Feed Larvae'.tr,
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: KalroColors.headerGreen.withValues(alpha: 0.07),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${plan.stage.label} · ${plan.actionTitle}'.tr,
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: KalroColors.headerGreen,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Enter the exact amount of feed in grams given to this batch, or record a skipped feed.'.tr,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: KalroColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SegmentedButton<bool>(
                      segments: [
                        ButtonSegment(
                          value: false,
                          icon: const Icon(Icons.eco_outlined, size: 18),
                          label: Text('Feed larvae'.tr),
                        ),
                        ButtonSegment(
                          value: true,
                          icon: const Icon(Icons.pause_circle_outline, size: 18),
                          label: Text('Did not feed (Skip)'.tr),
                        ),
                      ],
                      selected: {isSkipping},
                      onSelectionChanged: (set) {
                        setModal(() => isSkipping = set.first);
                      },
                    ),
                    const SizedBox(height: 16),
                    if (isSkipping) ...[
                      Text(
                        'Reason for skipping feed'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: FeedSkipReasons.options.map((opt) {
                          final selected = selectedReason == opt.label;
                          return ChoiceChip(
                            avatar: Icon(opt.icon, size: 16),
                            label: Text(opt.label.tr),
                            selected: selected,
                            onSelected: (_) {
                              setModal(() => selectedReason = opt.label);
                            },
                            selectedColor: KalroColors.peach,
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        FeedSkipReasons.byLabelOrId(selectedReason).description.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ] else ...[
                      TextField(
                        controller: gramsController,
                        autofocus: true,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                        ],
                        decoration: InputDecoration(
                          labelText: 'Quantity (grams)'.tr,
                          suffixText: 'g',
                          hintText: 'Enter grams (e.g. 50)',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: feedMaterialController,
                        decoration: InputDecoration(
                          labelText: 'Feed material'.tr,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      decoration: InputDecoration(
                        labelText: 'Notes (optional)'.tr,
                        hintText: 'e.g. weather, leaf quality, larvae appetite',
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () async {
                        if (isSkipping) {
                          await _floor.logSkippedFeed(
                            repositories: repositories,
                            batch: batch,
                            reason: selectedReason,
                            feedingStage: plan.stage.label,
                            notes: notesController.text,
                          );
                        } else {
                          final grams = double.tryParse(gramsController.text.trim().replaceAll(',', '.'));
                          if (grams == null || grams <= 0) return;
                          await _floor.logCustomFeed(
                            repositories: repositories,
                            batch: batch,
                            quantityGrams: grams,
                            feedType: feedMaterialController.text,
                            feedingStage: plan.stage.label,
                            notes: notesController.text,
                          );
                        }
                        if (sheetContext.mounted) {
                          Navigator.of(sheetContext).pop(true);
                        }
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: isSkipping ? KalroColors.harvest : KalroColors.leaf,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: Text(
                        isSkipping
                            ? 'Record Skipped Feed'.tr
                            : 'Save Feeding Log'.tr,
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    if (onMarkStage != null && (plan.stage.isMoult || plan.stage.key == 'incubation')) ...[
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: () async {
                          if (sheetContext.mounted) {
                            Navigator.of(sheetContext).pop();
                          }
                          await onMarkStage!();
                        },
                        icon: const Icon(Icons.arrow_forward_outlined),
                        label: Text(
                          plan.stage.key == 'incubation'
                              ? 'Larvae hatched — Mark 1st Instar'.tr
                              : 'Larvae finished moult — Mark next stage'.tr,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    gramsController.dispose();
    feedMaterialController.dispose();
    notesController.dispose();

    if (saved == true) {
      messenger?.showSnackBar(
        SnackBar(
          content: Text(
            isSkipping
                ? '⏸ Recorded non-feeding: $selectedReason'.tr
                : '✓ Feeding logged successfully'.tr,
          ),
          backgroundColor: isSkipping ? KalroColors.harvest : KalroColors.headerGreen,
        ),
      );
      await Future<void>.delayed(const Duration(milliseconds: 280));
      onChanged();
    }
  }

  Future<void> _deaths(BuildContext context) async {
    var count = 1;
    String? disease;
    String? photoPath;
    final messenger = ScaffoldMessenger.maybeOf(context);
    final saved = await showModalBottomSheet<bool>(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModal) {
            final info = DiseaseLibrary.byName(disease);
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(modalContext).viewInsets.bottom + 20,
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
                          maxWidth: 1280,
                          maxHeight: 1280,
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
                    onPressed: () => Navigator.pop(sheetContext, true),
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
    messenger?.showSnackBar(
      SnackBar(content: Text('Logged $count larvae deaths.'.tr)),
    );
    await Future<void>.delayed(const Duration(milliseconds: 280));
    onChanged();
  }

  Future<void> _house(BuildContext context) async {
    HouseFeel? temp;
    HouseFeel? wet;
    final messenger = ScaffoldMessenger.maybeOf(context);
    final saved = await showModalBottomSheet<bool>(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModal) {
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
                    onPressed: () => Navigator.pop(sheetContext, true),
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
    messenger?.showSnackBar(
      SnackBar(
        content: Text(
          'House logged — Plan dates will shift if it stays like this.'.tr,
        ),
      ),
    );
    await Future<void>.delayed(const Duration(milliseconds: 280));
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

    final defaultGrams = plan.suggestedGrams > 0
        ? plan.suggestedGrams
        : RearingDayService.fullRationGrams(
            batch.species,
            plan.stage.instarNumber ?? 1,
            batch.eggCount > 0 ? batch.eggCount : 400,
          );
    final feedGrams = defaultGrams > 0 ? defaultGrams : 50.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (fedToday) ...[
              FilledButton.icon(
                onPressed: () => _openFeedOptions(context),
                icon: const Icon(Icons.check_circle_rounded, size: 18),
                label: Text(
                  fedGramsToday != null && fedGramsToday! > 0
                      ? Translator.fill('✓ Fed {g} g', {
                          'g': '${fedGramsToday!.round()}',
                        })
                      : '✓ Fed today'.tr,
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: KalroColors.leaf,
                  foregroundColor: Colors.white,
                ),
              ),
              OutlinedButton.icon(
                onPressed: () => _openFeedOptions(context),
                icon: const Icon(Icons.add, size: 18),
                label: Text('Log more'.tr),
              ),
            ] else if (skippedToday) ...[
              FilledButton.icon(
                onPressed: () => _openFeedOptions(context),
                icon: const Icon(Icons.pause_circle_filled, size: 18),
                label: Text(
                  Translator.fill('⏸ Skipped ({r})', {
                    'r': (skipReason ?? 'Rest').tr,
                  }),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: KalroColors.peach,
                  foregroundColor: KalroColors.textDark,
                ),
              ),
              OutlinedButton.icon(
                onPressed: () => _openFeedOptions(context),
                icon: const Icon(Icons.eco_outlined, size: 18),
                label: Text('Feed larvae instead'.tr),
              ),
            ] else ...[
              FilledButton.icon(
                onPressed: () => _openFeedOptions(context),
                icon: const Icon(Icons.eco_outlined, size: 18),
                label: Text('Feed larvae'.tr),
                style: FilledButton.styleFrom(
                  backgroundColor: KalroColors.leaf,
                  foregroundColor: Colors.white,
                ),
              ),
              OutlinedButton.icon(
                onPressed: () => _openFeedOptions(context),
                icon: const Icon(Icons.tune_outlined, size: 18),
                label: Text('Options / Skip'.tr),
              ),
            ],
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
