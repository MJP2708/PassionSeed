import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const SESSION_COOKIE = "ps_user";
export type Role = "STUDENT" | "BUDDY" | "TEACHER";

/** Demo login: the cookie just holds a user id. No real auth.
 *  Wrapped in cache() so the layout and the page share one DB lookup per request. */
export const getCurrentUser = cache(async () => {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return db.user.findUnique({ where: { id } });
});

export async function requireUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect("/");
  return user;
}
