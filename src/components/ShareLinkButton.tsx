import React, { useEffect, useRef, useState } from 'react';
import { buildAbsoluteUrl, canUseNativeShare, copyUrlToClipboard } from '../utils/router';
import { CheckCircleIcon, LinkIcon, ShareIcon } from './Icons';

interface ShareLinkButtonProps {
  path: string;
  shareTitle?: string;
  shareText?: string;
  label?: string;
  copiedLabel?: string;
  compact?: boolean;
  showNativeShare?: boolean;
  className?: string;
}

export const ShareLinkButton: React.FC<ShareLinkButtonProps> = ({
  path,
  shareTitle = 'CPNS Learning Hub',
  shareText,
  label = 'Salin link',
  copiedLabel = 'Tautan disalin',
  compact = false,
  showNativeShare = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setCopied(false);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [path]);

  const markCopied = () => {
    setCopied(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, 2200);
  };

  const handleCopy = async () => {
    const ok = await copyUrlToClipboard(path);
    if (ok) {
      markCopied();
    }
  };

  const handleNativeShare = async () => {
    const url = buildAbsoluteUrl(path);
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText ?? shareTitle,
        url,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const ok = await copyUrlToClipboard(path);
      if (ok) {
        markCopied();
      }
    }
  };

  const nativeSupported = showNativeShare && canUseNativeShare();
  const baseBtnClass = compact ? 'btn btn-compact' : 'btn';

  return (
    <div className={`row-wrap ${className}`.trim()} style={{ gap: '6px' }}>
      <button
        type="button"
        className={`${baseBtnClass} ${copied ? 'btn-selected' : ''}`}
        onClick={() => {
          void handleCopy();
        }}
        aria-live="polite"
        title={`Salin tautan: ${path}`}
      >
        {copied ? <CheckCircleIcon size={14} /> : <LinkIcon size={14} />}
        <span>{copied ? copiedLabel : label}</span>
      </button>

      {nativeSupported && (
        <button
          type="button"
          className={baseBtnClass}
          onClick={() => {
            void handleNativeShare();
          }}
          aria-label={`Bagikan ${shareTitle}`}
        >
          <ShareIcon size={14} />
          <span>Bagikan</span>
        </button>
      )}
    </div>
  );
};
