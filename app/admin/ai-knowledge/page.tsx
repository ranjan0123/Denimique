"use client";

import { useEffect, useState } from "react";
import { FileText, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import {
  deleteChatKnowledgeFile,
  getChatKnowledgeFile,
  uploadChatKnowledgeFile,
  type ChatKnowledgeFile,
} from "@/lib/chat-knowledge";
import { getApiErrorMessage } from "@/lib/api";

export default function AiKnowledgePage() {
  const [knowledge, setKnowledge] = useState<ChatKnowledgeFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    getChatKnowledgeFile()
      .then(setKnowledge)
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to load AI knowledge file.")))
      .finally(() => setLoading(false));
  }, []);

  async function saveFile() {
    if (!selectedFile) {
      toast.error("Choose a CSV, JSON, or TXT file first.");
      return;
    }
    setSaving(true);
    try {
      await uploadChatKnowledgeFile(selectedFile);
      setKnowledge(await getChatKnowledgeFile());
      setSelectedFile(null);
      toast.success("File added to the chatbot's knowledge.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to upload this file."));
    } finally {
      setSaving(false);
    }
  }

  async function removeFile() {
    setRemoving(true);
    try {
      await deleteChatKnowledgeFile();
      setKnowledge(null);
      toast.success("Chatbot knowledge file removed.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to remove this file."));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-8">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1B2E27]">Chatbot</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">AI product knowledge</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Upload a product sheet or public store information so the assistant can answer with those details.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-base font-semibold text-slate-900">Knowledge file</h2>
        <p className="mt-1 text-sm text-slate-600">
          Supported files: CSV, JSON, or TXT. Maximum upload size is 2 MB and processed text is limited to 120,000 characters. Uploading a new file replaces the currently connected file.
        </p>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-[#1B2E27] hover:bg-[#1B2E27]/5">
          <UploadCloud size={27} className="text-[#1B2E27]" />
          <span className="mt-2 text-sm font-semibold text-slate-800">Choose a file to upload</span>
          <span className="mt-1 text-xs text-slate-500">For Excel, export the sheet as CSV first.</span>
          <input
            type="file"
            accept=".csv,.json,.txt,text/csv,application/json,text/plain"
            className="sr-only"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
        </label>

        {selectedFile && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
              <FileText size={16} className="shrink-0 text-[#1B2E27]" />
              <span className="truncate">{selectedFile.name}</span>
            </span>
            <button
              type="button"
              onClick={() => void saveFile()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B2E27] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving && <LoaderCircle size={15} className="animate-spin" />}
              {saving ? "Uploading…" : "Add to chatbot"}
            </button>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-[#1B2E27]/10 p-2 text-[#1B2E27]"><FileText size={18} /></span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Currently connected file</p>
                {loading ? (
                  <p className="mt-1 text-sm text-slate-500">Loading…</p>
                ) : knowledge ? (
                  <>
                    <p className="mt-1 break-all text-sm text-slate-700">{knowledge.fileName}</p>
                    {knowledge.updatedAt && (
                      <p className="mt-1 text-xs text-slate-500">Updated {new Date(knowledge.updatedAt).toLocaleString()}</p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">No extra file uploaded. Live store products are still available to the chatbot.</p>
                )}
              </div>
            </div>
            {knowledge && (
              <button
                type="button"
                onClick={() => void removeFile()}
                disabled={removing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {removing ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Remove
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-amber-800">
          Upload public product/store information only. This file is used in customer chat answers; do not upload customer details, passwords, or private business data. It adds chatbot knowledge only and does not publish products to the storefront.
        </p>
      </section>
    </div>
  );
}
