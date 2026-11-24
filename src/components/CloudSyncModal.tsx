import React, { useEffect, useState } from 'react';
import type { CloudProfile, CloudSyncStatus } from '../types';
import { formatDateTimeId } from '../utils/scoring';
import { normalizeSyncCode } from '../utils/cloudSync';
import { CheckCircleIcon, CloudIcon, CopyIcon, InfoIcon } from './Icons';

interface CloudSyncModalProps {
  open: boolean;
  profile: CloudProfile;
  syncStatus: CloudSyncStatus;
  onClose: () => void;
  onSaveDisplayName: (nextName: string) => Promise<boolean>;
  onManualSync: () => Promise<boolean>;
  onLinkSyncCode: (nextCode: string) => Promise<{ ok: boolean; error?: string }>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  open,
  profile,
  syncStatus,
  onClose,
  onSaveDisplayName,
  onManualSync,
  onLinkSyncCode,
}) => {
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [nameSaved, setNameSaved] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [busyAction, setBusyAction] = useState<'none' | 'save' | 'sync' | 'link'>('none');

  useEffect(() => {
    if (!open) return;
    setNameInput(profile.displayName);
    setNameSaved(false);
    setCodeCopied(false);
    setLinkError(null);
    setLinkSuccess(false);
    // Only reset modal form feedback when opening the modal (not when profile.displayName saves)
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const statusBadgeClass =
    syncStatus === 'synced'
      ? 'lozenge-success'
      : syncStatus === 'syncing'
        ? 'lozenge-info'
        : 'lozenge-warning';

  const statusLabel =
    syncStatus === 'synced'
      ? 'Tersinkron ke Cloud'
      : syncStatus === 'syncing'
        ? 'Menyinkronkan...'
        : syncStatus === 'offline'
          ? 'Mode lokal / offline'
          : 'Menunggu sinkronisasi';

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(profile.syncCode);
      } else {
        const el = document.createElement('textarea');
        el.value = profile.syncCode;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      return;
    }
    setBusyAction('save');
    setNameSaved(false);
    const ok = await onSaveDisplayName(trimmed);
    setBusyAction('none');
    if (ok) {
      setNameSaved(true);
      window.setTimeout(() => setNameSaved(false), 2200);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setLinkSuccess(false);
    const normalized = normalizeSyncCode(linkInput);
    if (!normalized) {
      setLinkError('Format kode tidak valid. Contoh: SKD-ABCD-2345-WXYZ.');
      return;
    }
    if (normalized === profile.syncCode) {
      setLinkError('Kode ini sudah aktif di perangkat ini.');
      return;
    }
    setBusyAction('link');
    const result = await onLinkSyncCode(normalized);
    setBusyAction('none');
    if (result.ok) {
      setLinkInput('');
      setLinkSuccess(true);
    } else {
      setLinkError(result.error ?? 'Gagal menyinkronkan kode perangkat.');
    }
  };

  return (
    <div
      className="modal-blanket"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-sync-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog modal-dialog-scroll">
        <div className="modal-header row-wrap" style={{ justifyContent: 'space-between' }}>
          <div className="row-wrap" style={{ gap: '8px' }}>
            <CloudIcon size={18} />
            <h2 id="cloud-sync-modal-title" className="h-medium">
              Sinkronisasi Cloud &amp; Profil Peserta
            </h2>
          </div>
          <button type="button" className="btn btn-compact" onClick={onClose}>
            Tutup
          </button>
        </div>

        <div className="modal-body stack-300" style={{ paddingBottom: '24px' }}>
          {/* Status Row */}
          <div className="well-sunken row-wrap" style={{ justifyContent: 'space-between' }}>
            <div className="stack-200" style={{ gap: '4px' }}>
              <div className="row-wrap" style={{ gap: '8px' }}>
                <span className={`lozenge ${statusBadgeClass}`}>{statusLabel}</span>
              </div>
              <span className="body-small">
                {profile.lastSyncedAt
                  ? `Terakhir tersinkron: ${formatDateTimeId(profile.lastSyncedAt)}`
                  : 'Data disimpan di browser dan disinkronkan ke Cloudflare D1.'}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-compact"
              disabled={busyAction !== 'none' || syncStatus === 'syncing'}
              onClick={async () => {
                setBusyAction('sync');
                await onManualSync();
                setBusyAction('none');
              }}
            >
              {busyAction === 'sync' || syncStatus === 'syncing'
                ? 'Menyinkronkan...'
                : 'Sinkronkan sekarang'}
            </button>
          </div>

          {/* Display Name Form */}
          <form className="stack-200" style={{ gap: '10px' }} onSubmit={handleSaveName}>
            <label htmlFor="cloud-display-name-input" className="form-label">
              Nama peserta (tampil di papan peringkat)
            </label>
            <div className="row-wrap" style={{ gap: '8px' }}>
              <input
                id="cloud-display-name-input"
                type="text"
                className="text-input"
                style={{ flex: 1, minWidth: '180px' }}
                minLength={2}
                maxLength={32}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Nama tampilan Anda (maks 32 karakter)"
              />
              <button
                type="submit"
                className={`btn ${nameSaved ? 'btn-selected' : 'btn-primary'}`}
                disabled={busyAction !== 'none' || nameInput.trim().length < 2}
              >
                {nameSaved ? (
                  <>
                    <CheckCircleIcon size={14} />
                    Nama disimpan
                  </>
                ) : busyAction === 'save' ? (
                  'Menyimpan...'
                ) : (
                  'Simpan nama'
                )}
              </button>
            </div>
          </form>

          {/* Device Sync Code Box */}
          <div className="well-sunken stack-200" style={{ gap: '10px' }}>
            <div className="h-xsmall">Kode sinkronisasi perangkat ini</div>
            <p className="body-small">
              Simpan atau salin kode ini untuk menghubungkan progres belajar, sesi jeda, dan riwayat nilai dari HP ke laptop tanpa membuat password.
            </p>
            <div className="row-wrap" style={{ justifyContent: 'space-between', gap: '8px' }}>
              <code className="sync-code-box mono">{profile.syncCode}</code>
              <button
                type="button"
                className={`btn ${codeCopied ? 'btn-selected' : ''}`}
                onClick={() => {
                  void handleCopyCode();
                }}
              >
                {codeCopied ? <CheckCircleIcon size={14} /> : <CopyIcon size={14} />}
                <span>{codeCopied ? 'Kode tersalin' : 'Salin kode'}</span>
              </button>
            </div>
          </div>

          {/* Link Existing Sync Code Form */}
          <form className="stack-200" style={{ gap: '10px' }} onSubmit={handleLinkSubmit}>
            <label htmlFor="cloud-link-code-input" className="form-label">
              Hubungkan dari HP atau laptop lain
            </label>
            <div className="row-wrap" style={{ gap: '8px' }}>
              <input
                id="cloud-link-code-input"
                type="text"
                className="text-input mono"
                style={{ flex: 1, minWidth: '180px' }}
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Tempel kode SKD-XXXX-XXXX-XXXX"
              />
              <button
                type="submit"
                className="btn"
                disabled={busyAction !== 'none' || linkInput.trim().length === 0}
              >
                {busyAction === 'link' ? 'Menghubungkan...' : 'Hubungkan perangkat'}
              </button>
            </div>
            {linkError && (
              <span className="body-small" style={{ color: 'var(--danger-text)' }}>
                {linkError}
              </span>
            )}
            {linkSuccess && (
              <div className="section-message section-message-info">
                <span className="section-message-icon">
                  <InfoIcon size={16} />
                </span>
                <div className="section-message-content">
                  <p className="section-message-body">
                    Perangkat berhasil terhubung. Progres modul dan riwayat simulasi telah digabungkan.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
