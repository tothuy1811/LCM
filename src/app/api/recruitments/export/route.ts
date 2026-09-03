import JSZip from "jszip";

import { adminStorage } from "@/lib/firebase/admin";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  buildRecruitmentsWorkbook,
  sanitizeFilename,
  uniqueName,
} from "@/lib/recruitment-export";
import { getRecruitmentSubmissionsByIds } from "@/server/recruitment-actions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : [];
  if (ids.length === 0) {
    return new Response("Invalid request", { status: 400 });
  }

  const result = await getRecruitmentSubmissionsByIds(ids);
  if (!result.ok) {
    return new Response(result.error, { status: 403 });
  }

  const dict = await getDictionary();
  if (result.data.length === 0) {
    return new Response(dict.errors.recruitment.exportFailed, {
      status: 404,
    });
  }

  const zip = new JSZip();

  const excelBuffer = await buildRecruitmentsWorkbook(result.data, dict);
  zip.file("danh-sach-ung-vien.xlsx", excelBuffer);

  const attachmentsRoot = zip.folder("dinh-kem");
  for (const submission of result.data) {
    if (!submission.attachments?.length) continue;

    const candidateFolder = attachmentsRoot?.folder(
      `${sanitizeFilename(submission.fullName)}-${submission.id.slice(0, 8)}`
    );
    const usedNames = new Set<string>();
    for (const attachment of submission.attachments) {
      try {
        const [buffer] = await adminStorage
          .bucket()
          .file(attachment.storagePath)
          .download();
        candidateFolder?.file(
          uniqueName(attachment.fileName, usedNames),
          buffer
        );
      } catch {
        // Skip attachments that fail to download; the rest still succeed.
      }
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `danh-sach-ung-vien-${result.data.length}-${timestamp}.zip`;

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
