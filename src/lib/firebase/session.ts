import "server-only";

import { cookies } from "next/headers";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session-cookie";
import { type Role } from "@/lib/permissions";

const USERS_COLLECTION = "users";

export type TSessionUser = {
  uid: string;
  email: string | null;
  name?: string;
  picture?: string;
  role: Role;
};

export async function getSessionUser(): Promise<TSessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    const role = await resolveRole(decoded.uid, decoded.email, decoded.name);

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name,
      picture: decoded.picture,
      role,
    };
  } catch {
    return null;
  }
}

/**
 * Looks up the user's role in Firestore. The very first time a given
 * Firebase Auth account is seen (no `users/{uid}` doc yet), it's
 * self-provisioned as "admin" — this is what lets an account created
 * directly in the Firebase Console (before any User Management UI
 * existed) bootstrap the rest of the system instead of being locked out.
 */
async function resolveRole(
  uid: string,
  email: string | undefined,
  name: string | undefined
): Promise<Role> {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const doc = await ref.get();

  if (doc.exists) {
    const role = doc.data()?.role;
    return role === "ad" ? "ad" : "admin";
  }

  await ref.set({
    email: email ?? "",
    name: name ?? email?.split("@")[0] ?? "User",
    role: "admin",
    createdAt: new Date().toISOString(),
  });

  return "admin";
}
