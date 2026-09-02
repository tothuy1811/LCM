"use server";

import { cookies } from "next/headers";

import { adminAuth } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/lib/firebase/session-cookie";
import { ActionResult } from "@/lib/types";

export async function establishSession(
  idToken: string
): Promise<ActionResult<{ uid: string; email: string | null }>> {
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE_SECONDS * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });

    return {
      ok: true,
      data: { uid: decoded.uid, email: decoded.email ?? null },
    };
  } catch {
    return { ok: false, error: "Unable to sign in. Please try again." };
  }
}

export async function endSession(): Promise<ActionResult> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { ok: true, data: null };
}
