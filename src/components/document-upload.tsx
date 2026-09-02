"use client";

import { useRef, useTransition } from "react";

import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { useDictionary } from "@/hooks/use-dictionary";
import { uploadDocument, type TDocument } from "@/server/documents-actions";

export function DocumentUpload({
  onUploaded,
}: {
  onUploaded: (document: TDocument) => void;
}) {
  const t = useDictionary();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadDocument(formData);
      if (result.ok) {
        toast.success(t.documents.uploaded(result.data.fileName));
        onUploaded(result.data);
      } else {
        toast.error(result.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  return (
    <Input
      ref={inputRef}
      type="file"
      onChange={handleChange}
      disabled={isPending}
      className="max-w-xs"
    />
  );
}
