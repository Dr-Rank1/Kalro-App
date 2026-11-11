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
import { DeleteProfileModal } from './components/DeleteProfileModal';
import { BatchRegistrationForm } from './components/BatchRegistrationForm';
import { LeafStockModal } from './components/LeafStockModal';
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

  const VALID_TABS: NavTab[] = ['today', 'batches', 'plan', 'farm', 'you'];

  const initialBatches = storage.getBatches();
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTab | null;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        return tabParam;
      }
      try {
        const storedTab = localStorage.getItem('kalro_active_tab') as NavTab | null;
        if (storedTab && VALID_TABS.includes(storedTab)) {
          return storedTab;
        }
      } catch {
        // ignore storage errors
      }
    }
    return 'today';
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

  // Today Action Modals
  const [todayBatchModalOpen, setTodayBatchModalOpen] = useState(false);
  const [todayLeafModalOpen, setTodayLeafModalOpen] = useState(false);

  // Profile Modal State (Create / Edit)
  const [profileModalState, setProfileModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    onComplete?: () => void;
  }>(() => ({
    open: storage.getAllUsers().length === 0,
    mode: 'create',
  }));

  // Delete Profile Confirmation Target
  const [deleteProfileTarget, setDeleteProfileTarget] = useState<UserAccount | null>(null);

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

  // First-Login / Onboarding trigger: If no farm profiles exist in storage, prompt immediately
  useEffect(() => {
    if (storage.getAllUsers().length === 0 && !storage.getActiveUser()) {
      setProfileModalState({ open: true, mode: 'create' });
    }
  }, []);

  // Synchronize activeTab with URL query parameter and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('kalro_active_tab', activeTab);
    } catch {
      // ignore
    }

    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get('tab') !== activeTab) {
      currentUrl.searchParams.set('tab', activeTab);
      if (activeTab !== 'farm') {
        currentUrl.searchParams.delete('subtab');
      }
      window.history.replaceState({ tab: activeTab }, '', currentUrl.toString());
    }
  }, [activeTab]);

  // Handle browser back and forward button navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTab | null;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Explicit tab selection handler that pushes browser history
  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('kalro_active_tab', tab);
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('tab') !== tab) {
        currentUrl.searchParams.set('tab', tab);
        if (tab !== 'farm') {
          currentUrl.searchParams.delete('subtab');
        }
        window.history.pushState({ tab }, '', currentUrl.toString());
      }
    }
  };

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
    const userToDelete = allUsers.find((u) => u.id === userId);
    const username = userToDelete?.username || 'Profile';
    const isDeletingActive = currentUser?.id === userId;
    const remainingUsers = allUsers.filter((u) => u.id !== userId);

    const success = storage.deleteUserProfile(userId);
    if (success) {
      reloadAll();
      if (isDeletingActive) {
        if (remainingUsers.length > 0) {
          showToast(`Deleted profile for "${username}". Switched to ${remainingUsers[0].username}.`);
        } else {
          showToast(`Deleted profile for "${username}". No active profiles.`);
        }
      } else {
        showToast(`Deleted profile for "${username}".`);
      }
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
      handleSelectTab('today');
      showToast(`Welcome, ${res.user.username}! Farm profile created. Welcome to Today's Operations.`);
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
        onNavigateToProfile={() => handleSelectTab('you')}
        onRequestDeleteUser={(u) => setDeleteProfileTarget(u)}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        activeBatchesCount={activeBatchesCount}
      />

      {/* Main Views Container */}
      <main className="main-content">
        <div key={activeTab} className="view-enter-animate">
          {activeTab === 'today' && (
            <TodayView
              batches={batches}
              feedLogs={feedLogs}
              mortalityLogs={mortalityLogs}
              envLogs={envLogs}
              harvests={harvests}
              inventory={inventory}
              profile={profile}
              onOpenCreateProfile={() => handleOpenCreateProfile(() => handleSelectTab('today'))}
              onOpenAddBatch={() => setTodayBatchModalOpen(true)}
              onOpenAddLeaf={() => setTodayLeafModalOpen(true)}
              onOpenQuickLog={(batchId, type) => {
                if (!profile) {
                  handleOpenCreateProfile();
                  return;
                }
                setQuickLogState({ open: true, batchId, type });
              }}
              onSelectTab={(tab) => handleSelectTab(tab as NavTab)}
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
              onRequireProfile={() => handleOpenCreateProfile(() => handleSelectTab('batches'))}
            />
          )}

          {activeTab === 'plan' && (
            <PlanView
              batches={batches}
              onSelectTab={handleSelectTab}
            />
          )}

          {activeTab === 'farm' && (
            <FarmToolsView
              batches={batches}
              feedLogs={feedLogs}
              mortalityLogs={mortalityLogs}
              envLogs={envLogs}
              harvests={harvests}
              inventory={inventory}
              leafMovements={leafMovements}
              payments={payments}
              profile={profile}
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
              onRequestDeleteUser={(u) => setDeleteProfileTarget(u)}
            />
          )}
        </div>
      </main>

      {/* Quick Log Modal */}
      {quickLogState.open && (
        <QuickLogModal
          batches={batches}
          feedLogs={feedLogs}
          mortalityLogs={mortalityLogs}
          initialBatchId={quickLogState.batchId}
          defaultType={quickLogState.type}
          profile={profile}
          onOpenBatchRegistration={() => setTodayBatchModalOpen(true)}
          onClose={() => setQuickLogState({ open: false })}
          onSaveFeed={handleAddFeed}
          onSaveMortality={handleAddMortality}
          onSaveClimate={handleAddClimate}
          onSaveHarvest={handleAddHarvest}
        />
      )}

      {/* Direct Batch Registration Modal from Today */}
      {todayBatchModalOpen && (
        <div className="modal-overlay" onClick={() => setTodayBatchModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Register Silkworm Rearing Batch
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Start a rearing lot to activate daily rations, microclimate calibration, and forage runway
                </p>
              </div>
              <button
                onClick={() => setTodayBatchModalOpen(false)}
                className="modal-close-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <BatchRegistrationForm
              isModal={true}
              existingBatches={batches}
              profile={profile}
              onSuccess={(newBatch) => {
                handleAddBatch(newBatch);
                setTodayBatchModalOpen(false);
                handleSelectTab('today');
              }}
              onCancel={() => setTodayBatchModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Direct Leaf Harvest Modal from Today */}
      <LeafStockModal
        isOpen={todayLeafModalOpen}
        profile={profile}
        onClose={() => setTodayLeafModalOpen(false)}
        onSave={handleAddLeafMovement}
      />

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
        onDelete={() => currentUser && setDeleteProfileTarget(currentUser)}
      />

      {/* Delete Profile Confirmation Dialog */}
      {deleteProfileTarget && (
        <DeleteProfileModal
          isOpen={deleteProfileTarget !== null}
          user={deleteProfileTarget}
          profile={deleteProfileTarget.id === currentUser?.id ? profile : null}
          allUsers={allUsers}
          onClose={() => setDeleteProfileTarget(null)}
          onConfirmDelete={(uid) => {
            handleDeleteUser(uid);
            setDeleteProfileTarget(null);
          }}
        />
      )}

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
