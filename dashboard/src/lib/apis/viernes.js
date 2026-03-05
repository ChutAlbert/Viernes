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

  ingest: (filename) => apiRequest("post", "/ingest", { filename }),
  ingestText: (payload) => apiRequest("post", "/ingest/text", payload),

  uploadDocument: (formData) => apiRequestDocs("post", "/documents/upload", formData),
  listDocuments: () => apiRequest("get", "/documents"),
  previewDocument: (filename) => apiRequest("get", `/documents/${encodeURIComponent(filename)}/preview`),
  deleteDocument: (filename) => apiRequestDelete(`/documents/${encodeURIComponent(filename)}`),
};