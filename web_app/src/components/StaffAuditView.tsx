import React, { useState, useMemo } from 'react';
import {
  AuditLogEntry,
  Batch,
  FarmProfile,
  UserAccount,
} from '../types';
import { USER_ROLES } from '../constants';
import {
  Download,
  Filter,
  Search,
  Calendar,
  User,
  Clock,
  Leaf,
  Thermometer,
  AlertTriangle,
  Package,
  ShieldCheck,
  CheckCircle2,
  FileText,
  RotateCw,
  Plus,
  Send,
  Building2,
} from 'lucide-react';

interface StaffAuditViewProps {
  auditLogs: AuditLogEntry[];
  batches: Batch[];
  allUsers: UserAccount[];
  currentUser: UserAccount | null;
  profile: FarmProfile | null;
  onExportPdf: () => void;
  onExportCsv: () => void;
  onAddAuditLog: (entry: AuditLogEntry) => void;
}

export const StaffAuditView: React.FC<StaffAuditViewProps> = ({
  auditLogs,
  batches,
  allUsers,
  currentUser,
  profile,
  onExportPdf,
  onExportCsv,
  onAddAuditLog,
}) => {
  // Filter states
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Shift handover quick-note modal/drawer state
  const [showHandoverModal, setShowHandoverModal] = useState<boolean>(false);
  const [handoverNote, setHandoverNote] = useState<string>('');
  const [handoverShift, setHandoverShift] = useState<'morning' | 'midday' | 'evening' | 'night'>('midday');

  // Filtered logs calculation
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];

    return auditLogs.filter((log) => {
      // 1. Staff filter
      if (selectedStaffId !== 'all') {
        const matchesId = log.operatorId === selectedStaffId;
        const matchesName = allUsers.find((u) => u.id === selectedStaffId)?.username === log.operatorName;
        if (!matchesId && !matchesName) return false;
      }

      // 2. Batch filter
      if (selectedBatchId !== 'all') {
        const batch = batches.find((b) => b.id === selectedBatchId);
        const matchesBatchId = log.batchId === selectedBatchId;
        const matchesBatchTag = batch && (log.batchTag?.includes(batch.batchTag || '') || log.batchTag?.includes(batch.id));
        if (!matchesBatchId && !matchesBatchTag) return false;
      }

      // 3. Action type filter
      if (selectedAction !== 'all' && log.actionType !== selectedAction) {
        return false;
      }

      // 4. Date filter
      const logDate = log.timestamp.split('T')[0];
      if (dateRange === 'today' && logDate !== todayStr) return false;
      if (dateRange === '7days' && logDate < sevenDaysAgo) return false;
      if (dateRange === '30days' && logDate < thirtyDaysAgo) return false;

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${log.operatorName} ${log.operatorRole} ${log.title} ${log.details} ${log.batchTag || ''} ${log.roomName || ''} ${log.metrics || ''}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [auditLogs, selectedStaffId, selectedBatchId, selectedAction, dateRange, searchQuery, allUsers, batches]);

  // Summary Metrics
  const totalOperations = auditLogs.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOperationsCount = auditLogs.filter((l) => l.timestamp.startsWith(todayStr)).length;
  const feedOpsCount = auditLogs.filter((l) => l.actionType === 'feed_log').length;
  const climateOpsCount = auditLogs.filter((l) => l.actionType === 'climate_check').length;

  const handleSaveHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNote.trim()) return;

    const op = currentUser || allUsers[0];
    const roleMeta = USER_ROLES.find((r) => r.value === op?.role) || USER_ROLES[0];

    const newLog: AuditLogEntry = {
      id: `audit-handover-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorId: op?.id || 'staff-gen',
      operatorName: op?.username || 'Staff Operator',
      operatorRole: roleMeta.label,
      actionType: 'shift_handover',
      title: `${handoverShift.toUpperCase()} Shift Handover & Inspection`,
      details: handoverNote.trim(),
      metrics: `${handoverShift} Shift`,
    };

    onAddAuditLog(newLog);
    setHandoverNote('');
    setShowHandoverModal(false);
  };

  const getActionBadge = (actionType: AuditLogEntry['actionType']) => {
    switch (actionType) {
      case 'feed_log':
        return { label: 'Feeding', bg: 'var(--primary-subtle)', color: 'var(--primary)', icon: Leaf };
      case 'climate_check':
        return { label: 'Climate', bg: '#EBF4FF', color: '#1E40AF', icon: Thermometer };
      case 'mortality_log':
        return { label: 'Bed Inspection', bg: '#FEF3C7', color: '#92400E', icon: AlertTriangle };
      case 'cocoon_harvest':
        return { label: 'Harvest', bg: '#FEE2E2', color: '#991B1B', icon: Package };
      case 'leaf_inflow':
        return { label: 'Leaf Harvest', bg: '#ECFDF5', color: '#065F46', icon: Leaf };
      case 'leaf_outflow':
        return { label: 'Stock Deduct', bg: '#F3F4F6', color: '#374151', icon: Leaf };
      case 'batch_created':
        return { label: 'Batch Init', bg: '#EDE9FE', color: '#5B21B6', icon: Plus };
      case 'batch_updated':
        return { label: 'Batch Update', bg: '#F5F3FF', color: '#6D28D9', icon: RotateCw };
      case 'shift_handover':
        return { label: 'Shift Handover', bg: '#FEF9C3', color: '#854D0E', icon: ShieldCheck };
      default:
        return { label: 'Operation', bg: 'var(--bg-subtle)', color: 'var(--text-main)', icon: CheckCircle2 };
    }
  };

  return (
    <div className="staff-audit-container" style={{ padding: '0 0 2rem 0' }}>
      {/* 1. Header & Institutional Badge */}
      <div
        className="kalro-card"
        style={{
          padding: '1.25rem',
          marginBottom: '1rem',
          backgroundColor: '#ffffff',
          borderLeft: '4px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Staff Operations & Shift Audit Ledger
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, maxWidth: '640px' }}>
              Complete, tamper-evident institutional record of who made what changes, at what day, and at what time across all concurrent station rearing batches at {profile?.orgName || 'KALRO NSRC Thika'}.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowHandoverModal(true)}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Record a shift handover or rearing room inspection note"
            >
              <Plus size={14} />
              <span>Shift Handover Note</span>
            </button>
            <button
              onClick={onExportCsv}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download audit records as CSV spreadsheet"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onExportPdf}
              className="btn-accent"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Generate formal KALRO Sericulture Staff Duty PDF Report"
            >
              <FileText size={14} />
              <span>Generate Audit PDF</span>
            </button>
          </div>
        </div>

        {/* Current Active Supervisor Bar */}
        <div
          style={{
            marginTop: '1rem',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: currentUser?.avatarColor || 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            >
              {currentUser?.avatarInitials || 'JN'}
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                Active Operator on Duty: {currentUser?.username || 'Station Operator'}
              </span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                ({allUsers.find((u) => u.id === currentUser?.id)?.role.replace('_', ' ') || 'Rearing Specialist'})
              </span>
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span>Roster: <strong>{allUsers.length} Specialists</strong></span>
            <span>Concurrent Batches: <strong>{batches.filter((b) => b.status === 'active').length} Active</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="kalro-card" style={{ padding: '0.9rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Audit Records
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0' }}>
            {totalOperations}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {todayOperationsCount} actions recorded today
          </div>
        </div>

        <div className="kalro-card" style={{ padding: '0.9rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Feeding Operations
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', margin: '2px 0' }}>
            {feedOpsCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Auto-deducted forage logs
          </div>
        </div>

        <div className="kalro-card" style={{ padding: '0.9rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Microclimate Checks
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E40AF', margin: '2px 0' }}>
            {climateOpsCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Temperature & RH audits
          </div>
        </div>

        <div className="kalro-card" style={{ padding: '0.9rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Rotating Staff
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#B45309', margin: '2px 0' }}>
            {allUsers.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Shared batch supervision
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div
        className="kalro-card"
        style={{ padding: '0.85rem 1rem', marginBottom: '1rem', backgroundColor: '#ffffff' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {/* Staff Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Staff Member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8rem', padding: '6px 8px' }}
            >
              <option value="all">All Sericulture Staff ({allUsers.length})</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Rearing Lot / Chamber
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8rem', padding: '6px 8px' }}
            >
              <option value="all">All Lots & Facilities</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayTag || b.batchTag || b.id} {b.roomName ? `(${b.roomName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Operation Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8rem', padding: '6px 8px' }}
            >
              <option value="all">All Operations</option>
              <option value="feed_log">Feeding & Rationing</option>
              <option value="climate_check">Microclimate Checks</option>
              <option value="mortality_log">Bed Loss & Sanitization</option>
              <option value="leaf_inflow">Mulberry Leaf Harvests</option>
              <option value="cocoon_harvest">Cocoon Harvests</option>
              <option value="shift_handover">Shift Handovers</option>
              <option value="batch_created">New Batch Registrations</option>
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Reporting Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="form-control"
              style={{ fontSize: '0.8rem', padding: '6px 8px' }}
            >
              <option value="all">Complete History</option>
              <option value="today">Today's Operations Only</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* Live Search Bar */}
        <div style={{ marginTop: '0.75rem', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit records by staff name, batch, rearing house, or keywords..."
            className="form-control"
            style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '6px',
                background: 'none',
                border: 'none',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. Chronological Operations Audit Ledger */}
      <div className="kalro-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border-divider)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Operations Ledger ({filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'})
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Ordered Chronologically (Latest First)
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              No audit records match the selected filters
            </div>
            <div style={{ fontSize: '0.8rem' }}>
              Adjust staff member, batch, or date range, or clear your search term.
            </div>
          </div>
        ) : (
          <div className="audit-ledger-list">
            {filteredLogs.map((entry) => {
              const badge = getActionBadge(entry.actionType);
              const BadgeIcon = badge.icon;
              const dateObj = new Date(entry.timestamp);
              const formattedDate = dateObj.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              // Staff details
              const staffUser = allUsers.find(
                (u) => u.id === entry.operatorId || u.username === entry.operatorName
              );
              const staffColor = staffUser?.avatarColor || '#143D2B';
              const staffInitials = staffUser?.avatarInitials || entry.operatorName.slice(0, 2).toUpperCase();

              return (
                <div
                  key={entry.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid var(--border-divider)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="audit-row"
                >
                  {/* Timestamp Box */}
                  <div
                    style={{
                      minWidth: '82px',
                      flexShrink: 0,
                      textAlign: 'left',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{formattedDate}</div>
                    <div className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <Clock size={11} />
                      {formattedTime}
                    </div>
                  </div>

                  {/* Staff Avatar */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: staffColor,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      flexShrink: 0,
                    }}
                    title={`Logged by: ${entry.operatorName} (${entry.operatorRole})`}
                  >
                    {staffInitials}
                  </div>

                  {/* Operation Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {entry.operatorName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-divider)',
                        }}
                      >
                        {entry.operatorRole.replace('_', ' ')}
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '12px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                        }}
                      >
                        <BadgeIcon size={10} />
                        {badge.label}
                      </span>

                      {entry.batchTag && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            backgroundColor: 'var(--primary-subtle)',
                            padding: '1px 6px',
                            borderRadius: '3px',
                          }}
                        >
                          {entry.batchTag}
                        </span>
                      )}

                      {entry.roomName && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Building2 size={11} />
                          {entry.roomName}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                      {entry.details}
                    </div>
                  </div>

                  {/* Measurement Metric Pill */}
                  {entry.metrics && (
                    <div
                      style={{
                        flexShrink: 0,
                        alignSelf: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-card)',
                      }}
                      className="tabular-nums"
                    >
                      {entry.metrics}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Shift Handover & Note Modal */}
      {showHandoverModal && (
        <div className="modal-overlay" onClick={() => setShowHandoverModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Log Shift Handover & Inspection Note
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Document rearing tray condition, room adjustments, or shift handovers.
                </p>
              </div>
              <button onClick={() => setShowHandoverModal(false)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHandover}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Shift Handover Period</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['morning', 'midday', 'evening', 'night'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setHandoverShift(s)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-card)',
                          backgroundColor: handoverShift === s ? 'var(--primary)' : 'var(--bg-subtle)',
                          color: handoverShift === s ? '#ffffff' : 'var(--text-main)',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Handover Observations & Task Notes *</label>
                  <textarea
                    rows={4}
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Midday shift handover from Peter to Mary: Bed 1 and 2 fed 18kg TR-10 shoots. Cross draft louvers opened due to 26°C peak temperature. All 4 batches in good health."
                    required
                  />
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Recorded by: <strong>{currentUser?.username || 'Station Operator'}</strong> • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowHandoverModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} />
                  <span>Save to Station Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
