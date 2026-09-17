import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../l10n/translator.dart';
import '../../models/leaf_movement.dart';
import '../../services/app_repositories.dart';
import '../../services/leaf_ledger_service.dart';
import '../../theme/kalro_colors.dart';
import '../buttons/kalro_primary_button.dart';

class LeafLedgerSection extends StatefulWidget {
  const LeafLedgerSection({
    super.key,
    required this.repositories,
    required this.canEdit,
    this.dailyNeedKg = 0,
    this.onChanged,
  });

  final AppRepositories repositories;
  final bool canEdit;
  final double dailyNeedKg;
  final VoidCallback? onChanged;

  @override
  State<LeafLedgerSection> createState() => _LeafLedgerSectionState();
}

class _LeafLedgerSectionState extends State<LeafLedgerSection> {
  late Future<List<LeafMovement>> _future;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _future = widget.repositories.leafMovements.getAll().then((all) {
        final copy = [...all]..sort((a, b) => b.recordedAt.compareTo(a.recordedAt));
        return copy.take(12).toList();
      });
    });
  }

  Future<void> _addIn(LeafMovementKind kind) async {
    var host = LeafHost.mulberry;
    final kg = TextEditingController();
    final notes = TextEditingController();
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModal) {
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
                    kind == LeafMovementKind.bought ? 'Add bought leaf'.tr : 'Add cut leaf'.tr,
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<LeafHost>(
                    initialValue: host,
                    decoration: InputDecoration(labelText: 'Leaf type'.tr),
                    items: LeafHost.values
                        .map((h) => DropdownMenuItem(value: h, child: Text(h.label)))
                        .toList(),
                    onChanged: (value) {
                      if (value != null) setModal(() => host = value);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: kg,
                    decoration: InputDecoration(labelText: 'Kilograms'.tr),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notes,
                    decoration: InputDecoration(labelText: 'Notes (optional)'.tr),
                  ),
                  const SizedBox(height: 16),
                  KalroPrimaryButton(
                    label: 'Save'.tr,
                    onPressed: () async {
                      final parsed = double.tryParse(kg.text.trim()) ?? 0;
                      if (parsed <= 0) return;
                      await const LeafLedgerService().addStock(
                        repositories: widget.repositories,
                        host: host,
                        kg: parsed,
                        kind: kind,
                        notes: notes.text.trim().isEmpty ? null : notes.text.trim(),
                      );
                      if (context.mounted) Navigator.pop(context, true);
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    kg.dispose();
    notes.dispose();
    if (saved == true) {
      _reload();
      widget.onChanged?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final dates = DateFormat.MMMd(Translator.dateLocale);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Leaf in / out'.tr,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        const SizedBox(height: 8),
        if (widget.canEdit)
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _addIn(LeafMovementKind.bought),
                  child: Text('Bought'.tr),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _addIn(LeafMovementKind.cut),
                  child: Text('Cut'.tr),
                ),
              ),
            ],
          ),
        const SizedBox(height: 10),
        FutureBuilder(
          future: _future,
          builder: (context, snapshot) {
            final rows = snapshot.data ?? const <LeafMovement>[];
            if (rows.isEmpty) {
              return Text(
                'Log bought or cut leaf. Feeding deducts stock automatically.'.tr,
                style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
              );
            }
            return Column(
              children: [
                ...rows.map(
                  (m) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Icon(
                          m.isIn ? Icons.add_circle_outline : Icons.remove_circle_outline,
                          size: 18,
                          color: m.isIn ? KalroColors.leaf : KalroColors.rest,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '${m.kind.label} · ${m.host.label}',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ),
                        Text(
                          '${m.kg > 0 ? '+' : ''}${m.kg.toStringAsFixed(2)} kg · ${dates.format(m.recordedAt)}',
                          style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}
