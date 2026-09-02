"use server";

import { randomUUID } from "crypto";

import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ActionResult } from "@/lib/types";

const COLLECTION = "documents";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

export type TDocument = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string;
  uploadedByUid: string;
  uploadedByEmail: string;
  uploadedAt: string;
};

async function requireAuth() {
  const dict = await getDictionary();
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: dict.errors.notAuthenticated };
  return { ok: true as const, user, dict };
}

export async function listDocuments(): Promise<ActionResult<TDocument[]>> {
  const check = await requireAuth();
  if (!check.ok) return check;
  const { dict } = check;

  try {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .orderBy("uploadedAt", "desc")
      .limit(100)
      .get();

    const documents = snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() }) as TDocument
    );

    return { ok: true, data: documents };
  } catch {
    return { ok: false, error: dict.errors.documents.listFailed };
  }
}

export async function uploadDocument(
  formData: FormData
): Promise<ActionResult<TDocument>> {
  const check = await requireAuth();
  if (!check.ok) return check;
  const { user, dict } = check;

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: dict.errors.documents.noFileSelected };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: dict.errors.documents.fileTooLarge };
  }

  const storagePath = `documents/${user.uid}/${randomUUID()}-${file.name}`;
  const contentType = file.type || "application/octet-stream";

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    await adminStorage.bucket().file(storagePath).save(buffer, {
      contentType,
    });

    const uploadedAt = new Date().toISOString();

    const docRef = await adminDb.collection(COLLECTION).add({
      fileName: file.name,
      contentType,
      size: file.size,
      storagePath,
      uploadedByUid: user.uid,
      uploadedByEmail: user.email ?? "",
      uploadedAt,
    });

    return {
      ok: true,
      data: {
        id: docRef.id,
        fileName: file.name,
        contentType,
        size: file.size,
        storagePath,
        uploadedByUid: user.uid,
        uploadedByEmail: user.email ?? "",
        uploadedAt,
      },
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { ok: false, error: dict.errors.documents.uploadFailed };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  const check = await requireAuth();
  if (!check.ok) return check;
  const { dict } = check;

  try {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists)
      return { ok: false, error: dict.errors.documents.notFound };

    const { storagePath } = doc.data() as TDocument;
    await adminStorage
      .bucket()
      .file(storagePath)
      .delete({ ignoreNotFound: true });
    await docRef.delete();

    return { ok: true, data: null };
  } catch {
    return { ok: false, error: dict.errors.documents.deleteFailed };
  }
}

export async function getDocumentDownloadUrl(
  id: string
): Promise<ActionResult<{ url: string }>> {
  const check = await requireAuth();
  if (!check.ok) return check;
  const { dict } = check;

  try {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists)
      return { ok: false, error: dict.errors.documents.notFound };

    const { storagePath } = doc.data() as TDocument;
    const [url] = await adminStorage
      .bucket()
      .file(storagePath)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + SIGNED_URL_TTL_MS,
      });

    return { ok: true, data: { url } };
  } catch (error) {
    console.error("Error generating download link:", error);
    return { ok: false, error: dict.errors.documents.downloadUrlFailed };
  }
}
