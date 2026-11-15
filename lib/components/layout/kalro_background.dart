import 'package:flutter/material.dart';

import '../../theme/kalro_colors.dart';

class KalroBackground extends StatelessWidget {
  const KalroBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: KalroColors.background,
      child: child,
    );
  }
}
