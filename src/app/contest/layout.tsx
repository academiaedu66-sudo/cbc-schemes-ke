import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NATIONAL CONTEST (Grades 6, 7, 8 & 9) | CBCMaterials Kenya',
  description:
    'Register for the National Junior School & Grade 6 CBC Contest on cbcmaterials.shop! Win a Brand New Laptop, KSh 20,000 School Fee & New School Uniform. All subjects KSh 500 each.',
  keywords: [
    'National Contest Kenya',
    'CBC Contest Grade 6 7 8 9',
    'Junior School National Contest',
    'CBCMaterials Contest',
    'KJSEA KPSEA Contest Kenya',
  ],
  openGraph: {
    title: '🏆 NATIONAL CONTEST (Grades 6–9) — Win a Laptop & KSh 20,000!',
    description:
      'Open to Grade 6, 7, 8 & 9 learners across Kenya. All subjects KSh 500 each. 1st: Brand New Laptop + KSh 20,000 School Fee + Uniform. Register now on cbcmaterials.shop!',
    url: 'https://www.cbcmaterials.shop/contest',
    siteName: 'CBCMaterials Kenya',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🏆 NATIONAL CONTEST (Grades 6–9) | cbcmaterials.shop',
    description:
      'Win a Brand New Laptop, KSh 20,000 School Fee & School Uniform! Register for Grade 6, 7, 8 & 9 subject tests (KSh 500).',
  },
};

export default function ContestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
