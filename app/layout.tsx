import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RollCall — Facial Recognition Attendance",
    template: "%s · RollCall",
  },
  description:
    "RollCall identifies enrolled students against a registered roster — no QR codes, no manual roll call.",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: ["/logo.png"],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#0F172A",
              color: "#F8FAFC",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              borderRadius: "8px",
            },
            success: { iconTheme: { primary: "#16A34A", secondary: "#F8FAFC" } },
            error: { iconTheme: { primary: "#DC2626", secondary: "#F8FAFC" } },
          }}
        />
      </body>
    </html>
  );
}
