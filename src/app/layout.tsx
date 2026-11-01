import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Baithak - AI Notetaker and Meeting Intelligence",
    template: "%s | Baithak",
  },
  description:
    "Capture live spoken conversations or audio recordings. Baithak generates reliable speaker-labeled transcripts, executive summaries grouped by topic, and structured action items.",
  keywords: [
    "Baithak",
    "बैठक",
    "AI notetaker",
    "meeting notes",
    "meeting intelligence",
    "speech to text",
    "audio transcription",
    "speaker diarization",
    "executive summary",
    "action item extraction",
    "voice AI",
    "Gemini 2.5 Flash",
    "Whisper",
    "multilingual transcription",
  ],
  authors: [{ name: "Baithak Engineering Team" }],
  creator: "Baithak",
  publisher: "Baithak",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Baithak - AI Notetaker and Meeting Intelligence",
    description:
      "Turn spoken conversations into reliable speaker-labeled transcripts, topic summaries, and interactive action items.",
    siteName: "Baithak",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baithak - AI Notetaker and Meeting Intelligence",
    description:
      "Turn spoken conversations into reliable speaker-labeled transcripts, topic summaries, and interactive action items.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Baithak",
  alternateName: "बैठक",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Chrome, Edge, Safari, Firefox",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Intelligent full-stack AI Notetaker that captures spoken audio, generates speaker-labeled transcripts, produces executive summaries, and extracts structured action items.",
  featureList: [
    "In-browser audio recording with real-time waveform visualizer",
    "Continuous background recording with Google Meet style Picture-in-Picture window",
    "Audio file upload for MP3, WAV, M4A, and WebM",
    "Multimodal speech-to-text with speaker diarization and timestamps",
    "Topic-wise executive summaries",
    "Interactive action item checklist with assignees, due dates, and priorities",
    "Export to Markdown, JSON, and clipboard",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
