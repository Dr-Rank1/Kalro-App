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
  UserAccount,
  UserRole,
} from './types';
import { KENYA_COUNTIES, USER_ROLES } from './constants';

export function App() {
  // Initialize storage defaults and run any migrations
  storage.initDefaults();

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => storage.getActiveUser());
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
  const [profile, setProfile] = useState<FarmProfile>(() => storage.getProfile());
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
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);

  // New User Form State (Header quick register)
  const [newUserData, setNewUserData] = useState({
    username: '',
    role: 'commercial_reeler' as UserRole,
    stationName: '',
    county: 'Kiambu',
    phone: '',
    email: '',
    pinCode: '',
  });

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
    setCurrentUser(storage.getActiveUser());
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
    const roleMeta = USER_ROLES.find((r) => r.value === active.role);
    showToast(`Switched account to ${active.username} (${roleMeta?.label || active.role}).`);
  };

  // Create New Farmer Profile
  const handleCreateUser = (data: {
    username: string;
    role: UserRole;
    stationName: string;
    county: string;
    phone?: string;
    email?: string;
    pinCode?: string;
  }) => {
    const newUser = storage.createUserProfile(data);
    reloadAll();
    showToast(`Profile "${newUser.username}" registered. Switched to new account.`);
  };

  // Delete Farmer Profile
  const handleDeleteUser = (userId: string): boolean => {
    const success = storage.deleteUserProfile(userId);
    if (success) {
      reloadAll();
      showToast('Farmer profile and all isolated records permanently deleted.');
    } else {
      showToast('Cannot delete the only registered farmer account.');
    }
    return success;
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

  const handleUpdateProfile = (p: FarmProfile) => {
    storage.saveProfile(p);
    reloadAll();
    showToast('Farm profile updated successfully.');
  };

  // CSV Export for Active Tenant
  const handleExportCsv = () => {
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
    showToast('Full multi-tenant database export downloaded.');
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
    storage.clearActiveUserRecords();
    reloadAll();
    showToast(`All records for active farmer "${currentUser.username}" purged.`);
  };

  const activeBatchesCount = batches.filter((b) => b.status === 'active').length;

  return (
    <div className="app-container">
      {/* Header with Multi-Tenant Account Switcher */}
      <Header
        profile={profile}
        currentUser={currentUser}
        allUsers={allUsers}
        activeBatchesCount={activeBatchesCount}
        onOpenReportModal={() => setReportModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        onOpenNewUserModal={() => setNewUserModalOpen(true)}
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
            onExportBackup={handleExportActiveUserBackup}
            onOpenReportModal={() => setReportModalOpen(true)}
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
            onUpdateProfile={handleUpdateProfile}
            onSwitchUser={handleSwitchUser}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            onExportActiveUserBackup={handleExportActiveUserBackup}
            onExportFullDatabaseBackup={handleExportFullDatabaseBackup}
            onImportBackup={handleImportBackup}
            onClearActiveUserRecords={handleClearActiveUserRecords}
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

      {/* Register New Farmer Modal from Header */}
      {newUserModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Register New Farmer Profile</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Creates an independent, isolated local database partition.
                </p>
              </div>
              <button onClick={() => setNewUserModalOpen(false)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUserData.username.trim() || !newUserData.stationName.trim()) return;
                handleCreateUser({
                  username: newUserData.username.trim(),
                  role: newUserData.role,
                  stationName: newUserData.stationName.trim(),
                  county: newUserData.county,
                  phone: newUserData.phone.trim(),
                  email: newUserData.email.trim(),
                  pinCode: newUserData.pinCode.trim() || undefined,
                });
                setNewUserModalOpen(false);
                setNewUserData({
                  username: '',
                  role: 'commercial_reeler',
                  stationName: '',
                  county: 'Kiambu',
                  phone: '',
                  email: '',
                  pinCode: '',
                });
              }}
            >
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Farmer / Operator Full Name *</label>
                  <input
                    type="text"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Mary Muthoni"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sericulture Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="form-control"
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Farm / Station Enterprise Name *</label>
                  <input
                    type="text"
                    value={newUserData.stationName}
                    onChange={(e) => setNewUserData({ ...newUserData, stationName: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Muthoni Sericulture Farm"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">County</label>
                    <select
                      value={newUserData.county}
                      onChange={(e) => setNewUserData({ ...newUserData, county: e.target.value })}
                      className="form-control"
                    >
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Contact</label>
                    <input
                      type="text"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                      className="form-control"
                      placeholder="+254 7..."
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email (Optional)</label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="form-control"
                      placeholder="mary@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Security PIN (Optional)</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newUserData.pinCode}
                      onChange={(e) => setNewUserData({ ...newUserData, pinCode: e.target.value })}
                      className="form-control"
                      placeholder="4-digit PIN"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Create Farmer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
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
