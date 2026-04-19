import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aksumite-Toumai",
  description: "Aksumite is a platform for managing applicants for jobs.",
  metadataBase: new URL("https://aksumite-toumai.vercel.app")
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-aksum`}>
        {children}
      </body>
    </html>
  );
}
