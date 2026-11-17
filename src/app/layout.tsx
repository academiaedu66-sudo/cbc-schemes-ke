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
  metadataBase: new URL("https://cbcmaterials.shop"),
  title:
    "CBC Kenya Resource Hub | PP1–Grade 12 Schemes of Work, Lesson Plans, Notes & KPSEA/KJSEA Exams",
  description:
    "Download 2026 KICD-rationalized CBC Schemes of Work, Lesson Plans, Lesson Notes, Records of Work, Opener/Mid/End-Term Exams, and KPSEA & KJSEA Trial Papers in Editable Word (.DOCX) and Print-Ready (.PDF) for PP1, PP2, and Grades 1 to 12 in Kenya.",
  keywords: [
    "2026 CBC Schemes of Work Kenya",
    "KICD Rationalized Lesson Plans",
    "PP1 PP2 CBC Schemes and Notes",
    "KPSEA Grade 6 Trial Papers 2026",
    "KJSEA Grade 9 Past Papers and Marking Schemes",
    "Grade 10 Senior School Schemes of Work",
    "TSC TPAD2 Professional Documents",
  ],
  openGraph: {
    title: "CBC Kenya Resource Hub | 2026 KICD Schemes, Notes & KPSEA/KJSEA Trials",
    description:
      "3,400+ Editable Word (.DOCX) + Print-Ready (.PDF) CBC teaching & revision materials from PP1 to Grade 12.",
    url: "https://cbcmaterials.shop",
    siteName: "CBC Kenya Resource Hub",
    locale: "en_KE",
    type: "website",
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
