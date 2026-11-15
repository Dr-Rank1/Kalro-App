class KenyaSericultureBreeds {
  static const bombyxStrains = [
    'KSK',
    'ATK',
    'ICIPE',
    'KINSHOSHOWA',
    'CSR2 × CSR4',
  ];

  static const eriStrains = [
    'Samia ricini',
  ];
}

class KenyaMulberryCultivars {
  static const characterized = [
    'V1',
    'THIKA',
    'EMBU',
    'ITHAANGA',
    'LIMURU',
    'THAILAND',
    'ICHINOSE',
    'KANVA 2',
    'S54',
    'S36',
    'UNKNOWN 2',
  ];

  static const accessionsUnderEvaluationCount = 98;
}

class KenyaCastorVarieties {
  static const characterized = [
    'NUU 70',
    'KC6',
    'KC 14',
    'KC 2',
    'KC 24',
    'KC 15',
    'KMC8',
  ];
}

class KenyaStationGenebankBlocks {
  static const blocks = [
    'Centre Genebank Block C2 (Ex-Thika)',
    'Centre Genebank Block C3 (Ex-Embu)',
    'Centre Genebank Block C4 (Ex-Limuru)',
    'Centre Genebank (Ex-Ithanga)',
    'Old Genebank',
    'New Genebank',
    'Research Block (Collections)',
    'Research Block (Irrigated)',
    'Research Block (Selections)',
    'Research Block (Non-Irrigated)',
    'Research Block (Cross Selections)',
    'Research Block (Line Selections)',
    'Station Block D1',
    'Station Block D2',
    'Station Block D3',
    'Station Block D4',
    'Highway Farm Stand',
    'Rearing Chamber House 1',
    'Rearing Chamber House 2',
    'Rearing Chamber House 3',
    'Rearing Chamber House 4',
  ];
}

class CocoonDefectInfo {
  const CocoonDefectInfo({
    required this.id,
    required this.name,
    required this.cause,
    required this.reelingImpact,
    required this.defectPenaltyPercent,
  });

  final String id;
  final String name;
  final String cause;
  final String reelingImpact;
  final double defectPenaltyPercent;
}

class KenyaCocoonDefects {
  static const List<CocoonDefectInfo> list = [
    CocoonDefectInfo(
      id: 'thin',
      name: 'Thin Cocoons',
      cause: 'Temperature and humidity variations during spinning; shells loosely spun in layers with low silk content.',
      reelingImpact: 'Fragile shell collapses under boiling; low filament length and poor raw silk recovery.',
      defectPenaltyPercent: 12.0,
    ),
    CocoonDefectInfo(
      id: 'framed',
      name: 'Framed Cocoons',
      cause: 'Improper cocooning frame where cocoons have frame marks imprinted on outer shell.',
      reelingImpact: 'Filament breaks at indented creases during automatic reeling basin movement.',
      defectPenaltyPercent: 15.0,
    ),
    CocoonDefectInfo(
      id: 'irregular',
      name: 'Irregular Cocoons',
      cause: 'Weak larvae and improper cocooning frames resulting in deformed, abnormal shapes.',
      reelingImpact: 'Cannot turn smoothly in reeling basin; erratic tension and continuous silk breaks.',
      defectPenaltyPercent: 18.0,
    ),
    CocoonDefectInfo(
      id: 'melted',
      name: 'Melted Cocoons',
      cause: 'Blood of dead silkworm (inner soiling) where pupa died and adhered to inside shell, causing brown/rusty stains.',
      reelingImpact: 'Dead pupal fluid stains silk gum; gum does not soften uniformly in boiling water.',
      defectPenaltyPercent: 25.0,
    ),
    CocoonDefectInfo(
      id: 'double',
      name: 'Double Cocoons',
      cause: 'Overcrowding of silkworms (>100 worms/ft²) during mounting where two or more larvae spin one cocoon.',
      reelingImpact: 'Inextricably entangled filaments; cannot be machine reeled. Diverted to dupion or hand spinning.',
      defectPenaltyPercent: 20.0,
    ),
    CocoonDefectInfo(
      id: 'stained',
      name: 'Stained Cocoons',
      cause: 'Stained on outer shell by absorption of urine or intestinal fluid of mature larva during mounting.',
      reelingImpact: 'Degrades raw silk luster and color; weakens fibroin protein filaments.',
      defectPenaltyPercent: 16.0,
    ),
    CocoonDefectInfo(
      id: 'pierced',
      name: 'Pierced Cocoons',
      cause: 'Uzi fly maggot boring out or premature moth emergence, completely severing continuous filament.',
      reelingImpact: 'Zero reelability; filament cut into thousands of fragments. Suitable only for carded spun floss.',
      defectPenaltyPercent: 35.0,
    ),
  ];
}

class DryingStageInfo {
  const DryingStageInfo({
    required this.stage,
    required this.temperatureC,
    required this.durationMinutes,
    required this.objective,
  });

  final int stage;
  final int temperatureC;
  final int durationMinutes;
  final String objective;
}

class KenyaDryingSchedule {
  static const List<DryingStageInfo> stages = [
    DryingStageInfo(
      stage: 1,
      temperatureC: 115,
      durationMinutes: 60,
      objective: 'Rapid pupal stifling and initial high-rate moisture expulsion.',
    ),
    DryingStageInfo(
      stage: 2,
      temperatureC: 100,
      durationMinutes: 60,
      objective: 'Core moisture diffusion without burning or denaturing fibroin silk layers.',
    ),
    DryingStageInfo(
      stage: 3,
      temperatureC: 95,
      durationMinutes: 30,
      objective: 'Controlled shell dehydration and moisture gradient equalization.',
    ),
    DryingStageInfo(
      stage: 4,
      temperatureC: 90,
      durationMinutes: 60,
      objective: 'Final conditioning to achieve 40% target dry weight for long-term storage.',
    ),
  ];
}

class BedSpaceStandard {
  const BedSpaceStandard({
    required this.instar,
    required this.stageName,
    required this.bedAreaM2Min,
    required this.bedAreaM2Max,
    required this.feedForm,
    required this.dailyFeedKg,
    required this.limeGramsPerM2,
    required this.instructions,
  });

  final int instar;
  final String stageName;
  final double bedAreaM2Min;
  final double bedAreaM2Max;
  final String feedForm;
  final String dailyFeedKg;
  final double limeGramsPerM2;
  final String instructions;
}

class KenyaBedStandards {
  // Rearing Requirements for 2 Cases (40,000 silkworms)
  static const List<BedSpaceStandard> for40kLarvae = [
    BedSpaceStandard(
      instar: 1,
      stageName: '1st Instar (Chawki Brushing)',
      bedAreaM2Min: 0.5,
      bedAreaM2Max: 1.0,
      feedForm: 'Chopped top 3rd & 4th tender leaves (0.5 cm²)',
      dailyFeedKg: '0.6 - 0.8 kg',
      limeGramsPerM2: 50.0,
      instructions: 'Paraffin paper bed lining. Dust slaked lime uniformly upon settling for 1st moult on Day 4.',
    ),
    BedSpaceStandard(
      instar: 2,
      stageName: '2nd Instar (Chawki)',
      bedAreaM2Min: 1.5,
      bedAreaM2Max: 3.0,
      feedForm: 'Chopped 3rd & 4th leaves below glossy leaves (1.5 cm)',
      dailyFeedKg: '1.4 - 2.8 kg',
      limeGramsPerM2: 50.0,
      instructions: 'Daily bed expansion to prevent crowding. Net cleaning prior to 2nd moult.',
    ),
    BedSpaceStandard(
      instar: 3,
      stageName: '3rd Instar (Adult Transition)',
      bedAreaM2Min: 4.0,
      bedAreaM2Max: 8.0,
      feedForm: 'Leaves from green part of young shoots',
      dailyFeedKg: '8.0 - 12.0 kg',
      limeGramsPerM2: 50.0,
      instructions: 'Spread mesh nets for frass cleaning. Dust dry lime powder when worms raise heads for moult.',
    ),
    BedSpaceStandard(
      instar: 4,
      stageName: '4th Instar (Late Stage Shoot Feeding)',
      bedAreaM2Min: 8.0,
      bedAreaM2Max: 16.0,
      feedForm: 'Whole good shoots (1.0 - 1.5 m branches)',
      dailyFeedKg: '48.0 - 160.0 kg',
      limeGramsPerM2: 50.0,
      instructions: 'Shoot rearing on wooden/metal racks. 4th moult rest lasts up to 48 hours. Ensure cross ventilation.',
    ),
    BedSpaceStandard(
      instar: 5,
      stageName: '5th Instar (Peak Voracious Feeding)',
      bedAreaM2Min: 16.0,
      bedAreaM2Max: 34.0,
      feedForm: 'Whole mature green shoots (1.0 - 1.5 m)',
      dailyFeedKg: '80.0 - 400.0 kg',
      limeGramsPerM2: 50.0,
      instructions: 'Maximum bed area (34 m²). Net clean every other day. Mount on rotary frames at 90-100 worms/ft² when mature.',
    ),
  ];
}
