import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../constants/sericulture_kenya.dart';
import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

/// 4-Stage Automatic Hot Air Cocoon Drying Chamber Controller & Timer.
class HotAirDryingScreen extends StatefulWidget {
  const HotAirDryingScreen({super.key});

  static const routeName = '/hot-air-drying';

  @override
  State<HotAirDryingScreen> createState() => _HotAirDryingScreenState();
}

class _HotAirDryingScreenState extends State<HotAirDryingScreen> {
  int _currentStepIndex = 0; // 0 to 3
  int _secondsRemaining = 60 * 60; // 60 min
  bool _isRunning = false;
  Timer? _timer;

  double _freshBatchWeightKg = 50.0;

  @override
  void initState() {
    super.initState();
    _resetToStep(0);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _resetToStep(int stepIndex) {
    _timer?.cancel();
    setState(() {
      _currentStepIndex = stepIndex;
      _secondsRemaining = KenyaDryingSchedule.stages[stepIndex].durationMinutes * 60;
      _isRunning = false;
    });
  }

  void _togglePlayPause() {
    if (_isRunning) {
      _timer?.cancel();
      setState(() => _isRunning = false);
    } else {
      setState(() => _isRunning = true);
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_secondsRemaining > 0) {
          setState(() => _secondsRemaining--);
        } else {
          // Transition to next stage or finish
          if (_currentStepIndex < KenyaDryingSchedule.stages.length - 1) {
            _resetToStep(_currentStepIndex + 1);
            _togglePlayPause();
          } else {
            timer.cancel();
            setState(() => _isRunning = false);
            _showCompletionDialog();
          }
        }
      });
    }
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Drying Cycle Complete'.tr,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
        ),
        content: Text(
          'Target 40% dry weight achieved. Cocoon pupae stifled and silk shell preserved without UV degradation.'.tr,
          style: GoogleFonts.poppins(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('OK'.tr),
          ),
        ],
      ),
    );
  }

  String _formatTime(int totalSeconds) {
    final m = totalSeconds ~/ 60;
    final s = totalSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final currentStage = KenyaDryingSchedule.stages[_currentStepIndex];
    final targetDryWeightKg = _freshBatchWeightKg * 0.40;
    final evaporatedWaterKg = _freshBatchWeightKg - targetDryWeightKg;

    return Scaffold(
      backgroundColor: KalroColors.background,
      appBar: AppBar(
        title: Text('Hot Air Cocoon Drying'.tr),
        backgroundColor: KalroColors.headerGreen,
        foregroundColor: Colors.white,
      ),
      body: KalroBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Notice banner on UV damage vs Hot-air drying
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: KalroColors.warning.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: KalroColors.warning.withValues(alpha: 0.4)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.wb_sunny_outlined, color: KalroColors.warning, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'NSRC Standard: Avoid sun drying. Sun drying exposes cocoons to UV rays, turning them yellow and deteriorating reelability. Automatic hot-air drying ensures even moisture target (40% drying weight) while preserving sericin.'
                            .tr,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: KalroColors.textDark,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Active Stage Display Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: KalroColors.divider),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: KalroColors.headerGreen.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Stage ${currentStage.stage} of 4'.tr,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: KalroColors.headerGreen,
                            ),
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.thermostat, color: KalroColors.danger, size: 20),
                            const SizedBox(width: 4),
                            Text(
                              '${currentStage.temperatureC}°C',
                              style: GoogleFonts.poppins(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: KalroColors.danger,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _formatTime(_secondsRemaining),
                      style: GoogleFonts.poppins(
                        fontSize: 48,
                        fontWeight: FontWeight.w700,
                        color: KalroColors.textDark,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      currentStage.objective,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        OutlinedButton.icon(
                          onPressed: () => _resetToStep(_currentStepIndex),
                          icon: const Icon(Icons.replay, size: 18),
                          label: Text('Reset Stage'.tr),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: KalroColors.textDark,
                            side: const BorderSide(color: KalroColors.divider),
                          ),
                        ),
                        const SizedBox(width: 14),
                        ElevatedButton.icon(
                          onPressed: _togglePlayPause,
                          icon: Icon(_isRunning ? Icons.pause : Icons.play_arrow, size: 20),
                          label: Text(_isRunning ? 'Pause'.tr : 'Start Timer'.tr),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: KalroColors.headerGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Batch Target Weight Calculator
              Text(
                'Moisture & Yield Target (40% Dry Weight)'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: KalroColors.textDark,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: KalroColors.divider),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Fresh Green Harvest Batch Weight'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: KalroColors.textDark,
                          ),
                        ),
                        Text(
                          '${_freshBatchWeightKg.toStringAsFixed(1)} kg',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.headerGreen,
                          ),
                        ),
                      ],
                    ),
                    Slider(
                      value: _freshBatchWeightKg,
                      min: 5,
                      max: 200,
                      activeColor: KalroColors.headerGreen,
                      inactiveColor: KalroColors.divider,
                      onChanged: (val) => setState(() => _freshBatchWeightKg = val),
                    ),
                    const Divider(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Target Dry Weight (40%)'.tr,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: KalroColors.textMuted,
                                ),
                              ),
                              Text(
                                '${targetDryWeightKg.toStringAsFixed(1)} kg',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: KalroColors.leaf,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Water To Expel (60%)'.tr,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: KalroColors.textMuted,
                                ),
                              ),
                              Text(
                                '${evaporatedWaterKg.toStringAsFixed(1)} kg',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: KalroColors.warning,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Full 4-Stage Protocol Table
              Text(
                'NSRC Chamber Drying Steps'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: KalroColors.textDark,
                ),
              ),
              const SizedBox(height: 8),
              ...KenyaDryingSchedule.stages.map((stage) {
                final isSelected = stage.stage - 1 == _currentStepIndex;
                return InkWell(
                  onTap: () => _resetToStep(stage.stage - 1),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? KalroColors.headerGreen.withValues(alpha: 0.06)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected
                            ? KalroColors.headerGreen
                            : KalroColors.divider,
                        width: isSelected ? 1.5 : 1.0,
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: isSelected
                              ? KalroColors.headerGreen
                              : KalroColors.divider,
                          child: Text(
                            '${stage.stage}',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isSelected ? Colors.white : KalroColors.textDark,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    '${stage.temperatureC}°C',
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: KalroColors.textDark,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '(${stage.durationMinutes} Minutes)',
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      color: KalroColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                stage.objective,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: KalroColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          const Icon(Icons.check_circle, color: KalroColors.headerGreen, size: 20),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}
