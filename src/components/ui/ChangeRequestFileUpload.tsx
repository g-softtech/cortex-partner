"use client";

import { useState, useRef } from "react";

interface ChangeRequestFileUploadProps {
  projectId: string;
  changeRequestId: string;
  label: string;
  accept?: string;
  onUploaded?: (file: { id: string; originalName: string; fileType: string; fileSize: number }) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function ChangeRequestFileUpload({ projectId, changeRequestId, label, accept, onUploaded }: ChangeRequestFileUploadProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setErrorMessage(null);
    setProgress(10);

    // Client-side size validation
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("File exceeds the 10 MB limit.");
      setStatus("error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    try {
      // Step 1: Request a presigned URL from the server
      setProgress(20);
      const presignRes = await fetch("/api/files/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          changeRequestId,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Failed to get upload URL.");
      }

      const { uploadUrl, storageKey } = await presignRes.json();
      setProgress(40);

      // Step 2: Upload directly to R2 via the presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload to storage failed. Please try again.");
      }

      setProgress(75);

      // Step 3: Register the file record in the database
      const registerRes = await fetch(`/api/projects/${projectId}/changes/${changeRequestId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageKey,
          originalName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json();
        throw new Error(data.error || "Failed to register file.");
      }

      const { file: registeredFile } = await registerRes.json();
      setProgress(100);
      setStatus("done");
      onUploaded?.(registeredFile);

      // Reset input
      if (inputRef.current) inputRef.current.value = "";

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStatus("error");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          disabled={status === "uploading"}
          accept={accept}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-slate-50 file:text-slate-700
            hover:file:bg-slate-100
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
        {status === "uploading" && (
          <div className="absolute left-0 top-12 h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-slate-900 transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      {status === "done" && (
        <p className="text-sm text-green-600">File uploaded successfully.</p>
      )}
    </div>
  );
}
