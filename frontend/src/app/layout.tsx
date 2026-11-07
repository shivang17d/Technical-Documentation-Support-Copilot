import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Technical Docs Copilot · Vector RAG Assistant",
  description:
    "Semantic search assistant that answers developer and product-support questions grounded in your uploaded documentation with cited passage evidence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

