"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";

export async function switchUser(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) redirect("/login");
  (await cookies()).set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(user.role === "TEACHER" ? "/teacher" : user.role === "BUDDY" ? "/buddy" : "/");
}
