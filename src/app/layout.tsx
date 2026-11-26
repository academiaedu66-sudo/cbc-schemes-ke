import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#065f46",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cbcmaterials.shop"),
  title: {
    default:
      "CBCMATERIALS.SHOP | 2026 CBC Schemes of Work, Lesson Plans, Teachers Notes, TSC TPAD & KNEC Exams",
    template: "%s | CBCMATERIALS.SHOP",
  },
  description:
    "Official CBCMATERIALS.SHOP Kenya — Download 6,534+ KICD-rationalized 2026 CBC Schemes of Work, Lesson Plans, Teachers' Notes, Records of Work, TSC TPAD 2 & T-Pay Guides, KNEC KJSEA & KPSEA Exams + Marking Schemes, and Book Verified CBC Tutors (PP1–Grade 12) in Word & PDF.",
  applicationName: "CBCMATERIALS.SHOP",
  category: "education",
  authors: [
    { name: "CBCMATERIALS.SHOP", url: "https://www.cbcmaterials.shop" },
  ],
  creator: "CBCMATERIALS.SHOP",
  publisher: "CBCMATERIALS.SHOP",
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
    "CBCMATERIALS.SHOP",
    "WWW.CBCMATERIALS.SHOP",
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
    "TSC TPAD 2 Appraisal portal and calendar 2026",
    "TSC T-Pay payslips P9 forms and Wealth Declaration",
    "TSC teacher recruitment promotions and transfers Kenya",
    "TSC TPAD Lesson Plans and Records of Work Covered",
    "CBC Lesson Plans Format and Templates Word DOCX PDF",
    "2026 CBC Lesson Plans Term 1 Term 2 Term 3",
    "Schemes of work download free preview Kenya",
    "2026 rationalized schemes of work PP1 to Grade 12",
    "KICD Approved Orange Book Textbooks and Curriculum Designs",
    "CBC Assessment Rubrics EE ME AE BE",
    "Tuition",
    "Tutors",
    "CBC Tuition Kenya",
    "Home Tuition and Online Tutors Kenya",
    "Holiday Tuition Teachers Nairobi Mombasa Kisumu Nakuru Eldoret All 47 Counties",
    "Private CBC Tutors PP1 to Grade 12",
    "Tutor Peter Whiteboard Classes",
    "CBC Lesson Plans Editable Word",
    "KICD Curriculum Designs PDF",
    "Senior School Grade 10 11 12 Pathways Schemes and Notes",
    "CBC Grade Up Book",
    "Super-Light CBC Compilation",
    "Smart CBC All Subjects",
    "CBC exam papers",
    "CBC past papers",
    "CBC curriculum",
    "Kenya syllabus",
    "Kenya education resources",
    "Kenya teachers resources",
    "TSC appraisal portal",
    "TSC teacher pay",
    "CBC teaching materials",
    "CBC downloadable PDFs",
    "CBC educational content",
    "Kenya school resources",
    "Kenya education portal",
    "CBCTeacher resources",
    "CBC online library",
    "Kenya learning materials",
    "CBC lesson templates",
    "CBCTeachers guide",
    "Education Kenya",
    "Kenya learning hub",
    "CBCTeaching aids",
    "Kenya teacher guides",
    "CBC study guides"
  ],
  openGraph: {
    title:
      "CBCMATERIALS.SHOP | 6,534+ CBC Schemes of Work, Teachers Notes, KNEC KJSEA/KPSEA Exams, TSC & Tuition Tutors",
    description:
      "Download 6,534+ KICD-rationalized 2026 Schemes of Work, Teachers' Notes, Lesson Plans, KNEC KJSEA & KPSEA Examinations + Marking Schemes, TSC Tools & Verified Tuition Tutors (PP1–Grade 12) on CBCMATERIALS.SHOP.",
    url: "https://www.cbcmaterials.shop",
    siteName: "CBCMATERIALS.SHOP",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "CBCMATERIALS.SHOP | Schemes of Work, Teachers Notes, KNEC Exams, TSC & Tutors",
    description:
      "6,534+ Editable Word (.DOCX) + Print-Ready (.PDF) CBC Schemes, Teachers Notes, KNEC KJSEA/KPSEA Exams, TSC Services & Verified Tutors on CBCMATERIALS.SHOP.",
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
          title="CBCMATERIALS.SHOP Search"
          href="/opensearch.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="CBCMATERIALS.SHOP Official Social & Video SEO Feed"
          href="/social-feed.xml"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <MonetizationProvider>{children}</MonetizationProvider>
      </body>
    </html>
  );
}
