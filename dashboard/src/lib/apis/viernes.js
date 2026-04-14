import { apiRequest, apiRequestRaw, apiRequestDocs, apiRequestDelete } from "./client";

export const viernesApi = {
  health: () => apiRequest("get", "/health"),

  // sessions
  listSessions: () => apiRequest("get", "/chat/sessions"),
  createSession: () => apiRequest("post", "/chat/sessions"),
  getMessages: (sessionId) => apiRequest("get", `/chat/sessions/${sessionId}/messages`),
  renameSession: (id, title) => apiRequest("patch", `/chat/sessions/${id}`, { title }),

  // chat normal
  chat: (payload) => apiRequest("post", "/chat", payload),

  // ✅ stream SSE
  chatStream: (payload) => apiRequestRaw("post", "/chat/stream", payload),

  // gmail
  gmailStatus: () => apiRequest("get", "/gmail/status"),
  gmailInbox: (limit = 15) => apiRequest("get", "/gmail/inbox", { limit }),
  gmailEmail: (id) => apiRequest("get", `/gmail/email/${id}`),
  gmailSearch: (q, limit = 15) => apiRequest("get", "/gmail/search", { q, limit }),
  gmailMarkRead: (id) => apiRequest("post", `/gmail/mark-read/${id}`),
  gmailSend: (payload) => apiRequest("post", "/gmail/send", payload),

  ingest: (filename) => apiRequest("post", "/ingest", { filename }),
  ingestText: (payload) => apiRequest("post", "/ingest/text", payload),

  uploadDocument: (formData) => apiRequestDocs("post", "/documents/upload", formData),
  listDocuments: () => apiRequest("get", "/documents"),
  previewDocument: (filename) => apiRequest("get", `/documents/${encodeURIComponent(filename)}/preview`),
  deleteDocument: (filename) => apiRequestDelete(`/documents/${encodeURIComponent(filename)}`),

  // piezas
  listPiezas: () => apiRequest("get", "/piezas"),
  getPieza: (id) => apiRequest("get", `/piezas/${id}`),
  createPieza: (payload) => apiRequest("post", "/piezas", payload),
  updatePieza: (id, payload) => apiRequest("put", `/piezas/${id}`, payload),
  deletePieza: (id) => apiRequestDelete(`/piezas/${id}`),
  syncPiezaSodigic: (id) => apiRequest("post", `/piezas/${id}/sync-sodigic`),
  uploadImagen: (formData) => apiRequestDocs("post", "/images/upload", formData),
  uploadArchivo3D: (formData) => apiRequestDocs("post", "/files/upload", formData),

  // visitas al sitio web
  visitStats: () => apiRequest("get", "/api/visits/stats"),
};