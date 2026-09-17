import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/kalro_colors.dart';
import '../l10n/app_localizations.dart';

import 'package:kalro/l10n/translator.dart';

class WalkthroughScreen extends StatefulWidget {
  WalkthroughScreen({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<WalkthroughScreen> createState() => _WalkthroughScreenState();
}

class _WalkthroughScreenState extends State<WalkthroughScreen> {
  final PageController _controller = PageController();
  int _currentIndex = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _finish() => widget.onComplete();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final slides = [
      _Slide(
        title: 'Today'.tr,
        description:
            'Open the app here each morning. You will see what to feed, when to rest the worms, and when harvest is due.'
                .tr,
        icon: Icons.wb_sunny_outlined,
        tabLabel: 'Bottom tab: Today'.tr,
      ),
      _Slide(
        title: 'Batches'.tr,
        description:
            'A batch is one lot of eggs. Start a cycle here, then tap it to log feed, deaths, and harvest on that batch.'
                .tr,
        icon: Icons.layers_outlined,
        tabLabel: 'Bottom tab: Batches'.tr,
      ),
      _Slide(
        title: 'Plan'.tr,
        description:
            'See hatch, moult rest days, spinning, and the cocoon harvest window before you start eggs. Weather and leaf will move the dates.'
                .tr,
        icon: Icons.auto_graph_outlined,
        tabLabel: 'Bottom tab: Plan'.tr,
      ),
      _Slide(
        title: 'Farm'.tr,
        description:
            'Log feeding, health, and harvest. Check leaf stock, money, reports, and the KALRO field guide — nothing is hidden in a side menu.'
                .tr,
        icon: Icons.agriculture_outlined,
        tabLabel: 'Bottom tab: Farm'.tr,
      ),
    ];

    return Scaffold(
      backgroundColor: KalroColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _finish,
                child: Text(
                  'Skip'.tr,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    color: KalroColors.textMuted,
                  ),
                ),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: slides.length,
                onPageChanged: (index) => setState(() => _currentIndex = index),
                itemBuilder: (context, index) {
                  final slide = slides[index];
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(32, 8, 32, 16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: KalroColors.headerGreen.withValues(
                              alpha: 0.1,
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            slide.icon,
                            size: 88,
                            color: KalroColors.headerGreen,
                          ),
                        ),
                        const SizedBox(height: 36),
                        Text(
                          slide.title,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.textDark,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: KalroColors.peach.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            slide.tabLabel,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: KalroColors.accentBrown,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          slide.description,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            height: 1.45,
                            color: KalroColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Row(
                children: [
                  Row(
                    children: List.generate(
                      slides.length,
                      (index) => Container(
                        margin: const EdgeInsets.only(right: 8),
                        width: _currentIndex == index ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentIndex == index
                              ? KalroColors.primaryGreen
                              : KalroColors.divider,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: () {
                      if (_currentIndex < slides.length - 1) {
                        _controller.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      } else {
                        _finish();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: KalroColors.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    child: Text(
                      _currentIndex == slides.length - 1
                          ? (l10n?.getStarted ?? 'Open the farm'.tr)
                          : 'Next'.tr,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Slide {
  _Slide({
    required this.title,
    required this.description,
    required this.icon,
    required this.tabLabel,
  });

  final String title;
  final String description;
  final IconData icon;
  final String tabLabel;
}
