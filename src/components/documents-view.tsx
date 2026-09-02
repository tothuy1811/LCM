"use client";

import { useState } from "react";

import { toast } from "sonner";

import { DataTable } from "@/components/ui/data-table/data-table";
import { DocumentUpload } from "@/components/document-upload";
import { createDocumentsColumns } from "@/components/documents-columns";
import { useDictionary } from "@/hooks/use-dictionary";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  type TDocument,
} from "@/server/documents-actions";

export function DocumentsView({
  initialDocuments,
}: {
  initialDocuments: TDocument[];
}) {
  const t = useDictionary();
  const [documents, setDocuments] = useState(initialDocuments);

  const handleDownload = async (id: string) => {
    const result = await getDocumentDownloadUrl(id);
    if (result.ok) {
      window.open(result.data.url, "_blank");
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = documents;
    setDocuments(docs => docs.filter(doc => doc.id !== id));

    const result = await deleteDocument(id);
    if (!result.ok) {
      setDocuments(previous);
      toast.error(result.error);
    } else {
      toast.success(t.documents.deleted);
    }
  };

  const columns = createDocumentsColumns({
    t,
    onDownload: handleDownload,
    onDelete: handleDelete,
  });

  return (
    <div className="flex flex-col gap-4">
      <DocumentUpload
        onUploaded={doc => setDocuments(docs => [doc, ...docs])}
      />
      <DataTable
        data={documents}
        columns={columns}
        emptyMessage={t.documents.empty}
        enableColumnVisibility={false}
      />
    </div>
  );
}
