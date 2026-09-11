import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';


import '../theme/kalro_colors.dart';

import '../l10n/app_localizations.dart';

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

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    
    final slides = [
      _Slide(
        title: l10n?.onboardingWelcomeTitle ?? 'Karibu Kalro!',
        description: l10n?.onboardingWelcomeDesc ?? 'Your digital sericulture assistant. Plan, track, and improve every rearing cycle.',
        icon: Icons.eco_outlined,
      ),
      _Slide(
        title: l10n?.onboardingTrackTitle ?? 'Track Daily Logs',
        description: l10n?.onboardingTrackDesc ?? 'Log metric weights (grams/kg) of feeding and monitor disease and farm health.',
        icon: Icons.monitor_weight_outlined,
      ),
      _Slide(
        title: l10n?.onboardingPredictTitle ?? 'Predict Harvests',
        description: l10n?.onboardingPredictDesc ?? 'Know exactly when your cocoons will be ready with our AI-powered predictions.',
        icon: Icons.auto_graph,
      ),
    ];

    return Scaffold(
      backgroundColor: KalroColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: slides.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentIndex = index;
                  });
                },
                itemBuilder: (context, index) {
                  final slide = slides[index];
                  return Padding(
                    padding: EdgeInsets.all(40),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: KalroColors.primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            slide.icon,
                            size: 100,
                            color: KalroColors.primaryGreen,
                          ),
                        ),
                        SizedBox(height: 48),
                        Text(
                          slide.title,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.textDark,
                          ),
                        ),
                        SizedBox(height: 16),
                        Text(
                          slide.description,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
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
              padding: EdgeInsets.all(24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: List.generate(
                      slides.length,
                      (index) => Container(
                        margin: EdgeInsets.only(right: 8),
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
                  ElevatedButton(
                    onPressed: () {
                      if (_currentIndex < slides.length - 1) {
                        _controller.nextPage(
                          duration: Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      } else {
                        widget.onComplete();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: KalroColors.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    child: Text(
                      _currentIndex == slides.length - 1
                          ? (l10n?.getStarted ?? 'Get Started')
                          : 'Next',
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
  final String title;
  final String description;
  final IconData icon;

  _Slide({required this.title, required this.description, required this.icon});
}
