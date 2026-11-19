import React from 'react';
import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  buildDailyButtonStatusAd,
  CONNECTED_WHATSAPP_STATUS_LOCAL,
  WEBSITE_BUTTONS_FOR_DAILY_STATUS,
} from '@/lib/whatsapp-status-autoposter';
import StatusAdClient from './StatusAdClient';

type Props = {
  params: Promise<{ buttonId: string }>;
};

async function getCachedStatusAdForButton(buttonId: string) {
  'use cache';
  cacheLife('hours');
  const spec = WEBSITE_BUTTONS_FOR_DAILY_STATUS.find(
    (b) => b.buttonId === buttonId
  );
  if (!spec) return null;
  return buildDailyButtonStatusAd(spec, new Date());
}

export function generateStaticParams() {
  return WEBSITE_BUTTONS_FOR_DAILY_STATUS.map((b) => ({
    buttonId: b.buttonId,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { buttonId } = await params;
  const ad =
    (await getCachedStatusAdForButton(buttonId)) ||
    (await getCachedStatusAdForButton(WEBSITE_BUTTONS_FOR_DAILY_STATUS[0].buttonId))!;

  return {
    title: `${ad.buttonLabel} — CBC Kenya Resource Hub`,
    description: `${ad.headline} ${ad.subheadline}`,
    openGraph: {
      title: `${ad.buttonLabel} (${ad.priceBadge})`,
      description: ad.headline,
      url: ad.musicalStoryUrl,
      siteName: 'CBC Kenya Resource Hub',
      images: [
        {
          url: ad.posterCardUrl,
          width: 1200,
          height: 630,
          alt: ad.buttonLabel,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${ad.buttonLabel} (${ad.priceBadge})`,
      description: ad.headline,
      images: [ad.posterCardUrl],
    },
  };
}

export default async function StatusAdPage({ params }: Props) {
  const { buttonId } = await params;
  const ad = await getCachedStatusAdForButton(buttonId);
  if (!ad) {
    redirect('/');
  }

  return (
    <StatusAdClient
      buttonLabel={ad.buttonLabel}
      headline={ad.headline}
      subheadline={ad.subheadline}
      priceBadge={ad.priceBadge}
      posterImageUrl={ad.posterImageUrl}
      clickableUrl={ad.clickableUrl}
      softSongUrl={ad.softSongUrl}
      whatsappLocal={CONNECTED_WHATSAPP_STATUS_LOCAL}
    />
  );
}
