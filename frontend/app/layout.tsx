import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "Somnia Merchant NPC Console",
  description: "Monitor and guide AI-driven merchant NPCs on Somnia."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
