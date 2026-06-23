import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Powered Coding Workspace",
  description: "Multi-environment development sandbox interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-950 text-white" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
