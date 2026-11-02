import type { Metadata } from "next";
import { DM_Sans, Fraunces, Great_Vibes } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Petunia Gift",
    template: "%s · Petunia Gift",
  },
  description:
    "Handmade personalised gifts for Malaysia — Museum of Us, F1 frames, Graduation Lego Frame.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${script.variable} ${body.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
