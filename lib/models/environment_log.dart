class EnvironmentLog {
  EnvironmentLog({
    required this.id,
    required this.batchId,
    required this.recordedAt,
    required this.temperatureCelsius,
    required this.humidityPercent,
    this.ventilation,
    this.lightCondition,
    this.notes,
    this.roomName,
  });

  final String id;
  final String batchId;
  final DateTime recordedAt;
  final double temperatureCelsius;
  final double humidityPercent;
  final String? ventilation;
  final String? lightCondition;
  final String? notes;
  final String? roomName;

  Map<String, dynamic> toJson() => {
        'id': id,
        'batchId': batchId,
        'recordedAt': recordedAt.toIso8601String(),
        'temperatureCelsius': temperatureCelsius,
        'humidityPercent': humidityPercent,
        'ventilation': ventilation,
        'lightCondition': lightCondition,
        'notes': notes,
        'roomName': roomName,
      };

  factory EnvironmentLog.fromJson(Map<String, dynamic> json) => EnvironmentLog(
        id: json['id'] as String,
        batchId: json['batchId'] as String,
        recordedAt: DateTime.parse(json['recordedAt'] as String),
        temperatureCelsius: (json['temperatureCelsius'] as num).toDouble(),
        humidityPercent: (json['humidityPercent'] as num).toDouble(),
        ventilation: json['ventilation'] as String?,
        lightCondition: json['lightCondition'] as String?,
        notes: json['notes'] as String?,
        roomName: json['roomName'] as String?,
      );
}
