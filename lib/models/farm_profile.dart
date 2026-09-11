import 'app_user.dart';

class FarmProfile {
  FarmProfile({
    required this.id,
    required this.orgName,
    required this.syncCode,
    required this.createdAt,
  });

  final String id;
  final String orgName;
  final String syncCode;
  final DateTime createdAt;

  FarmProfile copyWith({String? orgName, String? syncCode}) {
    return FarmProfile(
      id: id,
      orgName: orgName ?? this.orgName,
      syncCode: syncCode ?? this.syncCode,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'orgName': orgName,
        'syncCode': syncCode,
        'createdAt': createdAt.toIso8601String(),
      };

  factory FarmProfile.fromJson(Map<String, dynamic> json) => FarmProfile(
        id: json['id'] as String,
        orgName: json['orgName'] as String,
        syncCode: json['syncCode'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class UserSession {
  const UserSession({
    required this.farm,
    required this.user,
    required this.farmDirectoryPath,
  });

  final FarmProfile farm;
  final AppUser user;
  final String farmDirectoryPath;
}
