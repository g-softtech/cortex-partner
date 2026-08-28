"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  projectId: string;
  category: "LOGO" | "IMAGE" | "DOCUMENT" | "BRAND_GUIDELINES" | "OTHER";
  label: string;
  accept?: string;
  onUploaded?: (file: { id: string; originalName: string; fileType: string; fileSize: number }) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function FileUpload({ projectId, category, label, accept, onUploaded }: FileUploadProps) {
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

    // Client-side size validation (server also validates)
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
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          category,
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
      const registerRes = await fetch(`/api/projects/${projectId}/kickoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          storageKey,
          originalName: file.name,
          contentType: file.type,
          fileSize: file.size,
          category,
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
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
      setStatus("error");
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors
          ${status === "error" ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"}
          ${status === "done" ? "border-green-300 bg-green-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={status === "uploading"}
        />
        {status === "idle" && (
          <>
            <svg className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">Max 10 MB</p>
          </>
        )}
        {status === "uploading" && (
          <div className="w-full">
            <p className="text-sm text-slate-600 mb-2">Uploading… {progress}%</p>
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {status === "done" && (
          <p className="text-sm font-medium text-green-700">✓ Upload complete</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
