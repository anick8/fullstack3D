import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Aniketh A Keshava — Software Engineer",
  description:
    "Software engineer and full-stack developer with over 7 years building web, mobile and " +
    "AI-driven products — Node.js, React, React Native and Python.",
};

/**
 * Root layout — wraps every route.
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
