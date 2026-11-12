import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Itim } from "next/font/google";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

const itim = Itim({ weight: "400", subsets: ["thai", "latin"], variable: "--font-itim", display: "swap" });
const plex = IBM_Plex_Sans_Thai({ weight: ["400", "500", "600"], subsets: ["thai", "latin"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: "PassionSeed · ตามเรียนให้ทัน",
  description: "ช่วยนักเรียนที่ขาดเรียนไปแข่งขัน ตามเนื้อหาและงานให้ทัน",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#faf8f3" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const isStudent = user?.role === "STUDENT";
  return (
    <html lang="th" className={`${itim.variable} ${plex.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <div className="mx-auto flex min-h-dvh w-full max-w-[34rem] flex-col">
          <Header user={user ? { nickname: user.nickname, role: user.role } : null} />
          <main className={`flex-1 px-5 ${isStudent ? "pb-32" : "pb-16"}`}>{children}</main>
          {isStudent && <BottomNav />}
        </div>
      </body>
    </html>
  );
}
