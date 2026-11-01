import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baithak - Intelligent Meeting AI Notetaker",
    short_name: "Baithak",
    description:
      "Capture spoken conversations, generate reliable speaker-labeled transcripts, executive summaries, and structured action items.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}

