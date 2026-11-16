import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const AppLogoIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
    <path
      d="M7 8.5h10M7 12.5h7M7 16.5h5"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const DashboardIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const CourseIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M8 2.5L1.75 5.75 8 9l6.25-3.25L8 2.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M4 7.5v3.25c0 1.25 1.8 2.25 4 2.25s4-1 4-2.25V7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ExamIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 5.5h5M5.5 8.25h5M5.5 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ReportIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path d="M2.5 13.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="3.5" y="8" width="2" height="5.5" rx="0.5" fill="currentColor" />
    <rect x="7" y="5.5" width="2" height="8" rx="0.5" fill="currentColor" />
    <rect x="10.5" y="3" width="2" height="10.5" rx="0.5" fill="currentColor" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M4.5 3.25l8 4.75-8 4.75V3.25z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect x="4" y="3.25" width="2.75" height="9.5" rx="0.75" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9.25" y="3.25" width="2.75" height="9.5" rx="0.75" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M8 2l1.2 3.3L12.5 6.5 9.2 7.7 8 11 6.8 7.7 3.5 6.5l3.3-1.2L8 2z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M12.5 11v2.5M11.25 12.25h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const ListIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <circle cx="3" cy="4.25" r="1" fill="currentColor" />
    <circle cx="3" cy="8" r="1" fill="currentColor" />
    <circle cx="3" cy="11.75" r="1" fill="currentColor" />
    <path d="M5.75 4.25h7.75M5.75 8h7.75M5.75 11.75h7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const GridIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect x="2.25" y="2.25" width="4.5" height="4.5" rx="0.75" stroke="currentColor" strokeWidth="1.4" />
    <rect x="9.25" y="2.25" width="4.5" height="4.5" rx="0.75" stroke="currentColor" strokeWidth="1.4" />
    <rect x="2.25" y="9.25" width="4.5" height="4.5" rx="0.75" stroke="currentColor" strokeWidth="1.4" />
    <rect x="9.25" y="9.25" width="4.5" height="4.5" rx="0.75" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 7.25v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M5.25 8.15L7.1 10l3.7-3.8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CrossCircleIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M7.34 2.5a.76.76 0 011.32 0l5.45 9.54a.75.75 0 01-.66 1.12H2.55a.75.75 0 01-.66-1.12L7.34 2.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M8 6.1v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11.2" r="0.85" fill="currentColor" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 4.75V8l2.25 1.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FlagIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M3.25 14V2.75h8.25l-1.5 2.75 1.5 2.75H3.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M8 2.5v7.25m0 0L5.25 7M8 9.75L10.75 7M2.75 12.75h10.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M6.5 3.25h-2.5a1 1 0 00-1 1v7.75a1 1 0 001 1h7.75a1 1 0 001-1V9.5M9.5 2.75h3.75m0 0V6.5m0-3.75L7.5 8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M9.75 4L5.75 8l4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M6.25 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BookIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M3 3.25A1.25 1.25 0 014.25 2H13v11H4.25A1.25 1.25 0 013 11.75V3.25z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M5.75 2v11" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const VideoIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect
      x="1.75"
      y="3.25"
      width="12.5"
      height="9.5"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M6.75 6v4l3.5-2-3.5-2z" fill="currentColor" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M2.25 4.25a1 1 0 011-1h3.1l1.2 1.5h5.2a1 1 0 011 1v6a1 1 0 01-1 1h-9.5a1 1 0 01-1-1v-7.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);
