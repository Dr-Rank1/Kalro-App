export type Language = 'en' | 'sw';

export const TRANSLATIONS = {
  en: {
    appName: 'KALRO Sericulture',
    appSubtitle: 'Kenya Agricultural & Livestock Research Organization',
    navToday: 'Today',
    navBatches: 'Batches',
    navPlan: 'Plan',
    navFarm: 'Farm Work',
    navYou: 'You',
    
    // Quick KPIs
    activeBatches: 'Active Batches',
    liveLarvae: 'Live Larvae',
    avgSurvival: 'Average Survival',
    feedToday: 'Feed Today',
    totalHarvestKg: 'Total Harvest',
    mulberryStock: 'Mulberry Stock',
    castorStock: 'Castor Stock',
    daysCover: 'Days of Cover',
    adequate: 'Adequate',
    warning: 'Warning',
    critical: 'Critical',
    
    // Banners & greetings
    welcomeFarmer: 'Welcome back, Sericulture Farmer',
    todayOverview: 'Here is your silkworm rearing status and daily tasks for today.',
    nightModeBadge: 'Night Rearing Mode Enabled',
    
    // Alerts
    alertsTitle: 'Rearing Alerts & Attention',
    noFeedingLogged: 'No feeding logged today for this batch',
    lowLeafWarning: 'Low leaf stock warning',
    tempStress: 'Temperature stress detected',
    moultRestNotice: 'Moult Rest Day: Do not feed larvae',
    
    // Actions
    logFeed: 'Log Feed',
    logMortality: 'Log Mortality',
    logClimate: 'Log Climate',
    logHarvest: 'Log Harvest',
    newBatch: 'New Batch',
    exportData: 'Export',
    viewDetails: 'View Details',
    qrTag: 'Tray QR Tag',
    closeBatch: 'Close Batch',
    save: 'Save Record',
    cancel: 'Cancel',
    editProfile: 'Edit Profile',
    backupData: 'Export Backup (JSON)',
    restoreData: 'Restore Backup',
    
    // Farm Work Tabs
    tabFeeding: 'Daily Feeding',
    tabHealth: 'Health & Diseases',
    tabHarvest: 'Harvest & Reeling',
    tabLeaf: 'Leaf Ledger',
    tabFinance: 'Finance & Sales',
    tabReports: 'Reports & Export',
    
    // Species
    bombyxLabel: 'Mulberry (Bombyx mori)',
    eriLabel: 'Eri (Samia cynthia ricini)',
    
    // Reeling & Quality
    reelingAnalytics: 'Commercial Reeling & Quality Grading',
    rendittaLabel: 'Renditta (kg cocoon / kg silk)',
    shellRatioLabel: 'Cocoon Shell Ratio %',
    defectRateLabel: 'Defect Rate %',
    gradeLabel: 'Commercial Grade',
    gradeA: 'Grade A (Premium)',
    gradeB: 'Grade B (Standard)',
    gradeC: 'Grade C (Commercial / Low)',
    
    // Diagnostic Sheet
    diagnosticTitle: 'Sericulture Disease Diagnostic Sheet',
    diagnosticSubtitle: 'Match symptoms in rearing trays to immediate field treatments',
    symptomsObserved: 'Symptoms Observed',
    pathogen: 'Pathogen / Cause',
    intervention: 'Immediate Action & Treatment',
    seedLotWarning: 'Seed Lot Transmission Risk! Do not produce eggs from this lot.',
    
    // Leaf Ledger
    leafLedgerTitle: 'Leaf Stock & Consumption Ledger',
    addLeafStock: 'Add Harvested Leaves',
    stockInKg: 'Stock in kg',
    projectedVelocity: 'Estimated Daily Need',
    
    // Profile
    farmProfile: 'Farm Account & Settings',
    county: 'County',
    houseCount: 'Rearing Houses',
    syncCode: 'Sync Code',
    manager: 'Farm Manager',
    clearData: 'Clear Station Records',
    
    // Modals & form fields
    selectBatch: 'Select Batch',
    feedGrams: 'Quantity (Grams)',
    leafType: 'Leaf Type',
    temperature: 'Temperature (°C)',
    humidity: 'Relative Humidity (%)',
    lossCount: 'Larvae Lost (Count)',
    probableCause: 'Probable Cause / Disease',
    notes: 'Observations & Notes',
    wasSkipped: 'Was feed skipped?',
    skipReason: 'Reason for skipping feed',
    
    // Harvest fields
    cocoonCount: 'Cocoon Count',
    grossWeightGrams: 'Total Harvest Weight (Grams)',
    sampleShellGrams: 'Shell Weight of 20 Cocoon Sample (Grams)',
    doubleCocoons: 'Double Cocoons',
    uziPierced: 'Uzi Pierced Cocoons',
    stainedCocoons: 'Stained / Soiled Cocoons',
    flimsyCocoons: 'Flimsy Shells',
    meltedCocoons: 'Melted / Rotten Cocoons',
  },
  sw: {
    appName: 'KALRO Sericulture',
    appSubtitle: 'Shirika la Utafiti wa Kilimo na Mifugo Kenya',
    navToday: 'Leo',
    navBatches: 'Makundi',
    navPlan: 'Mpango',
    navFarm: 'Kazi ya Shamba',
    navYou: 'Wewe',
    
    // Quick KPIs
    activeBatches: 'Makundi Yanayoendelea',
    liveLarvae: 'Minyoo Hai',
    avgSurvival: 'Wastani wa Kuishi',
    feedToday: 'Chakula cha Leo',
    totalHarvestKg: 'Mavuno Yote (kg)',
    mulberryStock: 'Akiba ya Majani ya Mkuyu',
    castorStock: 'Akiba ya Majani ya Mbarika',
    daysCover: 'Siku za Majani Yaliyobaki',
    adequate: 'Inatosha',
    warning: 'Tahadhari',
    critical: 'Hali Ngumu',
    
    // Banners & greetings
    welcomeFarmer: 'Karibu tena, Mkulima wa Hariri',
    todayOverview: 'Hali ya ufugaji wa hariri na majukumu yako ya leo.',
    nightModeBadge: 'Hali ya Usiku Imewashwa',
    
    // Alerts
    alertsTitle: 'Tahadhari na Mambo ya Kuzingatia',
    noFeedingLogged: 'Hakuna chakula kilichoandikwa leo kwa kundi hili',
    lowLeafWarning: 'Tahadhari: Akiba ya majani iko chini',
    tempStress: 'Hali ya hewa chumbani iko nje ya viwango',
    moultRestNotice: 'Siku ya Kuvua Ngozi: Usilishe minyoo majani',
    
    // Actions
    logFeed: 'Andika Chakula',
    logMortality: 'Andika Vifo',
    logClimate: 'Andika Hewa',
    logHarvest: 'Andika Mavuno',
    newBatch: 'Kundi Jipya',
    exportData: 'Toa Ripoti',
    viewDetails: 'Angalia Zaidi',
    qrTag: 'Lebo ya QR ya Treya',
    closeBatch: 'Funga Kundi',
    save: 'Hifadhi Kumbukumbu',
    cancel: 'Ghairi',
    editProfile: 'Badilisha Wasifu',
    backupData: 'Toa Nakala ya Data (JSON)',
    restoreData: 'Rudisha Nakala ya Data',
    
    // Farm Work Tabs
    tabFeeding: 'Ulishaji wa Kila Siku',
    tabHealth: 'Afya na Magonjwa',
    tabHarvest: 'Mavuno na Ubora',
    tabLeaf: 'Daftari la Majani',
    tabFinance: 'Fedha na Mauzo',
    tabReports: 'Ripoti na Takwimu',
    
    // Species
    bombyxLabel: 'Hariri ya Mkuyu (Bombyx mori)',
    eriLabel: 'Hariri ya Eri (Samia cynthia ricini)',
    
    // Reeling & Quality
    reelingAnalytics: 'Kipimo cha Ubora wa Hariri na Renditta',
    rendittaLabel: 'Renditta (Kilo za Vifukofuko / Kilo ya Hariri)',
    shellRatioLabel: 'Kiwango cha Ganda la Hariri %',
    defectRateLabel: 'Kiwango cha Kasoro %',
    gradeLabel: 'Daraja la Kibiashara',
    gradeA: 'Daraja A (Bora Zaidi)',
    gradeB: 'Daraja B (Wastani)',
    gradeC: 'Daraja C (Kiwango cha Chini)',
    
    // Diagnostic Sheet
    diagnosticTitle: 'Mwongozo wa Utambuzi wa Magonjwa ya Hariri',
    diagnosticSubtitle: 'Linganisha dalili kwenye treya na hatua za haraka za matibabu',
    symptomsObserved: 'Dalili Zinazoonekana',
    pathogen: 'Chanzo cha Ugonjwa',
    intervention: 'Hatua za Haraka na Matibabu',
    seedLotWarning: 'Hatari ya Kuambukiza Mayai! Usizalishe mayai kutoka kundi hili.',
    
    // Leaf Ledger
    leafLedgerTitle: 'Akiba ya Majani na Matumizi',
    addLeafStock: 'Ongeza Majani Yaliyovunwa',
    stockInKg: 'Kiasi katika Kilo (kg)',
    projectedVelocity: 'Makadirio ya Mahitaji kwa Siku',
    
    // Profile
    farmProfile: 'Akaunti ya Shamba na Mipangilio',
    county: 'Kaunti',
    houseCount: 'Vyumba vya Kufugia',
    syncCode: 'Msimbo wa Usawazishaji',
    manager: 'Msimamizi wa Shamba',
    clearData: 'Futa Data ya Kituo',
    
    // Modals & form fields
    selectBatch: 'Chagua Kundi',
    feedGrams: 'Kiasi (Gramu)',
    leafType: 'Aina ya Majani',
    temperature: 'Kiwango cha Joto (°C)',
    humidity: 'Kiwango cha Unyevu (%)',
    lossCount: 'Idadi ya Minyoo Iliyokufa',
    probableCause: 'Chanzo Kinachodhaniwa',
    notes: 'Uchunguzi na Maelezo',
    wasSkipped: 'Je, chakula kilirukwa?',
    skipReason: 'Sababu ya kuruka chakula',
    
    // Harvest fields
    cocoonCount: 'Idadi ya Vifukofuko',
    grossWeightGrams: 'Uzito Wote wa Mavuno (Gramu)',
    sampleShellGrams: 'Uzito wa Maganda (Sampuli ya Vifukofuko 20)',
    doubleCocoons: 'Vifuko Vilivyoungana (Double)',
    uziPierced: 'Vifuko Vilivyotobolewa na Inzi',
    stainedCocoons: 'Vifuko Vilivyochafuliwa',
    flimsyCocoons: 'Maganda Mepesi Sana',
    meltedCocoons: 'Vifuko Vilivyooza Ndani',
  },
};
