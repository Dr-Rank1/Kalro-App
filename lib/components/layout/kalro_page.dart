import 'package:flutter/material.dart';

import 'kalro_background.dart';

class KalroPage extends StatelessWidget {
  KalroPage({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(16, 16, 16, 24),
    this.onRefresh,
    this.scrollable = true,
  });

  final Widget child;
  final EdgeInsets padding;
  final Future<void> Function()? onRefresh;
  final bool scrollable;

  @override
  Widget build(BuildContext context) {
    final content = scrollable
        ? ListView(padding: padding, children: [child])
        : Padding(padding: padding, child: child);

    return KalroBackground(
      child: SafeArea(
        child: onRefresh == null
            ? content
            : RefreshIndicator(
                onRefresh: onRefresh!,
                child: _wrapScrollable(content),
              ),
      ),
    );
  }

  Widget _wrapScrollable(Widget child) {
    if (child is ListView) {
      return child;
    }
    return ListView(
      physics: AlwaysScrollableScrollPhysics(),
      children: [SizedBox(height: 400, child: child)],
    );
  }
}
