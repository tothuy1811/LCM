import JSZip from "jszip";

import { adminStorage } from "@/lib/firebase/admin";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  buildRecruitmentWorkbook,
  sanitizeFilename,
  uniqueName,
} from "@/lib/recruitment-export";
import { getRecruitmentSubmission } from "@/server/recruitment-actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getRecruitmentSubmission(id);
  if (!result.ok) {
    return new Response(result.error, { status: 403 });
  }
  const submission = result.data;

  const dict = await getDictionary();
  const zip = new JSZip();

  const excelBuffer = await buildRecruitmentWorkbook(submission, dict);
  zip.file("cau-tra-loi.xlsx", excelBuffer);

  const attachmentsFolder = zip.folder("dinh-kem");
  const usedNames = new Set<string>();
  for (const attachment of submission.attachments ?? []) {
    try {
      const [buffer] = await adminStorage
        .bucket()
        .file(attachment.storagePath)
        .download();
      attachmentsFolder?.file(
        uniqueName(attachment.fileName, usedNames),
        buffer
      );
    } catch {
      // Skip attachments that fail to download; the rest still succeed.
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const filename = `${sanitizeFilename(submission.fullName)}-${submission.id.slice(0, 8)}.zip`;

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
