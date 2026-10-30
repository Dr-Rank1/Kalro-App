import 'package:flutter/material.dart';

/// Kalro Sericulture brand palette.
abstract final class KalroColors {
  static const headerGreen = Color(0xFF1A332B);
  static const primaryGreen = Color(0xFF214641);
  static const footerGreen = Color(0xFF1E443F);
  static const accentBrown = Color(0xFFA35541);
  static const accentGold = Color(0xFF914D2B);
  static const peach = Color(0xFFF8D3BB);
  static const background = Color(0xFFF7F6F2);
  static const cardWhite = Color(0xFFFFFFFF);
  static const textDark = Color(0xFF1A2E26);
  static const textMuted = Color(0xFF4A5568);
  static const textLight = Color(0xFF718096);
  static const divider = Color(0xFFE8E8E8);
  static const waveLine = Color(0x1A214641);
  static const navInactive = Color(0xFFAAAAAA);
  static const navActive = Color(0xFF214641);
  static const buttonGreen = Color(0xFF1A332B);
  static const leaf = Color(0xFF3D7A54);
  static const rest = Color(0xFFC46B3A);
  static const harvest = Color(0xFF914D2B);
  static const success = Color(0xFF2E7D57);
  static const danger = Color(0xFFB42318);
  static const info = Color(0xFF2B6CB0);
  static const darkBackground = Color(0xFF101915);
  static const darkSurface = Color(0xFF172520);
  static const darkCard = Color(0xFF1E2E28);
  static const darkText = Color(0xFFECEFF1);
  static const darkTextMuted = Color(0xFFA0ABA5);
  static const darkDivider = Color(0xFF2B3D35);

  static List<BoxShadow> get softShadow => const [
        BoxShadow(
          color: Color(0x14000000),
          blurRadius: 20,
          offset: Offset(0, 8),
        ),
      ];
}
