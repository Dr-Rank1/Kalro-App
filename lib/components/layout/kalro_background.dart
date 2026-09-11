import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../theme/kalro_colors.dart';

class KalroBackground extends StatelessWidget {
  const KalroBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned.fill(child: ColoredBox(color: KalroColors.background)),
        const Positioned.fill(child: CustomPaint(painter: _WavePatternPainter())),
        child,
      ],
    );
  }
}

class _WavePatternPainter extends CustomPainter {
  const _WavePatternPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = KalroColors.waveLine
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    for (var i = 0; i < 12; i++) {
      final path = Path();
      final yOffset = size.height * 0.08 * i;
      path.moveTo(0, yOffset);
      for (var x = 0.0; x <= size.width; x += 8) {
        path.lineTo(
          x,
          yOffset + (12 * (i.isEven ? 1 : -1) * math.sin(x / size.width * math.pi * 2)),
        );
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
