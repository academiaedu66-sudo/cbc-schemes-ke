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
      "CBC Materials Kenya (2026) | PP1–Grade 12 Schemes of Work, Notes, Lesson Plans & KPSEA/KJSEA Exams",
    template: "%s | CBC Materials Kenya (cbcmaterials.shop)",
  },
  description:
    "Official Kenya CBC Resource Hub (cbcmaterials.shop) — Download 3,400+ KICD-rationalized 2026 CBC Schemes of Work, Lesson Plans, Teachers' Notes, Records of Work, Holiday Assignments, and KPSEA, KJSEA & Senior School Exams in Editable Word (.DOCX) and Print-Ready (.PDF) from PP1 to Grade 12.",
  applicationName: "CBC Kenya Resource Hub",
  category: "education",
  authors: [{ name: "CBC Kenya Resource Hub", url: "https://www.cbcmaterials.shop" }],
  creator: "CBC Kenya Resource Hub",
  publisher: "CBC Kenya Resource Hub",
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
    "CBC materials Kenya",
    "cbcmaterials.shop",
    "2026 CBC Schemes of Work Kenya",
    "KICD Rationalized Schemes of Work 2026",
    "CBC Lesson Plans Editable Word DOCX",
    "CBC Teachers Notes PDF Download",
    "PP1 PP2 CBC Schemes and Activity Sheets",
    "Grade 1 2 3 Lower Primary CBC Notes and Exams",
    "Grade 4 5 6 KPSEA Trial Papers and Marking Schemes 2026",
    "Grade 7 8 9 Junior School KJSEA Revision Papers 2026",
    "Grade 10 11 12 Senior School CBC Schemes and Notes",
    "CBC Holiday Assignments Term 1 Term 2 Term 3",
    "KICD Curriculum Designs PDF",
    "TSC TPAD 2 Records of Work Kenya",
    "Holiday Tuition Teachers Kenya",
  ],
  openGraph: {
    title:
      "CBC Materials Kenya (2026) | 3,400+ Editable Word & PDF Schemes, Notes & KPSEA/KJSEA Exams",
    description:
      "Download 2026 KICD-rationalized Schemes of Work, Lesson Plans, Notes, Holiday Assignments & KPSEA/KJSEA Trial Exams (PP1–Grade 12) instantly via M-Pesa.",
    url: "https://www.cbcmaterials.shop",
    siteName: "CBC Kenya Resource Hub",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "CBC Materials Kenya (2026) | PP1–Grade 12 Schemes, Notes & KPSEA/KJSEA Exams",
    description:
      "3,400+ Editable Word (.DOCX) + Print-Ready (.PDF) KICD-rationalized CBC teaching & revision materials in Kenya.",
  },
  other: {
    "geo.region": "KE",
    "geo.placename": "Kenya",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MonetizationProvider>{children}</MonetizationProvider>
      </body>
    </html>
  );
}
