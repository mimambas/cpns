import React, { useEffect, useRef, useState } from 'react';
import { buildAbsoluteUrl, copyUrlToClipboard } from '../utils/router';
import { CheckCircleIcon, ShareIcon } from './Icons';

interface ShareLinkButtonProps {
  path: string;
  shareTitle?: string;
  shareText?: string;
  label?: string;
  copiedLabel?: string;
  compact?: boolean;
  className?: string;
}

export const ShareLinkButton: React.FC<ShareLinkButtonProps> = ({
  path,
  shareTitle = 'CPNS Learning Hub',
  shareText,
  label = 'Share',
  copiedLabel = 'Link tersalin',
  compact = false,
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

  const handleShare = async () => {
    const url = buildAbsoluteUrl(path);
    const shareData: ShareData = {
      title: shareTitle,
      text: shareText ?? shareTitle,
      url,
    };

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      (!navigator.canShare || navigator.canShare(shareData))
    ) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    const ok = await copyUrlToClipboard(path);
    if (ok) {
      markCopied();
    }
  };

  return (
    <button
      type="button"
      className={`${compact ? 'btn btn-compact' : 'btn'} ${copied ? 'btn-selected' : ''} ${className}`.trim()}
      onClick={() => {
        void handleShare();
      }}
      aria-label={`Bagikan ${shareTitle}`}
      aria-live="polite"
      title={`Bagikan: ${path}`}
    >
      {copied ? <CheckCircleIcon size={14} /> : <ShareIcon size={14} />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
};
