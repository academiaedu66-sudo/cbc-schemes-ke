'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Briefcase,
  ClipboardList,
  DollarSign,
  ExternalLink,
  Globe,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { AdSlot, useMonetization } from '@/components/MonetizationEngine';

interface HustlePlatform {
  id: string;
  name: string;
  category: 'AI_TRAINING' | 'SURVEY';
  badge: string;
  description: string;
  primaryUrl: string;
  directCompanyUrl?: string;
  payoutInfo: string;
}

// Complete directory of ALL 44 companies on https://www.aitrainingjobs.it/ai-training-jobs-by-company/
// plus core AITrainingJobs.it boards & top AI platforms
const AI_TRAINING_COMPANIES: HustlePlatform[] = [
  {
    id: 'aitj-directory',
    name: 'AITrainingJobs.it — Master Company Directory',
    category: 'AI_TRAINING',
    badge: 'OFFICIAL DIRECTORY',
    description:
      'Live daily-updated feed of the latest 30 remote AI training & data annotation roles per company across coding, math, science, languages & generalist tasks.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/',
    directCompanyUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-africa/',
    payoutInfo: 'Global & Africa Remote Roles',
  },
  {
    id: 'invisible-technologies',
    name: 'Invisible Technologies',
    category: 'AI_TRAINING',
    badge: '520+ ROLES',
    description:
      'AI trainer, multilingual specialist, STEM evaluator, and operations roles training frontier language models.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/invisible-technologies/',
    directCompanyUrl: 'https://www.invisible.co/',
    payoutInfo: 'USD Hourly (Payoneer / Wise / Bank)',
  },
  {
    id: 'micro1',
    name: 'Micro1',
    category: 'AI_TRAINING',
    badge: '440+ ROLES',
    description:
      'AI-vetted remote talent network hiring teachers, subject experts (Math, Physics, Chemistry, Humanities), and software engineers for RLHF data labeling.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/micro1/',
    directCompanyUrl: 'https://www.micro1.ai/',
    payoutInfo: 'USD Hourly Contractor Payouts',
  },
  {
    id: 'mercor',
    name: 'Mercor',
    category: 'AI_TRAINING',
    badge: '370+ ROLES',
    description:
      'High-paying AI model training contracts for educators, writers, STEM specialists, finance/law graduates, and generalist rubric evaluators.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/mercor/',
    directCompanyUrl: 'https://mercor.com/',
    payoutInfo: '$15–$80+/hr USD via Stripe/Wise',
  },
  {
    id: 'welocalize',
    name: 'Welocalize',
    category: 'AI_TRAINING',
    badge: '345+ ROLES',
    description:
      'Search quality rating, ad evaluation, Swahili/English translation, and AI data annotation projects worldwide.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/welocalize/',
    directCompanyUrl: 'https://jobs.welocalize.com/',
    payoutInfo: 'Hyperwallet / PayPal / Bank',
  },
  {
    id: 'sme-careers',
    name: 'SME Careers',
    category: 'AI_TRAINING',
    badge: '270+ ROLES',
    description:
      'Subject Matter Expert (SME) remote contracts evaluating AI reasoning across K-12/college subjects, sciences, humanities, and coding.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/sme-careers/',
    payoutInfo: 'USD Subject Expert Contracts',
  },
  {
    id: 'handshake-ai',
    name: 'Handshake AI',
    category: 'AI_TRAINING',
    badge: '260+ ROLES',
    description:
      'AI fellowship and model training programs for university students, graduates, and subject-domain specialists.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/handshake-ai/',
    directCompanyUrl: 'https://joinhandshake.com/move-program/',
    payoutInfo: 'USD Weekly Payouts',
  },
  {
    id: 'turing',
    name: 'Turing',
    category: 'AI_TRAINING',
    badge: '230+ ROLES',
    description:
      'Remote LLM trainer roles for Python/JS developers, math/science reasoning experts, and analytical problem solvers.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/turing/',
    directCompanyUrl: 'https://www.turing.com/jobs',
    payoutInfo: 'USD Direct Bank / Payoneer',
  },
  {
    id: 'anyone-ai',
    name: 'Anyone AI',
    category: 'AI_TRAINING',
    badge: '209+ ROLES',
    description:
      'Remote AI training, machine learning engineering, and LLM evaluation roles across global regions.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/anyone-ai/',
    directCompanyUrl: 'https://www.anyoneai.com/',
    payoutInfo: 'USD Remote Contracts',
  },
  {
    id: 'afterquery',
    name: 'AfterQuery',
    category: 'AI_TRAINING',
    badge: '206+ ROLES',
    description:
      'AI research lab contracting domain specialists (STEM, coding, quantitative reasoning, writing) to craft high-difficulty AI benchmarks.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/afterquery/',
    directCompanyUrl: 'https://www.afterquery.com/',
    payoutInfo: 'USD Task & Hourly Pay',
  },
  {
    id: 'rws-trainai',
    name: 'RWS (TrainAI Community)',
    category: 'AI_TRAINING',
    badge: '119+ ROLES',
    description:
      'Flexible online data collection, search rating, audio transcription, and linguistic AI evaluation tasks.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/rws/',
    directCompanyUrl:
      'https://www.rws.com/artificial-intelligence/train-ai-data-services/trainai-community/',
    payoutInfo: 'PayPal / Bank Transfer',
  },
  {
    id: 'ethos',
    name: 'Ethos',
    category: 'AI_TRAINING',
    badge: '114+ ROLES',
    description:
      'Expert AI alignment, red-teaming, and rubric-based response grading across academic and professional disciplines.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/ethos/',
    payoutInfo: 'USD Contractor Pay',
  },
  {
    id: 'languageline',
    name: 'LanguageLine Solutions',
    category: 'AI_TRAINING',
    badge: '103+ ROLES',
    description:
      'Remote interpretation, translation, and bilingual language evaluation roles (including African & global languages).',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/languageline-solutions/',
    directCompanyUrl: 'https://www.languageline.com/careers',
    payoutInfo: 'Bi-weekly/Monthly USD',
  },
  {
    id: 'keywords-studios',
    name: 'Keywords Studios',
    category: 'AI_TRAINING',
    badge: '53+ ROLES',
    description:
      'Game localization, player support, audio testing, and AI content moderation/evaluation roles.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/keywords-studios/',
    directCompanyUrl: 'https://www.keywordsstudios.com/en/careers/',
    payoutInfo: 'Global Freelance Contracts',
  },
  {
    id: 'cactus',
    name: 'CACTUS Communications',
    category: 'AI_TRAINING',
    badge: '52+ ROLES',
    description:
      'Academic editing, scientific review, and AI scholarly training roles — ideal for teachers and postgraduate researchers.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/cactus-communications/',
    directCompanyUrl: 'https://www.cactusglobal.com/careers/',
    payoutInfo: 'USD Wire / Payoneer',
  },
  {
    id: 'transperfect',
    name: 'TransPerfect (DataForce)',
    category: 'AI_TRAINING',
    badge: '50+ ROLES',
    description:
      'AI speech/image collection, translation, transcription, and data annotation projects via TransPerfect DataForce.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/transperfect/',
    directCompanyUrl: 'https://dataforce.transperfect.com/',
    payoutInfo: 'PayPal / Payoneer / Wire',
  },
  {
    id: 'lifted-upwork',
    name: 'Lifted (Upwork AI Projects)',
    category: 'AI_TRAINING',
    badge: '37+ ROLES',
    description:
      'Enterprise AI training, prompt engineering, and educational content evaluation contracts managed through Upwork/Lifted.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/lifted-upwork/',
    directCompanyUrl: 'https://www.upwork.com/',
    payoutInfo: 'Direct to M-Pesa / PayPal / Bank',
  },
  {
    id: 'propio',
    name: 'Propio Language Services',
    category: 'AI_TRAINING',
    badge: '28+ ROLES',
    description:
      'Remote contract interpreters and bilingual language evaluators (Swahili, Somali, French, Arabic & more).',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/propio-language-services/',
    directCompanyUrl: 'https://propio-ls.com/careers/',
    payoutInfo: 'USD Per-Minute / Hourly',
  },
  {
    id: 'sovrano-ai',
    name: 'Sovrano AI',
    category: 'AI_TRAINING',
    badge: '19+ ROLES',
    description:
      'Multilingual AI evaluation, prompt writing, and domain-specific dataset curation roles.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/sovrano-ai/',
    payoutInfo: 'USD Remote Contracts',
  },
  {
    id: 'sigma-ai',
    name: 'Sigma AI',
    category: 'AI_TRAINING',
    badge: '19+ ROLES',
    description:
      'Data collection, audio transcription, text annotation, and AI training projects for multilingual contributors.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/sigma-ai/',
    directCompanyUrl: 'https://sigma.ai/join-our-team/',
    payoutInfo: 'PayPal / Payoneer',
  },
  {
    id: 'xai',
    name: 'xAI (AI Tutors)',
    category: 'AI_TRAINING',
    badge: '19+ ROLES',
    description:
      'Full-time & contract AI Tutor roles training Grok models with high-quality human reasoning, STEM & writing feedback.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/xai/',
    directCompanyUrl: 'https://x.ai/careers',
    payoutInfo: 'Competitive USD Hourly',
  },
  {
    id: 'workada',
    name: 'Workada',
    category: 'AI_TRAINING',
    badge: '18+ ROLES',
    description:
      'Remote AI data labeling, quality assurance, and specialist model feedback roles.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/workada/',
    payoutInfo: 'USD Remote Pay',
  },
  {
    id: 'scale-outlier',
    name: 'Scale AI / Outlier AI',
    category: 'AI_TRAINING',
    badge: '18+ ROLES',
    description:
      'Global RLHF platform hiring Math, Science, Coding, English & Swahili contributors to write prompts and grade AI responses.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/scale-ai/',
    directCompanyUrl: 'https://outlier.ai/',
    payoutInfo: 'Weekly USD (PayPal / Airtm)',
  },
  {
    id: 'volga-partners',
    name: 'Volga Partners',
    category: 'AI_TRAINING',
    badge: '15+ ROLES',
    description:
      'Specialist AI trainer and analytical domain expert contracts for frontier LLM benchmarks.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/volga-partners/',
    payoutInfo: 'USD Freelance Payouts',
  },
  {
    id: 'lxt',
    name: 'LXT',
    category: 'AI_TRAINING',
    badge: '14+ ROLES',
    description:
      'Global AI data annotation, Swahili/English transcription, search evaluation, and speech collection gigs.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/lxt/',
    directCompanyUrl: 'https://www.lxt.ai/jobs/',
    payoutInfo: 'Payoneer / AirTM',
  },
  {
    id: 'oneforma',
    name: 'OneForma (Centific)',
    category: 'AI_TRAINING',
    badge: '14+ ROLES',
    description:
      'UHRS microtasks, internet judging, translation, and AI data collection open to Kenyan & global freelancers.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/oneforma/',
    directCompanyUrl: 'https://my.oneforma.com/',
    payoutInfo: 'Payoneer / PayPal',
  },
  {
    id: 'innodata',
    name: 'Innodata',
    category: 'AI_TRAINING',
    badge: '10+ ROLES',
    description:
      'Generative AI prompt creation, red-teaming, and subject-matter data engineering roles.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/innodata/',
    directCompanyUrl: 'https://innodata.com/careers/',
    payoutInfo: 'Monthly Contractor Pay',
  },
  {
    id: 'datamundi',
    name: 'DATAmundi',
    category: 'AI_TRAINING',
    badge: '9+ ROLES',
    description:
      'Linguistic data annotation, translation post-editing, and AI dataset validation tasks.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/datamundi/',
    directCompanyUrl: 'https://datamundi.be/jobs/',
    payoutInfo: 'PayPal / Bank Wire',
  },
  {
    id: 'appen-crowdgen',
    name: 'Appen (CrowdGen)',
    category: 'AI_TRAINING',
    badge: '6+ ROLES',
    description:
      'Long-running crowd AI platform offering social media evaluation, search rating, and speech/image tasks.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/appen/',
    directCompanyUrl: 'https://crowdgen.com/',
    payoutInfo: 'Payoneer / PayPal / AirTM',
  },
  {
    id: 'cohere',
    name: 'Cohere (AI Data Trainers)',
    category: 'AI_TRAINING',
    badge: '5+ ROLES',
    description:
      'Enterprise LLM builder hiring remote data annotators, writers, and multilingual AI evaluators.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/cohere/',
    directCompanyUrl: 'https://cohere.com/careers',
    payoutInfo: 'Competitive USD Hourly',
  },
  {
    id: 'pixelogic',
    name: 'Pixelogic Media',
    category: 'AI_TRAINING',
    badge: '5+ ROLES',
    description:
      'Subtitling, media localization, audio QC, and linguistic data roles for global entertainment & AI.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/pixelogic-media/',
    directCompanyUrl: 'https://www.pixelogicmedia.com/careers/',
    payoutInfo: 'Freelance Vendor Payouts',
  },
  {
    id: 'toloka',
    name: 'Toloka',
    category: 'AI_TRAINING',
    badge: 'OPEN TODAY',
    description:
      'AI evaluation microtasks, side-by-side search comparisons, and domain expert projects.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/toloka/',
    directCompanyUrl: 'https://toloka.ai/',
    payoutInfo: 'Payoneer / PayPal',
  },
  {
    id: 'mindrift',
    name: 'Mindrift',
    category: 'AI_TRAINING',
    badge: 'TEACHER FAVOURITE',
    description:
      'Hires teachers, writers, editors, STEM tutors & coders to write and fact-check generative AI responses ($15–$40/hr).',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/mindrift/',
    directCompanyUrl: 'https://mindrift.ai/',
    payoutInfo: 'Payoneer / PayPal (Bi-weekly)',
  },
  {
    id: 'sama',
    name: 'Sama (Kenya / East Africa Hub)',
    category: 'AI_TRAINING',
    badge: 'KENYA HUB',
    description:
      'Major Nairobi & East Africa ethical AI data annotation, computer vision, and LLM evaluation employer.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/sama/',
    directCompanyUrl: 'https://www.sama.com/careers',
    payoutInfo: 'KES Bank / M-Pesa Payroll',
  },
  {
    id: 'cloudfactory',
    name: 'CloudFactory (Kenya & Remote)',
    category: 'AI_TRAINING',
    badge: 'KENYA HUB',
    description:
      'Renowned Kenya & remote digital workforce platform for AI data labeling, image annotation, and data processing.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/cloudfactory/',
    directCompanyUrl: 'https://www.cloudfactory.com/careers',
    payoutInfo: 'KES / USD Direct Payouts',
  },
  {
    id: 'mistral-ai',
    name: 'Mistral AI',
    category: 'AI_TRAINING',
    badge: 'FRONTIER AI',
    description:
      'European frontier LLM lab hiring AI trainers, linguistic specialists, and technical evaluators.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/mistral-ai/',
    directCompanyUrl: 'https://mistral.ai/careers',
    payoutInfo: 'USD / EUR Contracts',
  },
  {
    id: 'inworld-ai',
    name: 'Inworld AI',
    category: 'AI_TRAINING',
    badge: 'CREATIVE AI',
    description:
      'Character & conversational AI studio hiring dialogue writers, voice/data specialists, and AI evaluators.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/inworld-ai/',
    directCompanyUrl: 'https://inworld.ai/careers',
    payoutInfo: 'USD Remote Roles',
  },
  {
    id: 'trellis',
    name: 'Trellis',
    category: 'AI_TRAINING',
    badge: 'AI ROLES',
    description:
      'Legal and enterprise AI workflow annotation and structured data review roles.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/trellis/',
    payoutInfo: 'USD Contractor Pay',
  },
  {
    id: 'vals-ai',
    name: 'Vals AI',
    category: 'AI_TRAINING',
    badge: 'BENCHMARKS',
    description:
      'Independent AI model benchmarking platform contracting finance, legal, tax, and STEM specialists.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/vals-ai/',
    directCompanyUrl: 'https://www.vals.ai/',
    payoutInfo: 'USD Expert Stipends',
  },
  {
    id: 'pointclickcare',
    name: 'PointClickCare',
    category: 'AI_TRAINING',
    badge: 'HEALTHCARE AI',
    description:
      'Healthcare clinical documentation & medical AI data validation opportunities.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/pointclickcare/',
    payoutInfo: 'Remote Contracts',
  },
  {
    id: 'edison-scientific',
    name: 'Edison Scientific',
    category: 'AI_TRAINING',
    badge: 'SCIENCE AI',
    description:
      'Scientific AI training roles for Biology, Chemistry, Physics, and Mathematics educators/graduates.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/edison-scientific/',
    payoutInfo: 'USD STEM Contracts',
  },
  {
    id: 'limbic',
    name: 'Limbic',
    category: 'AI_TRAINING',
    badge: 'CLINICAL AI',
    description:
      'Mental health & counselling AI evaluation and psychological dialogue annotation roles.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/limbic/',
    payoutInfo: 'Specialist Remote Pay',
  },
  {
    id: 'jazzx-ai',
    name: 'JazzX AI',
    category: 'AI_TRAINING',
    badge: 'AI ROLES',
    description:
      'Generative AI training, data curation, and multilingual prompt evaluation gigs.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/jazzx-ai/',
    payoutInfo: 'USD Freelance Pay',
  },
  {
    id: 'evolutioniq',
    name: 'EvolutionIQ',
    category: 'AI_TRAINING',
    badge: 'INSURANCE AI',
    description:
      'Claims guidance & analytical AI model review opportunities.',
    primaryUrl:
      'https://www.aitrainingjobs.it/ai-training-jobs-by-company/evolutioniq/',
    payoutInfo: 'USD Remote Roles',
  },
  {
    id: 'kastle',
    name: 'Kastle',
    category: 'AI_TRAINING',
    badge: 'AI AGENTS',
    description:
      'Conversational voice AI agent testing, scripting, and quality evaluation roles.',
    primaryUrl: 'https://www.aitrainingjobs.it/ai-training-jobs-by-company/kastle/',
    payoutInfo: 'USD Contractor Pay',
  },
  {
    id: 'dataannotation-tech',
    name: 'DataAnnotation.tech',
    category: 'AI_TRAINING',
    badge: 'TOP PLATFORM',
    description:
      'Self-paced chatbot comparison, creative writing, math reasoning, and coding AI training ($20–$40+/hr).',
    primaryUrl: 'https://www.dataannotation.tech/',
    payoutInfo: 'PayPal USD',
  },
  {
    id: 'alignerr',
    name: 'Alignerr (by Labelbox)',
    category: 'AI_TRAINING',
    badge: 'HIGH PAYING',
    description:
      'Trains frontier AI models across 50+ subjects including K-12/High School Math, Biology, Chemistry, English & Swahili.',
    primaryUrl: 'https://www.alignerr.com/',
    payoutInfo: 'Deel / PayPal / M-Pesa via Wise',
  },
  {
    id: 'telus-digital',
    name: 'TELUS Digital AI Community',
    category: 'AI_TRAINING',
    badge: 'GLOBAL FLEXIBLE',
    description:
      'Search engine evaluator, internet safety rater, and personalized ads assessor roles from home.',
    primaryUrl: 'https://www.telusdigital.com/careers/ai-community',
    payoutInfo: 'Hyperwallet / PayPal',
  },
];

// Complete directory of Top Legitimate Paid Survey & Microtask Accounts (Kenya & Global)
const SURVEY_ACCOUNTS: HustlePlatform[] = [
  {
    id: 'sagapoll-kenya',
    name: 'SagaPoll (Africa & Kenya Official)',
    category: 'SURVEY',
    badge: 'M-PESA / BANK',
    description:
      '100% African consumer survey app accredited in Kenya — earn points daily answering short mobile polls on brands & habits.',
    primaryUrl: 'https://sagapoll.com/',
    payoutInfo: 'M-Pesa / Kenyan Bank / Airtime',
  },
  {
    id: 'geopoll-kenya',
    name: 'GeoPoll Kenya',
    category: 'SURVEY',
    badge: 'DIRECT M-PESA',
    description:
      'Leading mobile survey network in Kenya paying directly via M-Pesa or airtime for short SMS, web, and app surveys.',
    primaryUrl: 'https://www.geopoll.com/',
    payoutInfo: 'M-Pesa Cash & Safaricom Airtime',
  },
  {
    id: 'triaba-kenya',
    name: 'Triaba Kenya Panel',
    category: 'SURVEY',
    badge: 'KENYA PANEL',
    description:
      'Dedicated Kenyan paid survey panel (Cint network) paying $0.25–$3.50 per completed consumer opinion survey.',
    primaryUrl: 'https://www.triaba.com/ke/',
    payoutInfo: 'PayPal / M-Pesa Gift Vouchers',
  },
  {
    id: 'mobrog-kenya',
    name: 'MOBROG Kenya',
    category: 'SURVEY',
    badge: 'KENYA SURVEYS',
    description:
      'International market research surveys open to Kenyan residents on desktop and Android/iOS app with fast low-threshold payouts.',
    primaryUrl: 'https://www.mobrog.com/en-ke/',
    payoutInfo: 'PayPal / Skrill (from $6.25)',
  },
  {
    id: 'surveyeah-kenya',
    name: 'Surveyeah Kenya',
    category: 'SURVEY',
    badge: 'KENYA PANEL',
    description:
      'Simple paid email & browser surveys tailored for Kenyan consumers, students, and teachers.',
    primaryUrl: 'https://panel.surveyeah.com/en/p/ke',
    payoutInfo: 'PayPal (Withdraw PayPal -> M-Pesa)',
  },
  {
    id: 'prolific',
    name: 'Prolific Academic & AI Studies',
    category: 'SURVEY',
    badge: 'HIGHEST PAYING',
    description:
      'Gold-standard university & AI research survey platform paying guaranteed minimum £6/$8+ per hour with zero unfair screen-outs.',
    primaryUrl: 'https://www.prolific.com/',
    payoutInfo: 'PayPal USD & GBP',
  },
  {
    id: 'ysense',
    name: 'ySense',
    category: 'SURVEY',
    badge: 'SURVEYS + TASKS',
    description:
      'Daily paid surveys, offerwalls, and daily checklist bonuses trusted by global freelancers for over 15 years.',
    primaryUrl: 'https://www.ysense.com/',
    payoutInfo: 'Payoneer / PayPal / Skrill',
  },
  {
    id: 'swagbucks',
    name: 'Swagbucks',
    category: 'SURVEY',
    badge: 'POPULAR',
    description:
      'Earn SB points answering daily surveys, testing apps, and searching the web, redeemable for PayPal cash.',
    primaryUrl: 'https://www.swagbucks.com/',
    payoutInfo: 'PayPal Cash & Gift Cards',
  },
  {
    id: 'freecash',
    name: 'Freecash',
    category: 'SURVEY',
    badge: 'INSTANT CASHOUT',
    description:
      'High-paying CPX Research, BitLabs & YourSurveys walls plus app testing offers with fast same-day withdrawals.',
    primaryUrl: 'https://freecash.com/',
    payoutInfo: 'PayPal / Crypto / Airtm (from $5)',
  },
  {
    id: 'prime-opinion',
    name: 'Prime Opinion',
    category: 'SURVEY',
    badge: 'FAST QUALIFY',
    description:
      'Modern high-inventory survey account with streak bonuses, welcome bonus, and instant $5 cashout.',
    primaryUrl: 'https://www.primeopinion.com/',
    payoutInfo: 'PayPal / Virtual Visa',
  },
  {
    id: 'attapoll',
    name: 'AttaPoll Mobile Surveys',
    category: 'SURVEY',
    badge: '$3 MINIMUM',
    description:
      'Clean mobile survey app notifying you whenever high-match short surveys arrive — cash out from just $3.',
    primaryUrl: 'https://attapoll.com/',
    payoutInfo: 'Instant PayPal / Revolut',
  },
  {
    id: 'pawns-app',
    name: 'Pawns.app',
    category: 'SURVEY',
    badge: 'SURVEYS + PASSIVE',
    description:
      'Combine paid mobile surveys with passive bandwidth sharing to reach the $5 cashout threshold quickly.',
    primaryUrl: 'https://pawns.app/',
    payoutInfo: 'PayPal / Bitcoin (from $5)',
  },
  {
    id: 'timebucks',
    name: 'TimeBucks',
    category: 'SURVEY',
    badge: 'NO APPROVAL WAIT',
    description:
      'Daily paid surveys, microtasks, content slideshows, and automatic Thursday payouts with Airtm -> M-Pesa support.',
    primaryUrl: 'https://timebucks.com/',
    payoutInfo: 'AirTM (Direct M-Pesa) / Payeer',
  },
  {
    id: 'superpayme',
    name: 'Superpay.me',
    category: 'SURVEY',
    badge: '$1 MINIMUM',
    description:
      'Fast daily survey routers (TapResearch, TheoremReach, CPX) with an ultra-low $1 minimum PayPal withdrawal.',
    primaryUrl: 'https://www.superpay.me/',
    payoutInfo: 'Instant PayPal ($1 min)',
  },
  {
    id: 'surveytime',
    name: 'SurveyTime ($1 Instant)',
    category: 'SURVEY',
    badge: '$1 PER SURVEY',
    description:
      'Pays a flat $1.00 immediately after every completed survey with zero waiting for withdrawal thresholds.',
    primaryUrl: 'https://surveytime.io/',
    payoutInfo: 'Instant $1 PayPal / Crypto',
  },
  {
    id: 'toluna',
    name: 'Toluna Influencers',
    category: 'SURVEY',
    badge: 'BRAND POLLS',
    description:
      'Share opinions with top global consumer brands and earn redeemable points for PayPal cash.',
    primaryUrl: 'https://www.toluna.com/',
    payoutInfo: 'PayPal & Vouchers',
  },
  {
    id: 'prizerebel',
    name: 'PrizeRebel',
    category: 'SURVEY',
    badge: 'RELIABLE',
    description:
      'Established market research survey portal with Gold/Platinum account level bonuses and fast PayPal processing.',
    primaryUrl: 'https://www.prizerebel.com/',
    payoutInfo: 'PayPal (from $5)',
  },
  {
    id: 'ipsos-isay',
    name: 'Ipsos iSay',
    category: 'SURVEY',
    badge: 'IPSOS GLOBAL',
    description:
      'Official consumer survey community powered by Ipsos (one of the largest research agencies operating in Kenya & globally).',
    primaryUrl: 'https://www.ipsosisay.com/',
    payoutInfo: 'PayPal & Prepaid Cards',
  },
  {
    id: 'yougov',
    name: 'YouGov',
    category: 'SURVEY',
    badge: 'PUBLIC OPINION',
    description:
      'Short, engaging current-events, education, media, and social opinion surveys quoted in international news.',
    primaryUrl: 'https://account.yougov.com/',
    payoutInfo: 'Bank / Cash / Gift Rewards',
  },
  {
    id: 'clickworker',
    name: 'Clickworker (Surveys + UHRS)',
    category: 'SURVEY',
    badge: 'UHRS + SURVEYS',
    description:
      'Gives verified access to Microsoft UHRS search evaluation microtasks alongside paid surveys and app testing.',
    primaryUrl: 'https://www.clickworker.com/',
    payoutInfo: 'Payoneer / PayPal',
  },
  {
    id: 'sproutgigs',
    name: 'SproutGigs (Micro-Jobs & Surveys)',
    category: 'SURVEY',
    badge: 'FREELANCE GIGS',
    description:
      'Complete quick micro-tasks, paid surveys, and freelance gigs — withdraw easily to M-Pesa via AirTM.',
    primaryUrl: 'https://sproutgigs.com/',
    payoutInfo: 'AirTM (M-Pesa) / Litecoin',
  },
  {
    id: 'lifepoints',
    name: 'LifePoints Panel',
    category: 'SURVEY',
    badge: 'LIFESTYLE',
    description:
      'Earn LifePoints sharing feedback on everyday products, healthcare, and education.',
    primaryUrl: 'https://www.lifepointspanel.com/',
    payoutInfo: 'PayPal Cash',
  },
  {
    id: 'marketagent',
    name: 'Marketagent',
    category: 'SURVEY',
    badge: 'INTERNATIONAL',
    description:
      'Bonus points upon free registration plus steady mobile & web consumer surveys.',
    primaryUrl: 'https://panel.marketagent.com/',
    payoutInfo: 'PayPal / Skrill',
  },
  {
    id: 'cloudresearch',
    name: 'CloudResearch Connect',
    category: 'SURVEY',
    badge: 'ACADEMIC',
    description:
      'University psychology, education & AI perception studies paying fair hourly rates.',
    primaryUrl: 'https://connect.cloudresearch.com/',
    payoutInfo: 'PayPal USD',
  },
  {
    id: 'usertesting',
    name: 'UserTesting ($10 / Test)',
    category: 'SURVEY',
    badge: '$10 / 20 MINS',
    description:
      'Speak your thoughts aloud while testing websites and educational apps — pays $10 per 20-minute test!',
    primaryUrl: 'https://www.usertesting.com/get-paid-to-test',
    payoutInfo: 'PayPal (14-day payout)',
  },
];

const ALL_HUSTLES: HustlePlatform[] = [...AI_TRAINING_COMPANIES, ...SURVEY_ACCOUNTS];

export default function HolidaySideHustlesHub({
  externalTriggerCount = 0,
}: {
  externalTriggerCount?: number;
}) {
  const { config, trackAdClick, trackAdImpression, trackInteraction } =
    useMonetization();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'ALL' | 'AI_TRAINING' | 'SURVEY'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<HustlePlatform | null>(
    null
  );

  const openSideHustles = () => {
    trackAdClick('holiday_side_hustles');
    trackAdImpression('holiday_side_hustles');
    trackInteraction('holiday_side_hustles_open');
    setSelectedPlatform(null);
    setIsOpen(true);
  };

  useEffect(() => {
    if (externalTriggerCount > 0) {
      openSideHustles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTriggerCount]);

  const filteredPlatforms = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_HUSTLES.filter((p) => {
      if (tab !== 'ALL' && p.category !== tab) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.payoutInfo.toLowerCase().includes(q) ||
        p.badge.toLowerCase().includes(q)
      );
    });
  }, [tab, search]);

  const handleSelectPlatform = (item: HustlePlatform) => {
    trackAdClick('holiday_side_hustles');
    trackInteraction(`side_hustle_${item.category.toLowerCase()}_click`);
    setSelectedPlatform(item);
  };

  return (
    <>
      {/* TOP VISIBLE FREELANCERS BANNER WITH EXACT BUTTON NAME: HOLIDAY SIDE HUSTLES */}
      <section
        id="holiday-side-hustles-hub"
        aria-label="Holiday Side Hustles for Freelancers, Teachers & Students"
        className="mb-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white rounded-2xl px-5 py-4 shadow-md border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Remote Freelancer Hub ({ALL_HUSTLES.length} Verified Sites)
              </span>
              <span className="text-[11px] font-semibold text-amber-300">
                48 AI Training Companies (AITrainingJobs.it) + 25 Paid Survey Accounts
              </span>
            </div>
            <h2 className="text-base md:text-lg font-black tracking-tight text-white">
              Freelancer Remote AI Training Jobs &amp; Paid Survey Accounts
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Explore all 48 remote AI training &amp; RLHF companies from{' '}
              <strong>AITrainingJobs.it</strong> (Micro1, Mercor, Outlier, Mindrift,
              Welocalize, Sama, CloudFactory &amp; more) plus 25 legitimate paid survey
              accounts paying via M-Pesa, PayPal &amp; Payoneer.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openSideHustles}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-3.5 rounded-xl shadow-lg transition cursor-pointer"
        >
          <Briefcase className="w-4 h-4" />
          <span>HOLIDAY SIDE HUSTLES</span>
        </button>
      </section>

      {/* MODAL: ALL AI TRAINING COMPANIES + ALL SURVEY ACCOUNTS */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight uppercase">
                    HOLIDAY SIDE HUSTLES — Freelancer AI Jobs &amp; Survey Accounts
                  </h3>
                  <p className="text-xs text-emerald-300">
                    {AI_TRAINING_COMPANIES.length} AI Training Companies
                    (AITrainingJobs.it) + {SURVEY_ACCOUNTS.length} Paid Survey &amp;
                    Microtask Accounts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            {!selectedPlatform && (
              <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      tab === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    All ({ALL_HUSTLES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('AI_TRAINING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 cursor-pointer ${
                      tab === 'AI_TRAINING'
                        ? 'bg-indigo-700 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    AI Training Companies ({AI_TRAINING_COMPANIES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('SURVEY')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 cursor-pointer ${
                      tab === 'SURVEY'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Survey Accounts ({SURVEY_ACCOUNTS.length})
                  </button>
                </div>

                <div className="relative sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Mercor, Prolific, M-Pesa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
              {/* Top Monetized Ad Slot */}
              <AdSlot placement="holiday_side_hustles" variantIndex={0} />

              {selectedPlatform ? (
                <div className="bg-white border-2 border-emerald-300 rounded-2xl p-6 space-y-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span
                        className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          selectedPlatform.category === 'AI_TRAINING'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {selectedPlatform.category === 'AI_TRAINING'
                          ? 'AI Training & Annotation'
                          : 'Paid Survey & Microtask Account'}{' '}
                        • {selectedPlatform.badge}
                      </span>
                      <h4 className="text-lg font-black text-slate-900">
                        {selectedPlatform.name}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedPlatform.description}
                      </p>
                      <p className="text-xs font-bold text-emerald-700 pt-1">
                        Payout Method: {selectedPlatform.payoutInfo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlatform(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 whitespace-nowrap"
                    >
                      ← Back to All ({ALL_HUSTLES.length})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={selectedPlatform.primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackAdClick('holiday_side_hustles')}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow transition"
                    >
                      <span>
                        {selectedPlatform.category === 'AI_TRAINING' &&
                        selectedPlatform.primaryUrl.includes('aitrainingjobs.it')
                          ? `Open ${selectedPlatform.name} Open Roles`
                          : `Sign Up / Open ${selectedPlatform.name}`}
                      </span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {selectedPlatform.directCompanyUrl && (
                      <a
                        href={selectedPlatform.directCompanyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackAdClick('holiday_side_hustles')}
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow transition"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Official Company Portal</span>
                      </a>
                    )}
                  </div>

                  <AdSlot placement="preview_modal" variantIndex={1} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredPlatforms.map((item) => {
                    const isAi = item.category === 'AI_TRAINING';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPlatform(item)}
                        className="text-left bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-400 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition flex items-start gap-3.5 cursor-pointer group"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                            isAi
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isAi ? (
                            <Bot className="w-5 h-5" />
                          ) : (
                            <ClipboardList className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider ${
                                isAi ? 'text-indigo-700' : 'text-emerald-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition shrink-0" />
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-800 transition">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 pt-0.5">
                            Pay: <span className="text-slate-700">{item.payoutInfo}</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!selectedPlatform && (
                <AdSlot placement="preview_modal" variantIndex={2} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
