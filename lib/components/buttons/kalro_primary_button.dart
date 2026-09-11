import 'package:flutter/material.dart';

class KalroPrimaryButton extends StatelessWidget {
  KalroPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.expanded = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final button = ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        minimumSize: expanded ? Size.fromHeight(44) : null,
      ),
      child: Text(label),
    );

    return expanded ? SizedBox(width: double.infinity, child: button) : button;
  }
}
