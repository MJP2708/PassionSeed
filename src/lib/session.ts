import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const SESSION_COOKIE = "ps_user";
export type Role = "STUDENT" | "BUDDY" | "TEACHER";

/** Demo login: the cookie just holds a user id. No real auth. */
export async function getCurrentUser() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return db.user.findUnique({ where: { id } });
}

export async function requireUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect("/");
  return user;
}
