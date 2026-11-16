import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'CBC Admin Mobile | Transactions & Tracking',
  description:
    'Simple Mobile Admin App for M-Pesa transaction verification, approvals, and live tracking.',
  manifest: '/mobile-admin/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CBC Admin',
  },
  icons: {
    icon: '/admin-icon.svg',
    apple: '/admin-icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#064e3b',
};

export default function MobileAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
