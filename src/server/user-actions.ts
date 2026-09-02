"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isRole, type Role } from "@/lib/permissions";
import { ActionResult } from "@/lib/types";

const COLLECTION = "users";

export type TAppUser = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
};

async function requireAdmin() {
  const dict = await getDictionary();
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: dict.errors.notAuthenticated };
  if (user.role !== "admin") {
    return {
      ok: false as const,
      error: dict.errors.forbidden,
    };
  }
  return { ok: true as const, user, dict };
}

export type TManagerOption = { uid: string; name: string };

/**
 * Public (unauthenticated) — the recruitment application form needs to let
 * a candidate pick which AD (Quản lý Đại lý) they're applying under. This
 * intentionally exposes only { uid, name }, never email or role, and has
 * no requireAdmin() gate since anonymous candidates must be able to call it.
 */
export async function listRecruitmentManagers(): Promise<
  ActionResult<TManagerOption[]>
> {
  const dict = await getDictionary();
  try {
    // Sorted client-side rather than via .orderBy("name") to avoid needing
    // a composite Firestore index for this where+orderBy combination — the
    // AD roster is small enough that this is negligible.
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("role", "==", "ad")
      .get();

    const managers = snapshot.docs
      .map(doc => ({ uid: doc.id, name: doc.data().name as string }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { ok: true, data: managers };
  } catch {
    return { ok: false, error: dict.errors.users.managerListFailed };
  }
}

export async function listUsers(): Promise<ActionResult<TAppUser[]>> {
  const check = await requireAdmin();
  if (!check.ok) return check;
  const { dict } = check;

  try {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const users = snapshot.docs.map(
      doc => ({ uid: doc.id, ...doc.data() }) as TAppUser
    );

    return { ok: true, data: users };
  } catch {
    return { ok: false, error: dict.errors.users.listFailed };
  }
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: string;
}): Promise<ActionResult<TAppUser>> {
  const check = await requireAdmin();
  if (!check.ok) return check;
  const { dict } = check;

  if (!isRole(input.role)) {
    return { ok: false, error: dict.errors.users.invalidRole };
  }
  if (input.password.length < 8) {
    return { ok: false, error: dict.errors.users.passwordTooShort };
  }

  try {
    const record = await adminAuth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.name,
    });

    const createdAt = new Date().toISOString();
    await adminDb.collection(COLLECTION).doc(record.uid).set({
      email: input.email,
      name: input.name,
      role: input.role,
      createdAt,
    });

    return {
      ok: true,
      data: {
        uid: record.uid,
        email: input.email,
        name: input.name,
        role: input.role,
        createdAt,
      },
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      return { ok: false, error: dict.errors.users.emailInUse };
    }
    return { ok: false, error: dict.errors.users.createFailed };
  }
}

export async function updateUser(
  uid: string,
  input: { name: string; role: string }
): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;
  const { dict } = check;

  if (!isRole(input.role)) {
    return { ok: false, error: dict.errors.users.invalidRole };
  }

  try {
    await adminDb.collection(COLLECTION).doc(uid).update({
      name: input.name,
      role: input.role,
    });
    await adminAuth.updateUser(uid, { displayName: input.name });

    return { ok: true, data: null };
  } catch {
    return { ok: false, error: dict.errors.users.updateFailed };
  }
}

export async function deleteUser(uid: string): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;
  const { dict } = check;

  if (uid === check.user.uid) {
    return { ok: false, error: dict.errors.users.cannotDeleteSelf };
  }

  try {
    await adminDb.collection(COLLECTION).doc(uid).delete();
    await adminAuth.deleteUser(uid);
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: dict.errors.users.deleteFailed };
  }
}
