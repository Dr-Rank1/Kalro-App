import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/leaf_inventory.dart';
import '../../services/leaf_inventory_repository.dart';
import '../../theme/kalro_colors.dart';
import '../buttons/kalro_primary_button.dart';
import '../cards/kalro_section_header.dart';

class LeafInventorySection extends StatefulWidget {
  const LeafInventorySection({super.key, required this.repository});

  final LeafInventoryRepository repository;

  @override
  State<LeafInventorySection> createState() => _LeafInventorySectionState();
}

class _LeafInventorySectionState extends State<LeafInventorySection> {
  late Future<LeafInventory> _inventoryFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _inventoryFuture = widget.repository.get();
    });
  }

  Future<void> _edit() async {
    final current = await widget.repository.get();
    final mulberry = TextEditingController(text: current.mulberryKg.toString());
    final castor = TextEditingController(text: current.castorKg.toString());
    final kesseru = TextEditingController(text: current.kesseruKg.toString());
    
    if (!mounted) return;

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
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
                'Leaf stock (kg)',
                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: mulberry,
                decoration: const InputDecoration(labelText: 'Mulberry (kg)'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: castor,
                decoration: const InputDecoration(labelText: 'Castor (kg)'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: kesseru,
                decoration: const InputDecoration(labelText: 'Kesseru (kg)'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              ),
              const SizedBox(height: 20),
              KalroPrimaryButton(
                label: 'Save leaf stock',
                onPressed: () async {
                  await widget.repository.save(
                    LeafInventory(
                      mulberryKg: double.tryParse(mulberry.text.trim()) ?? 0,
                      castorKg: double.tryParse(castor.text.trim()) ?? 0,
                      kesseruKg: double.tryParse(kesseru.text.trim()) ?? 0,
                      updatedAt: DateTime.now(),
                    ),
                  );
                  if (context.mounted) Navigator.of(context).pop(true);
                },
              ),
            ],
          ),
        );
      },
    );

    mulberry.dispose();
    castor.dispose();
    kesseru.dispose();

    if (saved == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(child: KalroSectionHeader(title: 'Leaf inventory')),
            TextButton(onPressed: _edit, child: const Text('Edit')),
          ],
        ),
        const SizedBox(height: 8),
        FutureBuilder<LeafInventory>(
          future: _inventoryFuture,
          builder: (context, snapshot) {
            final inventory = snapshot.data ?? LeafInventory.empty;
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: KalroColors.divider),
              ),
              child: Text(
                'Mulberry: ${inventory.mulberryKg.toStringAsFixed(1)} kg · '
                'Castor: ${inventory.castorKg.toStringAsFixed(1)} kg · '
                'Kesseru: ${inventory.kesseruKg.toStringAsFixed(1)} kg',
                style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
              ),
            );
          },
        ),
      ],
    );
  }
}
