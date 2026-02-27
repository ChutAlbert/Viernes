import { apiRequest } from "./client";

export const viernesApi = {
  health: () => apiRequest("get", "/health"),

  // sessions
  listSessions: () => apiRequest("get", "/chat/sessions"),
  createSession: () => apiRequest("post", "/chat/sessions"),
  getMessages: (sessionId) => apiRequest("get", `/chat/sessions/${sessionId}/messages`),
  renameSession: (id, title) => apiRequest("patch", `/chat/sessions/${id}`, { title }),

  // chat
  chat: (payload) => apiRequest("post", "/chat", payload),

  ingest: (filename) => apiRequest("post", "/ingest", { filename }),

};