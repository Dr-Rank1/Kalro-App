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
import { ProfileFormModal, ProfileFormData } from './components/ProfileFormModal';
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
  UserAccount,
} from './types';
import { USER_ROLES } from './constants';

const DEFAULT_BLANK_PROFILE: FarmProfile = {
  id: 'guest-profile',
  orgName: 'KALRO Sericulture Station',
  county: 'Kiambu',
  houseCount: 1,
  syncCode: 'KALRO-SERI-KBU-001',
  managerName: 'Farm Lead',
};

export function App() {
  // Initialize storage defaults and clean any legacy demo profiles
  storage.initDefaults();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => storage.getActiveUser());
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => storage.getAllUsers());

  const initialBatches = storage.getBatches();
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTab | null;
      if (tabParam && ['today', 'batches', 'plan', 'farm', 'you'].includes(tabParam)) {
        return tabParam;
      }
    }
    return initialBatches.length === 0 ? 'batches' : 'today';
  });

  // Application Data State for active user tenant
  const [profile, setProfile] = useState<FarmProfile | null>(() => storage.getProfile());
  const [batches, setBatches] = useState<Batch[]>(() => storage.getBatches());
  const [feedLogs, setFeedLogs] = useState<FeedLog[]>(() => storage.getFeedLogs());
  const [mortalityLogs, setMortalityLogs] = useState<MortalityLog[]>(() => storage.getMortalityLogs());
  const [envLogs, setEnvLogs] = useState<EnvironmentLog[]>(() => storage.getEnvironmentLogs());
  const [harvests, setHarvests] = useState<CocoonHarvest[]>(() => storage.getCocoonHarvests());
  const [inventory, setInventory] = useState<LeafInventory>(() => storage.getLeafInventory());
  const [leafMovements, setLeafMovements] = useState<LeafMovement[]>(() => storage.getLeafMovements());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => storage.getPayments());

  // Modal States
  const [quickLogState, setQuickLogState] = useState<{
    open: boolean;
    batchId?: string;
    type?: 'feed' | 'mortality' | 'climate' | 'harvest';
  }>({ open: false });

  const [qrModalBatch, setQrModalBatch] = useState<Batch | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Profile Modal State (Create / Edit)
  const [profileModalState, setProfileModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    onComplete?: () => void;
  }>({ open: false, mode: 'create' });

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

  // Refresh all state from storage for the active tenant
  const reloadAll = () => {
    const active = storage.getActiveUser();
    setCurrentUser(active);
    setAllUsers(storage.getAllUsers());
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

  // Switch Active Tenant
  const handleSwitchUser = (userId: string) => {
    storage.setActiveUserId(userId);
    reloadAll();
    const active = storage.getActiveUser();
    if (active) {
      const roleMeta = USER_ROLES.find((r) => r.value === active.role);
      showToast(`Switched account to ${active.username} (${roleMeta?.label || active.role}).`);
    }
  };

  // Delete Farmer Profile
  const handleDeleteUser = (userId: string): boolean => {
    const success = storage.deleteUserProfile(userId);
    if (success) {
      reloadAll();
      showToast('Profile deleted.');
    }
    return success;
  };

  // Profile Creation & Editing Dialog Triggers
  const handleOpenCreateProfile = (onComplete?: () => void) => {
    setProfileModalState({ open: true, mode: 'create', onComplete });
  };

  const handleOpenEditProfile = () => {
    setProfileModalState({ open: true, mode: 'edit' });
  };

  const handleSaveProfileForm = (data: ProfileFormData) => {
    if (profileModalState.mode === 'create') {
      const res = storage.createUserProfile(data);
      reloadAll();
      showToast(`Welcome, ${res.user.username}! Farm profile created.`);
    } else {
      storage.updateUserProfile(data);
      reloadAll();
      showToast('Farm profile updated successfully.');
    }

    const cb = profileModalState.onComplete;
    setProfileModalState({ open: false, mode: 'create' });
    if (cb) {
      cb();
    }
  };

  // Mutators for Active Tenant
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

  // CSV Export for Active Tenant
  const handleExportCsv = () => {
    if (!currentUser) {
      showToast('No active farm profile to export.');
      return;
    }
    const csv = storage.exportBatchesCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `kalro_${currentUser.username.toLowerCase().replace(/\s+/g, '_')}_batches_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Batches CSV downloaded.');
  };

  // Single Farmer JSON Backup Export
  const handleExportActiveUserBackup = async () => {
    if (!currentUser) {
      showToast('No active farm profile to export.');
      return;
    }
    const jsonStr = await storage.exportActiveUserBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `kalro_farmer_${currentUser.username.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Signed backup for "${currentUser.username}" downloaded.`);
  };

  // Full Multi-Tenant Database Backup Export
  const handleExportFullDatabaseBackup = async () => {
    const jsonStr = await storage.exportFullDatabaseBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `kalro_multitenant_full_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Full backup downloaded.');
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

  // Clear Active User Records
  const handleClearActiveUserRecords = () => {
    if (!currentUser) return;
    storage.clearActiveUserRecords();
    reloadAll();
    showToast(`All records for active farmer "${currentUser.username}" purged.`);
  };

  const activeBatchesCount = batches.filter((b) => b.status === 'active').length;

  return (
    <div className="app-container">
      {/* Header with Account Switcher or Set Up Button */}
      <Header
        profile={profile}
        currentUser={currentUser}
        allUsers={allUsers}
        activeBatchesCount={activeBatchesCount}
        onOpenReportModal={() => {
          if (!profile) {
            showToast('Please set up a farm profile before exporting reports.');
            handleOpenCreateProfile();
            return;
          }
          setReportModalOpen(true);
        }}
        onSwitchUser={handleSwitchUser}
        onOpenNewUserModal={() => handleOpenCreateProfile()}
        onNavigateToProfile={() => setActiveTab('you')}
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
            profile={profile}
            onOpenCreateProfile={() => handleOpenCreateProfile(() => setActiveTab('today'))}
            onOpenQuickLog={(batchId, type) => {
              if (!profile) {
                handleOpenCreateProfile();
                return;
              }
              setQuickLogState({ open: true, batchId, type });
            }}
            onSelectTab={(tab) => setActiveTab(tab as NavTab)}
            onExportBatchPdf={(b) => {
              if (!profile) {
                showToast('Please set up a farm profile before exporting PDF.');
                handleOpenCreateProfile();
                return;
              }
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
            onOpenQuickLog={(batchId, type) => {
              if (!profile) {
                handleOpenCreateProfile();
                return;
              }
              setQuickLogState({ open: true, batchId, type });
            }}
            onOpenQr={(b) => setQrModalBatch(b)}
            onToast={showToast}
            onRequireProfile={() => handleOpenCreateProfile(() => setActiveTab('batches'))}
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
            onExportBackup={handleExportActiveUserBackup}
            onOpenReportModal={() => {
              if (!profile) {
                showToast('Please set up a farm profile before exporting reports.');
                handleOpenCreateProfile();
                return;
              }
              setReportModalOpen(true);
            }}
          />
        )}

        {activeTab === 'you' && (
          <ProfileView
            profile={profile}
            currentUser={currentUser}
            allUsers={allUsers}
            batches={batches}
            harvests={harvests}
            payments={payments}
            onOpenCreateProfile={() => handleOpenCreateProfile()}
            onOpenEditProfile={handleOpenEditProfile}
            onSwitchUser={handleSwitchUser}
            onDeleteUser={handleDeleteUser}
            onExportActiveUserBackup={handleExportActiveUserBackup}
            onImportBackup={handleImportBackup}
            onClearActiveUserRecords={handleClearActiveUserRecords}
          />
        )}
      </main>

      {/* Quick Log Modal */}
      {quickLogState.open && (
        <QuickLogModal
          batches={batches}
          feedLogs={feedLogs}
          mortalityLogs={mortalityLogs}
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
        profile={profile || DEFAULT_BLANK_PROFILE}
        batches={batches}
        feedLogs={feedLogs}
        mortalityLogs={mortalityLogs}
        envLogs={envLogs}
        harvests={harvests}
        inventory={inventory}
        leafMovements={leafMovements}
        payments={payments}
      />

      {/* Improved Farmer Profile Creation & Editing Modal */}
      <ProfileFormModal
        isOpen={profileModalState.open}
        mode={profileModalState.mode}
        initialData={{ user: currentUser, profile }}
        onClose={() => setProfileModalState({ open: false, mode: 'create' })}
        onSave={handleSaveProfileForm}
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
