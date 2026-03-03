import { useMemo, useState } from "react";
import { viernesApi } from "@apis/viernes";

export default function Documents() {
  const [file, setFile] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);

  const [uploadStatus, setUploadStatus] = useState({ loading: false, msg: "" });

  // notas
  const [namespace, setNamespace] = useState("notes");
  const [docId, setDocId] = useState(() => `note-${Date.now()}`);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [textStatus, setTextStatus] = useState({ loading: false, msg: "" });

  const canUploadFile = useMemo(() => !!file, [file]);
  const canIngestUploaded = useMemo(() => !!uploadedFilename, [uploadedFilename]);

  const canIngestText = useMemo(() => docId.trim() && text.trim(), [docId, text]);

  async function handleUploadFile() {
    if (!file) return;

    setUploadStatus({ loading: true, msg: "" });
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await viernesApi.uploadDocument(form); // <- multipart
      setUploadedFilename(res.filename);

      setUploadStatus({
        loading: false,
        msg: `✅ Subido: ${res.filename} (${res.bytes} bytes)`,
      });
    } catch (e) {
      setUploadStatus({
        loading: false,
        msg: `❌ Error upload: ${e.message}`,
      });
    }
  }

  async function handleIngestUploadedFile() {
    if (!uploadedFilename) return;

    setUploadStatus({ loading: true, msg: "" });
    try {
      const res = await viernesApi.ingest(uploadedFilename);
      setUploadStatus({
        loading: false,
        msg: `✅ Indexado: ${res.chunks_indexed} chunks (${res.file})`,
      });
    } catch (e) {
      setUploadStatus({
        loading: false,
        msg: `❌ Error ingest: ${e.message}`,
      });
    }
  }

  async function handleIngestText() {
    if (!canIngestText) return;

    setTextStatus({ loading: true, msg: "" });
    try {
      const res = await viernesApi.ingestText({
        doc_id: docId.trim(),
        text,
        namespace,
        title: title.trim() || null,
      });
      setTextStatus({
        loading: false,
        msg: `✅ Nota indexada: ${res.chunks_indexed} chunks`,
      });
    } catch (e) {
      setTextStatus({
        loading: false,
        msg: `❌ Error: ${e.message}`,
      });
    }
  }


  return (
    <div className="h-full w-full p-6">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Upload */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/90">Subir documento</h2>
              <span className="text-xs text-white/50">PDF/TXT/MD/DOCX</span>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center hover:bg-white/7">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setUploadedFilename(null); // reset si eliges otro
                  setUploadStatus({ loading: false, msg: "" });
                }}
              />
              <p className="text-sm text-white/80">
                {file ? `📄 ${file.name}` : "Arrastra o selecciona un archivo"}
              </p>
              {uploadedFilename && (
                <p className="mt-1 text-xs text-white/60">Subido como: {uploadedFilename}</p>
              )}
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={handleUploadFile}
                disabled={!canUploadFile || uploadStatus.loading}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 disabled:opacity-40"
              >
                {uploadStatus.loading ? "..." : "Subir"}
              </button>

              <button
                onClick={handleIngestUploadedFile}
                disabled={!canIngestUploaded || uploadStatus.loading}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 disabled:opacity-40"
              >
                {uploadStatus.loading ? "..." : "Indexar"}
              </button>
            </div>

            {uploadStatus.msg && <p className="mt-3 text-xs text-white/70">{uploadStatus.msg}</p>}
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/90">Notas</h2>
              <span className="text-xs text-white/50">/ingest/text</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6">
                  <label className="text-xs text-white/60">Namespace</label>
                  <select
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none"
                  >
                    <option value="notes">notes</option>
                    <option value="docs">docs</option>
                    <option value="memory">memory</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="text-xs text-white/60">Doc ID</label>
                  <input
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none"
                    placeholder="note-123"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60">
                  Título (opcional)
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none"
                  placeholder="Mi nota sobre X"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">Texto</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mt-1 h-40 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none"
                  placeholder="Pega aquí tus notas..."
                />
              </div>

              <button
                onClick={handleIngestText}
                disabled={!canIngestText || textStatus.loading}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 disabled:opacity-40"
              >
                {textStatus.loading ? "Indexando..." : "Guardar e indexar nota"}
              </button>

              {textStatus.msg && (
                <p className="text-xs text-white/70">{textStatus.msg}</p>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className="col-span-12 lg:col-span-8">
          <div className="h-[calc(100vh-170px)] rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/90">Documents</h2>
              <span className="text-xs text-white/50">Vista / Preview</span>
            </div>

            <div className="h-full rounded-xl border border-white/10 bg-black/10 p-4">
              <p className="text-sm text-white/70">Aquí puedes mostrar:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-white/60">
                <li>
                  Lista de archivos del servidor (cuando tengamos endpoint).
                </li>
                <li>Preview del texto extraído.</li>
                <li>Metadatos: namespace, title, chunks, etc.</li>
              </ul>
              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Tip: primero te recomiendo habilitar upload + listar documentos
                en backend (abajo te lo dejo).
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
