# What's New in Dart 3.15 (Beta & Dev Channel)

Dart 3.15 introduces language-level **type promotion of `this`** (along with the `unnecessary_this_alias` lint), **preserved type promotions at control-flow join points**, a compile-time restriction allowing **at most one `show` or `hide` combinator** per `import`/`export` directive (`sdk: '^3.15.0'`), IEEE 754 safe integer constants on `double` (`maxSafeInteger` and `minSafeInteger`), 32-bit wrapping integer multiplication (`imul32` in `dart:math` and `Int32x4.operator *` in `dart:typed_data`), JavaScript bitwise operator extensions on `JSAny`, `--define` support in `dart build cli`, and reproducible `.tar.gz` package archives in `dart pub publish`.

---

## 1. Language Features (`sdk: '^3.15.0'`)

### Type Promotion of `this` (`this-promotion`)
In Dart 3.15, `this` can be type promoted directly by type tests (`is`, `as`) and null checks (`== null`, `!= null`), just like a local variable ([language #1397](https://github.com/dart-lang/language/issues/1397)). Both explicit `this.member` accesses and implicit `member` accesses inside instance methods, getters, and extensions benefit from the promoted type.

```dart
class Shape {
  // ❌ Before Dart 3.15 (Required a local 'self' variable alias)
  void describeLegacy() {
    final self = this;
    if (self is Circle) {
      print('Circle with radius ${self.radius}');
    }
  }

  // ✅ Dart 3.15+ (Direct promotion of explicit and implicit `this`)
  void describeModern() {
    if (this is Circle) {
      print('Circle with radius $radius');
    }
  }
}

class Circle extends Shape {
  final double radius;
  Circle(this.radius);
}

extension NullableIntCheck on int? {
  // ✅ Dart 3.15+ (Null check on `this` promotes receiver to non-nullable `int`)
  bool get isEvenOrNull {
    if (this == null) return true;
    return isEven;
  }
}
```

- **Automated Cleanup (`unnecessary_this_alias`)**: The new [`unnecessary_this_alias`](https://dart.dev/lints/unnecessary_this_alias) lint flags local variables that only exist to work around the pre-3.15 behavior, and `dart fix --apply` removes them automatically.

---

### Improved Type Promotion at Control-Flow Join Points
Previously, if two control-flow branches promoted a variable to the same target type (`D`), but reached it via different intermediate types (`B` vs `C`), all promotions were discarded when the branches joined. In Dart 3.15, common promotions shared across branches are preserved after the join point ([language #4757](https://github.com/dart-lang/language/issues/4757)):

```dart
class B {}
class C {}
class D implements B, C {
  void execute() {}
}

void process(Object value, bool useFirstPath) {
  if (useFirstPath) {
    value as B;
    value as D;
  } else {
    value as C;
    value as D;
  }
  // ❌ Before Dart 3.15: Compile-time error (`value` demoted back to `Object`)
  // ✅ Dart 3.15+: `value` retains promoted type `D`
  value.execute();
}
```

---

### Restriction on Multiple `show` / `hide` Combinators (`sdk: '^3.15.0'`)
Import and export directives now allow at most **one** `show` or `hide` combinator clause per directive ([language #2824](https://github.com/dart-lang/language/issues/2824)). Specifying multiple combinators on a single directive was previously deprecated and is now a compile-time error when the language version is `3.15` or higher:

```dart
// ❌ Compile-time error in Dart 3.15+ (Multiple combinators on one directive)
import 'dart:math' show min, max hide pi;
import 'dart:async' show Future show Stream;

// ✅ Valid in Dart 3.15+ (Single combinator per directive)
import 'dart:math' show min, max;
import 'dart:async' show Future, Stream;
```

---

## 2. Core Libraries

### `dart:core`
- **`double.maxSafeInteger` & `double.minSafeInteger`**:
  Added IEEE 754 exact integer range constants on `double`:
  - `double.maxSafeInteger` (`9007199254740991`, that is, $2^{53} - 1$)
  - `double.minSafeInteger` (`-9007199254740991`, that is, $-(2^{53} - 1)$)
  (SDK issue [#64491](https://github.com/dart-lang/sdk/issues/64491)).

### `dart:math`
- **`imul32(int a, int b)`**:
  Performs 32-bit signed wrapping integer multiplication, matching JavaScript `Math.imul` and WebAssembly `i32.mul` semantics across native and web targets (SDK issue [#64491](https://github.com/dart-lang/sdk/issues/64491)).

### `dart:typed_data`
- **`Int32x4` Multiplication Operator (`*`)**:
  Added lane-wise 32-bit integer multiplication (`operator *`) to `Int32x4`, keeping the low 32 bits of each product and wrapping around on overflow (SDK issue [#64170](https://github.com/dart-lang/sdk/issues/64170)).

```dart
import 'dart:math' as math;
import 'dart:typed_data';

void main() {
  final product = math.imul32(0x7fffffff, 2); // -2 (32-bit signed wrap)
  final v1 = Int32x4(2, 4, 8, 16);
  final v2 = Int32x4.splat(3);
  final vProduct = v1 * v2; // lanes: 6, 12, 24, 48
  print('$product, ${vProduct.x}');
}
```

### `dart:js_interop`
- **Bitwise Operator Extensions on `JSAny`**:
  Added `leftShift`, `rightShift`, `bitwiseAnd`, `bitwiseOr`, `bitwiseXor`, and `bitwiseNot` to `JSAnyOperatorExtension` for JavaScript `<<`, `>>`, `&`, `|`, `^`, and `~` operators, supporting both JavaScript `number` and `bigint` values (SDK issue [#64558](https://github.com/dart-lang/sdk/issues/64558)).
- **`jsThrow`**:
  Added `jsThrow` to throw a JavaScript error directly without any Dart wrapper objects.

---

## 3. Tools, CLI, Analyzer & Pub

### Dart CLI
- **`dart build cli --define`**:
  `dart build cli` now supports `-D` / `--define=<key=value>` to pass compile-time environment declarations when building standalone native CLI bundles.

### Analyzer
- **Consistent `operator []=` Type Diagnostics**:
  When a value assigned through `operator []=` (in `a[i] = v`, `a[i] += v`, `a[i] ??= v`, `a[i]++`, and similar compound assignments) is not assignable to the parameter type, the analyzer now reports `argument_type_not_assignable` instead of `invalid_assignment`, matching how non-assignable index expressions are reported (SDK issue [#64561](https://github.com/dart-lang/sdk/issues/64561)).

### Dart Development Compiler (`dartdevc`)
- **Generic Function Type Parameter Capture Fix**:
  Fixed a bug where a type parameter from an enclosing scope could be incorrectly captured by a generic function type declaring a type parameter of the same name, producing the wrong runtime type (SDK issue [#64517](https://github.com/dart-lang/sdk/issues/64517)).

### Pub
- **Reproducible Package Archives**:
  `dart pub publish` now generates deterministic `.tar.gz` archives with canonical entry ordering, zeroed modification timestamps, and normalized file permissions ([dart-lang/pub#4885](https://github.com/dart-lang/pub/pull/4885)).
- **Windows `git.exe` Requirement**:
  On Windows, `dart pub` invokes `git.exe` directly on `PATH` and no longer executes `git.cmd` or `git.bat` batch wrappers ([dart-lang/pub#4941](https://github.com/dart-lang/pub/pull/4941)).
- **Deprecation of `--[no-]precompile`**:
  Deprecated the `--[no-]precompile` flag on `dart pub get`, `upgrade`, `add`, and `remove` ([dart-lang/pub#4910](https://github.com/dart-lang/pub/pull/4910)), as `dart run` and `dart test` now cache precompiled executables directly in `.dart_tool/dartdev/bin/`.
