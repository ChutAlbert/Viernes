import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Surface,
  Button,
  FileInput,
  SearchSelect,
  Textarea,
  Input,
  Spinner,
  DocRow,
  PreviewPane,
  ConfirmModal,
} from "@viernes/ui";
import { viernesApi } from "@apis/viernes";

const NAMESPACE_OPTIONS = [
  { value: "notes",  label: "notes" },
  { value: "docs",   label: "docs" },
  { value: "memory", label: "memory" },
];

export default function Documents() {
  // upload
  const [files, setFiles] = useState([]);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ loading: false, msg: "" });

  // lista
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // preview
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // delete
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // nota
  const [namespace, setNamespace] = useState("notes");
  const [docId, setDocId] = useState(() => `note-${Date.now()}`);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [textStatus, setTextStatus] = useState({ loading: false, msg: "" });

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return docs;
    return docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [docs, search]);

  const fetchDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await viernesApi.listDocuments();
      setDocs(res.files ?? []);
    } catch (e) { console.error(e); }
    finally { setDocsLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function handleSelect(doc) {
    if (selectedDoc?.name === doc.name) { setSelectedDoc(null); setPreview(null); return; }
    setSelectedDoc(doc); setPreview(null); setPreviewLoading(true);
    try {
      const res = await viernesApi.previewDocument(doc.name);
      setPreview(res);
    } catch (e) {
      setPreview({ preview: `Error: ${e.message}`, truncated: false });
    } finally { setPreviewLoading(false); }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleteLoading(true); setDeleting(confirmDelete);
    try {
      await viernesApi.deleteDocument(confirmDelete);
      if (selectedDoc?.name === confirmDelete) { setSelectedDoc(null); setPreview(null); }
      await fetchDocs();
    } catch (e) { console.error(e); }
    finally { setDeleteLoading(false); setDeleting(null); setConfirmDelete(null); }
  }

  async function handleUpload() {
    if (!files[0]) return;
    setUploadStatus({ loading: true, msg: "" });
    try {
      const form = new FormData();
      form.append("file", files[0]);
      const res = await viernesApi.uploadDocument(form);
      setUploadedFilename(res.filename);
      setUploadStatus({ loading: false, msg: `✅ Subido: ${res.filename}` });
      await fetchDocs();
    } catch (e) { setUploadStatus({ loading: false, msg: `❌ ${e.message}` }); }
  }

  async function handleIngest() {
    if (!uploadedFilename) return;
    setUploadStatus({ loading: true, msg: "" });
    try {
      const res = await viernesApi.ingest(uploadedFilename);
      setUploadStatus({ loading: false, msg: `✅ Indexado: ${res.chunks_indexed} chunks` });
    } catch (e) { setUploadStatus({ loading: false, msg: `❌ ${e.message}` }); }
  }

  const canIngestText = useMemo(() => docId.trim() && text.trim(), [docId, text]);

  async function handleIngestText() {
    if (!canIngestText) return;
    setTextStatus({ loading: true, msg: "" });
    try {
      const res = await viernesApi.ingestText({ doc_id: docId.trim(), text, namespace, title: title.trim() || null });
      setTextStatus({ loading: false, msg: `✅ ${res.chunks_indexed} chunks indexados` });
      setDocId(`note-${Date.now()}`); setText(""); setTitle("");
    } catch (e) { setTextStatus({ loading: false, msg: `❌ ${e.message}` }); }
  }

  return (
    <div className="h-full w-full p-4 flex flex-col gap-4 min-h-0">

      <ConfirmModal
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="¿Eliminar documento?"
        confirmText="Eliminar"
        variant="danger"
        description={
          confirmDelete && (
            <span>
              Se borrará <span className="font-medium break-all" style={{ color: "var(--c-text)" }}>{confirmDelete}</span> del
              disco y todos sus chunks del vectordb. Esta acción no se puede deshacer.
            </span>
          )
        }
      />

      {/* fila superior */}
      <div className="grid grid-cols-12 gap-4 shrink-0">

        {/* Upload */}
        <div className="col-span-12 lg:col-span-6">
          <Surface className="p-4 h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Subir documento</p>
              <span className="text-xs" style={{ color: "var(--c-text-3)" }}>PDF · TXT · MD · DOCX</span>
            </div>

            <FileInput
              variant="dark"
              accept=".pdf,.txt,.md,.docx"
              maxBytes={25 * 1024 * 1024}
              size="sm"
              onChange={(fs) => {
                setFiles(fs);
                setUploadedFilename(null);
                setUploadStatus({ loading: false, msg: "" });
              }}
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                text="Subir"
                loadingText="Subiendo…"
                loading={uploadStatus.loading && !uploadedFilename}
                disabled={!files[0] || uploadStatus.loading}
                onClick={handleUpload}
                className="bg-[var(--c-hover)] border border-[var(--c-border-med)] text-[var(--c-text)] text-sm py-2"
              />
              <Button
                text="Indexar"
                loadingText="Indexando…"
                loading={uploadStatus.loading && !!uploadedFilename}
                disabled={!uploadedFilename || uploadStatus.loading}
                onClick={handleIngest}
                className="bg-[var(--c-hover)] border border-[var(--c-border-med)] text-[var(--c-text)] text-sm py-2"
              />
            </div>

            {uploadStatus.msg && <p className="text-xs" style={{ color: "var(--c-text-2)" }}>{uploadStatus.msg}</p>}
          </Surface>
        </div>

        {/* Notas */}
        <div className="col-span-12 lg:col-span-6">
          <Surface className="p-4 h-full flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Notas</p>
              <span className="text-xs" style={{ color: "var(--c-text-3)" }}>/ingest/text</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* ← SearchSelect en lugar de Select nativo */}
              <SearchSelect
                label="Namespace"
                variant="dark"
                options={NAMESPACE_OPTIONS}
                value={namespace}
                onChange={setNamespace}
              />
              <Input
                label="Doc ID"
                variant="dark"
                value={docId}
                onChange={setDocId}
                placeholder="note-123"
              />
            </div>

            <Input
              label="Título (opcional)"
              variant="dark"
              value={title}
              onChange={setTitle}
              placeholder="Mi nota sobre X"
            />

            <Textarea
              label="Texto"
              variant="dark"
              value={text}
              onChange={setText}
              placeholder="Pega aquí tus notas..."
              rows={3}
            />

            <Button
              text="Guardar e indexar nota"
              loadingText="Indexando…"
              loading={textStatus.loading}
              disabled={!canIngestText}
              onClick={handleIngestText}
              className="bg-[var(--c-hover)] border border-[var(--c-border-med)] text-[var(--c-text)] text-sm py-2 mt-1"
            />

            {textStatus.msg && <p className="text-xs" style={{ color: "var(--c-text-2)" }}>{textStatus.msg}</p>}
          </Surface>
        </div>
      </div>

      {/* fila inferior: lista + preview */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">

        {/* Lista */}
        <div className="col-span-12 lg:col-span-4 min-h-0 flex flex-col">
          <Surface className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--c-text-3)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--c-text-2)" }}
                placeholder="Buscar…"
              />
              <button onClick={fetchDocs} title="Recargar"
                className="transition p-1 rounded-lg"
                style={{ color: "var(--c-text-3)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--c-text-2)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-3)"}>
                {docsLoading
                  ? <Spinner size="sm" />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                }
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-2 space-y-0.5">
              {docsLoading && docs.length === 0 && (
                <div className="flex items-center justify-center py-10 gap-2 text-sm" style={{ color: "var(--c-text-3)" }}>
                  <Spinner /> Cargando…
                </div>
              )}
              {!docsLoading && filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: "var(--c-text-4)" }}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <p className="text-xs">{search ? "Sin resultados" : "No hay documentos aún"}</p>
                </div>
              )}
              {filteredDocs.map((doc) => (
                <DocRow
                  key={doc.name}
                  doc={doc}
                  isSelected={selectedDoc?.name === doc.name}
                  onSelect={handleSelect}
                  onDelete={(name) => setConfirmDelete(name)}
                  deleting={deleting === doc.name}
                />
              ))}
            </div>

            <div className="shrink-0 px-3 py-2 text-xs" style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text-4)" }}>
              {filteredDocs.length} documento{filteredDocs.length !== 1 ? "s" : ""}
            </div>
          </Surface>
        </div>

        {/* Preview */}
        <div className="col-span-12 lg:col-span-8 min-h-0">
          <Surface className="h-full p-4 overflow-hidden flex flex-col">
            <PreviewPane doc={selectedDoc} preview={preview} loading={previewLoading} />
          </Surface>
        </div>
      </div>
    </div>
  );
}
