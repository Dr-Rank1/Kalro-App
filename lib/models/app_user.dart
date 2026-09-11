import 'account_permission.dart';

class AppUser {
  AppUser({
    required this.id,
    required this.farmId,
    required this.username,
    required this.displayName,
    required this.pinHash,
    required this.permission,
    required this.createdAt,
    this.active = true,
  });

  final String id;
  final String farmId;
  final String username;
  final String displayName;
  final String pinHash;
  final AccountPermission permission;
  final DateTime createdAt;
  final bool active;

  AppUser copyWith({
    String? displayName,
    String? pinHash,
    AccountPermission? permission,
    bool? active,
  }) {
    return AppUser(
      id: id,
      farmId: farmId,
      username: username,
      displayName: displayName ?? this.displayName,
      pinHash: pinHash ?? this.pinHash,
      permission: permission ?? this.permission,
      createdAt: createdAt,
      active: active ?? this.active,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'farmId': farmId,
        'username': username,
        'displayName': displayName,
        'pinHash': pinHash,
        'permission': permission.name,
        'createdAt': createdAt.toIso8601String(),
        'active': active,
      };

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        farmId: json['farmId'] as String,
        username: json['username'] as String,
        displayName: json['displayName'] as String,
        pinHash: json['pinHash'] as String,
        permission: AccountPermission.values.byName(json['permission'] as String),
        createdAt: DateTime.parse(json['createdAt'] as String),
        active: json['active'] as bool? ?? true,
      );
}
