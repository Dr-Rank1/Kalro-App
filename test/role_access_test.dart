import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/services/role_access.dart';
import 'package:kalro/services/user_preferences.dart';

void main() {
  test('SWR sees daily farm work only', () {
    expect(RoleAccess.showFinance(UserRole.swr), isFalse);
    expect(RoleAccess.showReports(UserRole.swr), isFalse);
  });

  test('ASR sees reports, CRC and RSP see finance', () {
    expect(RoleAccess.showReports(UserRole.asr), isTrue);
    expect(RoleAccess.showFinance(UserRole.asr), isFalse);
    expect(RoleAccess.showFinance(UserRole.rsp), isTrue);
    expect(RoleAccess.showFinance(UserRole.crc), isTrue);
    expect(RoleAccess.showReports(UserRole.crc), isTrue);
  });
}
