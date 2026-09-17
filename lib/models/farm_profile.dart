import 'app_user.dart';
import 'species.dart';

class FarmProfile {
  FarmProfile({
    required this.id,
    required this.orgName,
    required this.syncCode,
    required this.createdAt,
    this.county,
    this.phone,
    this.houseCount,
    this.primarySpecies,
    this.notes,
  });

  final String id;
  final String orgName;
  final String syncCode;
  final DateTime createdAt;
  final String? county;
  final String? phone;
  final int? houseCount;
  final Species? primarySpecies;
  final String? notes;

  String get locationLine {
    final countyName = county?.trim();
    if (countyName == null || countyName.isEmpty) return orgName;
    return '$orgName · $countyName';
  }

  FarmProfile copyWith({
    String? orgName,
    String? syncCode,
    String? county,
    String? phone,
    int? houseCount,
    Species? primarySpecies,
    String? notes,
    bool clearCounty = false,
    bool clearPhone = false,
    bool clearHouseCount = false,
    bool clearSpecies = false,
    bool clearNotes = false,
  }) {
    return FarmProfile(
      id: id,
      orgName: orgName ?? this.orgName,
      syncCode: syncCode ?? this.syncCode,
      createdAt: createdAt,
      county: clearCounty ? null : (county ?? this.county),
      phone: clearPhone ? null : (phone ?? this.phone),
      houseCount: clearHouseCount ? null : (houseCount ?? this.houseCount),
      primarySpecies: clearSpecies ? null : (primarySpecies ?? this.primarySpecies),
      notes: clearNotes ? null : (notes ?? this.notes),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'orgName': orgName,
        'syncCode': syncCode,
        'createdAt': createdAt.toIso8601String(),
        'county': county,
        'phone': phone,
        'houseCount': houseCount,
        'primarySpecies': primarySpecies?.name,
        'notes': notes,
      };

  factory FarmProfile.fromJson(Map<String, dynamic> json) {
    Species? species;
    final rawSpecies = json['primarySpecies'] as String?;
    if (rawSpecies != null) {
      for (final value in Species.values) {
        if (value.name == rawSpecies) species = value;
      }
    }
    return FarmProfile(
      id: json['id'] as String,
      orgName: json['orgName'] as String,
      syncCode: json['syncCode'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      county: json['county'] as String?,
      phone: json['phone'] as String?,
      houseCount: (json['houseCount'] as num?)?.toInt(),
      primarySpecies: species,
      notes: json['notes'] as String?,
    );
  }
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

  UserSession copyWith({FarmProfile? farm, AppUser? user}) {
    return UserSession(
      farm: farm ?? this.farm,
      user: user ?? this.user,
      farmDirectoryPath: farmDirectoryPath,
    );
  }
}
