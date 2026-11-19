import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MonetizationProvider } from "@/components/MonetizationEngine";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cbcmaterials.shop"),
  title: {
    default:
      "CBCMaterials Kenya (2026) | CBC Schemes of Work, Teachers Notes, KNEC KJSEA & KPSEA Examinations, TSC & Tuition Tutors",
    template: "%s | CBCMaterials Kenya (cbcmaterials.shop)",
  },
  description:
    "Official CBCMaterials Kenya Portal (www.cbcmaterials.shop) — Download 6,534+ KICD-rationalized 2026 CBC Schemes of Work, Teachers' Notes, Lesson Plans, Records of Work, KNEC KJSEA & KPSEA Examinations + Marking Schemes, Revision Books, All TSC Services, and Verified Home & Online Tuition Tutors (PP1–Grade 12).",
  applicationName: "CBCMaterials Kenya",
  category: "education",
  authors: [
    { name: "CBCMaterials Kenya (CBC Kenya Resource Hub)", url: "https://www.cbcmaterials.shop" },
  ],
  creator: "CBCMaterials Kenya",
  publisher: "CBCMaterials Kenya",
  alternates: {
    canonical: "https://www.cbcmaterials.shop",
    languages: {
      "en-KE": "https://www.cbcmaterials.shop",
      en: "https://www.cbcmaterials.shop",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  keywords: [
    "CBC",
    "CBC Kenya",
    "CBCMATERIALS",
    "cbcmaterials",
    "cbcmaterials.shop",
    "CBC Materials Kenya",
    "Schemes of Work",
    "2026 CBC Schemes of Work Kenya",
    "KICD Rationalized Schemes of Work Editable Word DOCX PDF",
    "Teachers Notes",
    "CBC Teachers Notes PDF Download",
    "CBC Lesson Notes PP1 to Grade 12",
    "Short Point Form CBC Notes with Examples",
    "KNEC",
    "KNEC Examinations",
    "Examinations Kenya",
    "Kenya National KJSEA Test",
    "National KJSEA Examination All Grades",
    "KJSEA Past Papers Trials and Marking Schemes 2026",
    "KPSEA Grade 6 Exams and Marking Schemes 2026",
    "KEYA Grade 3 Assessments",
    "Opener Mid-Term End-Term CBC Exams and Marking Schemes",
    "TSC",
    "Teachers Service Commission Kenya",
    "TSC TPAD 2 Appraisal Records of Work",
    "TSC T-Pay Payslips and Wealth Declaration",
    "Tuition",
    "Tutors",
    "CBC Tuition Kenya",
    "Home Tuition and Online Tutors Kenya",
    "Holiday Tuition Teachers Nairobi Mombasa Kisumu Nakuru Eldoret All 47 Counties",
    "Private CBC Tutors PP1 to Grade 12",
    "CBC Lesson Plans Editable Word",
    "KICD Curriculum Designs PDF",
    "Senior School Grade 10 11 12 Pathways Schemes and Notes",
    "CBC Grade Up Book",
    "Super-Light CBC Compilation",
    "Smart CBC All Subjects",
  ],
  openGraph: {
    title:
      "CBCMaterials Kenya (2026) | 6,534+ CBC Schemes of Work, Teachers Notes, KNEC KJSEA/KPSEA Exams, TSC & Tuition Tutors",
    description:
      "Download 6,534+ KICD-rationalized 2026 Schemes of Work, Teachers' Notes, Lesson Plans, KNEC KJSEA & KPSEA Examinations + Marking Schemes, TSC Tools & Verified Tuition Tutors (PP1–Grade 12) on cbcmaterials.shop.",
    url: "https://www.cbcmaterials.shop",
    siteName: "CBCMaterials Kenya (cbcmaterials.shop)",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "CBCMaterials Kenya (2026) | Schemes of Work, Teachers Notes, KNEC Exams, TSC & Tutors",
    description:
      "6,534+ Editable Word (.DOCX) + Print-Ready (.PDF) CBC Schemes, Teachers Notes, KNEC KJSEA/KPSEA Exams, TSC Services & Verified Tutors in Kenya.",
  },
  other: {
    "geo.region": "KE",
    "geo.placename": "Kenya",
    monetag: "4b974ebe97045e1613a11e325ff4e2a4",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="CBCMaterials Kenya Search"
          href="/opensearch.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="CBCMaterials Kenya Official Social & Video SEO Feed"
          href="/social-feed.xml"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <MonetizationProvider>{children}</MonetizationProvider>
      </body>
    </html>
  );
}
