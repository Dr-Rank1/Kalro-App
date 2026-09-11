import 'package:flutter/material.dart';
import 'package:kalro/l10n/translator.dart';

class AsyncContent<T> extends StatelessWidget {
  AsyncContent({
    super.key,
    required this.future,
    required this.builder,
    this.loading,
    this.errorBuilder,
  });

  final Future<T> future;
  final Widget Function(BuildContext context, T data) builder;
  final Widget? loading;
  final Widget Function(BuildContext context, Object error)? errorBuilder;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return loading ?? Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return errorBuilder?.call(context, snapshot.error!) ??
              Center(child: Text('Something went wrong: ${snapshot.error}'.tr));
        }
        if (!snapshot.hasData) {
          return SizedBox.shrink();
        }
        return builder(context, snapshot.data as T);
      },
    );
  }
}
