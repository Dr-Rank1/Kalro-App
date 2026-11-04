import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { TodayView } from './components/TodayView';
import { BatchesView } from './components/BatchesView';
import { PlanView } from './components/PlanView';
import { FarmToolsView } from './components/FarmToolsView';
import { ProfileView } from './components/ProfileView';
import { QuickLogModal } from './components/QuickLogModal';
import { QrCodeModal } from './components/QrCodeModal';
import { ReportExportModal } from './components/ReportExportModal';
import { downloadSingleBatchPdf } from './utils/pdfGenerator';
import { storage } from './storage';
import {
  Batch,
  CocoonHarvest,
  EnvironmentLog,
  FarmProfile,
  FeedLog,
  LeafInventory,
  LeafMovement,
  MortalityLog,
  PaymentRecord,
} from './types';

export function App() {
  // Initialize storage defaults if empty
  storage.initDefaults();

  const initialBatches = storage.getBatches();
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    return initialBatches.length === 0 ? 'batches' : 'today';
  });

  // Application Data State
  const [profile, setProfile] = useState<FarmProfile>(storage.getProfile());
  const [batches, setBatches] = useState<Batch[]>(storage.getBatches());
  const [feedLogs, setFeedLogs] = useState<FeedLog[]>(storage.getFeedLogs());
  const [mortalityLogs, setMortalityLogs] = useState<MortalityLog[]>(storage.getMortalityLogs());
  const [envLogs, setEnvLogs] = useState<EnvironmentLog[]>(storage.getEnvironmentLogs());
  const [harvests, setHarvests] = useState<CocoonHarvest[]>(storage.getCocoonHarvests());
  const [inventory, setInventory] = useState<LeafInventory>(storage.getLeafInventory());
  const [leafMovements, setLeafMovements] = useState<LeafMovement[]>(storage.getLeafMovements());
  const [payments, setPayments] = useState<PaymentRecord[]>(storage.getPayments());

  // Modal States
  const [quickLogState, setQuickLogState] = useState<{
    open: boolean;
    batchId?: string;
    type?: 'feed' | 'mortality' | 'climate' | 'harvest';
  }>({ open: false });

  const [qrModalBatch, setQrModalBatch] = useState<Batch | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Lock to clean light theme
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
  }, []);

  // Refresh all state from storage
  const reloadAll = () => {
    setProfile(storage.getProfile());
    setBatches(storage.getBatches());
    setFeedLogs(storage.getFeedLogs());
    setMortalityLogs(storage.getMortalityLogs());
    setEnvLogs(storage.getEnvironmentLogs());
    setHarvests(storage.getCocoonHarvests());
    setInventory(storage.getLeafInventory());
    setLeafMovements(storage.getLeafMovements());
    setPayments(storage.getPayments());
  };

  // Mutators
  const handleAddBatch = (b: Batch) => {
    storage.addBatch(b);
    reloadAll();
    showToast(`Batch "${b.displayTag || b.batchTag}" created successfully.`);
  };

  const handleUpdateBatch = (b: Batch) => {
    storage.updateBatch(b);
    reloadAll();
    showToast(`Batch "${b.displayTag || b.batchTag}" status updated.`);
  };

  const handleAddFeed = (f: FeedLog) => {
    storage.addFeedLog(f);
    reloadAll();
    showToast(`Feeding logged (${(f.quantityGrams / 1000).toFixed(1)} kg ${f.leafType}).`);
  };

  const handleAddMortality = (m: MortalityLog) => {
    storage.addMortalityLog(m);
    reloadAll();
    showToast(`Recorded loss of ${m.count} larvae.`);
  };

  const handleAddClimate = (e: EnvironmentLog) => {
    storage.addEnvironmentLog(e);
    reloadAll();
    showToast(`Climate recorded: ${e.temperatureCelsius}°C, ${e.humidityPercent}% RH.`);
  };

  const handleAddHarvest = (h: CocoonHarvest) => {
    storage.addCocoonHarvest(h);
    reloadAll();
    showToast(`Harvest recorded: ${(h.totalWeightGrams / 1000).toFixed(1)} kg cocoons.`);
  };

  const handleAddLeafMovement = (m: LeafMovement) => {
    storage.addLeafMovement(m);
    reloadAll();
    showToast(`Leaf ledger updated: +${m.quantityKg} kg ${m.leafType}.`);
  };

  const handleAddPayment = (p: PaymentRecord) => {
    storage.addPayment(p);
    reloadAll();
    showToast(`Payment recorded: KES ${p.amount.toLocaleString()}.`);
  };

  const handleUpdateProfile = (p: FarmProfile) => {
    storage.saveProfile(p);
    reloadAll();
    showToast('Farm profile updated successfully.');
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = storage.exportBatchesCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kalro_batches_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Batches CSV downloaded.');
  };

  // JSON Backup Export
  const handleExportBackup = async () => {
    const jsonStr = await storage.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kalro_farm_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Signed backup JSON downloaded.');
  };

  // JSON Backup Import
  const handleImportBackup = async (jsonStr: string) => {
    const result = await storage.importBackupJson(jsonStr);
    if (result.success) {
      reloadAll();
      showToast(result.message);
    }
    return result;
  };

  // Clear All Station Records
  const handleClearAllRecords = () => {
    storage.clearAll();
    reloadAll();
    showToast('All station records cleared.');
  };

  const activeBatchesCount = batches.filter((b) => b.status === 'active').length;

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        profile={profile}
        activeBatchesCount={activeBatchesCount}
        onOpenQuickLog={() => setQuickLogState({ open: true })}
        onOpenReportModal={() => setReportModalOpen(true)}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeBatchesCount={activeBatchesCount}
      />

      {/* Main Views Container */}
      <main className="main-content">
        {activeTab === 'today' && (
          <TodayView
            batches={batches}
            feedLogs={feedLogs}
            mortalityLogs={mortalityLogs}
            envLogs={envLogs}
            harvests={harvests}
            inventory={inventory}
            onOpenQuickLog={(batchId, type) => setQuickLogState({ open: true, batchId, type })}
            onSelectTab={(tab) => setActiveTab(tab as NavTab)}
            onExportBatchPdf={(b) => {
              downloadSingleBatchPdf({
                batch: b,
                profile,
                feedLogs,
                mortalityLogs,
                envLogs,
                harvests,
              });
              showToast(`Lot dossier for "${b.displayTag || b.batchTag || b.id}" exported as PDF.`);
            }}
          />
        )}

        {activeTab === 'batches' && (
          <BatchesView
            batches={batches}
            feedLogs={feedLogs}
            mortalityLogs={mortalityLogs}
            harvests={harvests}
            profile={profile}
            envLogs={envLogs}
            onAddBatch={handleAddBatch}
            onUpdateBatch={handleUpdateBatch}
            onOpenQuickLog={(batchId, type) => setQuickLogState({ open: true, batchId, type })}
            onOpenQr={(b) => setQrModalBatch(b)}
            onToast={showToast}
          />
        )}

        {activeTab === 'plan' && (
          <PlanView
            batches={batches}
          />
        )}

        {activeTab === 'farm' && (
          <FarmToolsView
            batches={batches}
            feedLogs={feedLogs}
            mortalityLogs={mortalityLogs}
            harvests={harvests}
            inventory={inventory}
            leafMovements={leafMovements}
            payments={payments}
            onAddFeedLog={handleAddFeed}
            onAddMortalityLog={handleAddMortality}
            onAddHarvest={handleAddHarvest}
            onAddLeafMovement={handleAddLeafMovement}
            onAddPayment={handleAddPayment}
            onExportCsv={handleExportCsv}
            onExportBackup={handleExportBackup}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        )}

        {activeTab === 'you' && (
          <ProfileView
            profile={profile}
            batches={batches}
            harvests={harvests}
            payments={payments}
            onUpdateProfile={handleUpdateProfile}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onClearAllRecords={handleClearAllRecords}
          />
        )}
      </main>

      {/* Quick Log Modal */}
      {quickLogState.open && (
        <QuickLogModal
          batches={batches}
          initialBatchId={quickLogState.batchId}
          defaultType={quickLogState.type}
          onClose={() => setQuickLogState({ open: false })}
          onSaveFeed={handleAddFeed}
          onSaveMortality={handleAddMortality}
          onSaveClimate={handleAddClimate}
          onSaveHarvest={handleAddHarvest}
        />
      )}

      {/* Tray QR Code Modal */}
      {qrModalBatch && (
        <QrCodeModal
          batch={qrModalBatch}
          onClose={() => setQrModalBatch(null)}
        />
      )}

      {/* Official Station PDF Report & Print Modal */}
      <ReportExportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        profile={profile}
        batches={batches}
        feedLogs={feedLogs}
        mortalityLogs={mortalityLogs}
        envLogs={envLogs}
        harvests={harvests}
        inventory={inventory}
        leafMovements={leafMovements}
        payments={payments}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
