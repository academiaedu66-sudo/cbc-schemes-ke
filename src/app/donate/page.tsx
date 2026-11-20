import React from 'react';
import type { Metadata } from 'next';
import DonatePageClient from './DonatePageClient';

export const metadata: Metadata = {
  title: 'Donate to Help Needy Learners ($1+) | CBCMATERIALS.SHOP',
  description:
    'International & local community education support fund helping weak, vulnerable, and poor learners in Kenya continue their education. Supports Direct Bank STK Push ($1+), Remitly, Sendwave, WorldRemit, PayPal & International Bank Transfer.',
  openGraph: {
    title: 'Donate to Help Weak & Needy Learners Continue Their Education ($1+)',
    description:
      'Support underprivileged Kenyan learners from $1 upward via Bank-Settling STK Push, Remitly, Sendwave, WorldRemit, PayPal, or International Bank Wire.',
    url: 'https://www.cbcmaterials.shop/donate',
    siteName: 'CBCMATERIALS.SHOP',
  },
};

export default function DonatePage() {
  return <DonatePageClient />;
}
