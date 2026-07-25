import { apiRequest, apiRequestRaw, apiRequestDocs, apiRequestDelete, API_BASE_URL } from "./client";

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

  // voz-a-voz: envía audio, recibe { transcript, reply, session_id, audio_b64 }
  chatVoice: (audioBlob, sessionId, memoryMode = "auto") => {
    const fd = new FormData();
    fd.append("audio", audioBlob, "recording.webm");
    if (sessionId) fd.append("session_id", sessionId);
    fd.append("memory_mode", memoryMode);
    return apiRequestDocs("post", "/chat/voice", fd);
  },

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
  unsyncPiezaSodigic: (id) => apiRequest("post", `/piezas/${id}/unsync-sodigic`),
  uploadImagen: (formData) => apiRequestDocs("post", "/images/upload", formData),
  uploadArchivo3D: (formData) => apiRequestDocs("post", "/files/upload", formData),

  // visitas al sitio web
  visitStats: () => apiRequest("get", "/api/visits/stats"),
  clearVisits: () => apiRequest("delete", "/api/visits"),

  // catálogo 3D — filamentos (material + color unificados)
  listFilamentos: () => apiRequest("get", "/catalogo/filamentos"),
  createFilamento: (payload) => apiRequest("post", "/catalogo/filamentos", payload),
  updateFilamento: (id, payload) => apiRequest("put", `/catalogo/filamentos/${id}`, payload),
  deleteFilamento: (id) => apiRequestDelete(`/catalogo/filamentos/${id}`),
  asignarFilamentoTodos: (id) => apiRequest("post", `/catalogo/filamentos/${id}/asignar-todos`),
  desasignarFilamentoTodos: (id) => apiRequest("post", `/catalogo/filamentos/${id}/desasignar-todos`),

  // catálogo 3D — productos
  listProductosCatalogo: () => apiRequest("get", "/catalogo/productos"),
  getProductoCatalogo: (id) => apiRequest("get", `/catalogo/productos/${id}`),
  createProductoCatalogo: (payload) => apiRequest("post", "/catalogo/productos", payload),
  updateProductoCatalogo: (id, payload) => apiRequest("put", `/catalogo/productos/${id}`, payload),
  deleteProductoCatalogo: (id) => apiRequestDelete(`/catalogo/productos/${id}`),

  // galería de imágenes de producto
  listImagenesProducto: (id) => apiRequest("get", `/catalogo/productos/${id}/imagenes`),
  addImagenProducto: (id, payload) => apiRequest("post", `/catalogo/productos/${id}/imagenes`, payload),
  deleteImagenProducto: (productoId, imagenId) => apiRequestDelete(`/catalogo/productos/${productoId}/imagenes/${imagenId}`),

  // redes sociales
  listRedes: () => apiRequest("get", "/redes"),
  createRed: (payload) => apiRequest("post", "/redes", payload),
  updateRed: (id, payload) => apiRequest("put", `/redes/${id}`, payload),
  deleteRed: (id) => apiRequestDelete(`/redes/${id}`),

  // inventario
  listInventarioItems: () => apiRequest("get", "/inventario/items"),
  createInventarioItem: (payload) => apiRequest("post", "/inventario/items", payload),
  updateInventarioItem: (id, payload) => apiRequest("put", `/inventario/items/${id}`, payload),
  deleteInventarioItem: (id) => apiRequestDelete(`/inventario/items/${id}`),
  listInventarioCompras: () => apiRequest("get", "/inventario/compras"),
  createInventarioCompra: (payload) => apiRequest("post", "/inventario/compras", payload),
  deleteInventarioCompra: (id) => apiRequestDelete(`/inventario/compras/${id}`),
  getInventarioResumen: () => apiRequest("get", "/inventario/resumen"),
  getInventarioAlertas: () => apiRequest("get", "/inventario/alertas"),

  // notes
  listNotes: () => apiRequest("get", "/notes"),
  createNote: (payload) => apiRequest("post", "/notes", payload),
  updateNote: (id, payload) => apiRequest("put", `/notes/${id}`, payload),
  deleteNote: (id) => apiRequestDelete(`/notes/${id}`),
  uploadNoteAttachment: (id, formData) => apiRequestDocs("post", `/notes/${id}/attachments`, formData),
  deleteNoteAttachment: (id, filename) => apiRequestDelete(`/notes/${id}/attachments/${encodeURIComponent(filename)}`),

  // vault (E2E password manager)
  vaultConfig: () => apiRequest("get", "/vault/config"),
  initVault: () => apiRequest("post", "/vault/config"),
  listVaultEntries: () => apiRequest("get", "/vault/entries"),
  createVaultEntry: (payload) => apiRequest("post", "/vault/entries", payload),
  updateVaultEntry: (id, payload) => apiRequest("put", `/vault/entries/${id}`, payload),
  deleteVaultEntry: (id) => apiRequestDelete(`/vault/entries/${id}`),

  // locations (admin only)
  listLocations: () => apiRequest("get", "/locations"),
  updateLocation: (deviceId, payload) => apiRequest("put", `/locations/${deviceId}`, payload),
  requestLocationUpdate: (deviceId) => apiRequest("post", `/locations/${deviceId}/request-update`),
  deleteLocation: (deviceId) => apiRequestDelete(`/locations/${deviceId}`),

  // users (admin only)
  listUsers: () => apiRequest("get", "/users"),
  createUser: (payload) => apiRequest("post", "/users", payload),
  updateUser: (id, payload) => apiRequest("put", `/users/${id}`, payload),
  deleteUser: (id) => apiRequestDelete(`/users/${id}`),

  // tasks + voice notes
  listTasks: () => apiRequest("get", "/tasks"),
  pendingTasks: () => apiRequest("get", "/tasks/pending"),
  createTask: (payload) => apiRequest("post", "/tasks", payload),
  updateTask: (id, payload) => apiRequest("put", `/tasks/${id}`, payload),
  toggleTaskComplete: (id) => apiRequest("patch", `/tasks/${id}/complete`),
  deleteTask: (id) => apiRequestDelete(`/tasks/${id}`),
  uploadTaskAudio: (id, formData) => apiRequestDocs("post", `/tasks/${id}/audio`, formData),

  // spotify
  spotifyStatus:    ()                              => apiRequest("get", "/spotify/status"),
  spotifyAuth:      ()                              => apiRequest("get", "/spotify/auth"),
  spotifyNowPlaying:()                              => apiRequest("get", "/spotify/now-playing"),
  spotifyRecent:    (limit = 10)                    => apiRequest("get", "/spotify/recent", { limit }),
  spotifyTopTracks: (limit = 20, time_range = "short_term") => apiRequest("get", "/spotify/top-tracks", { limit, time_range }),

  // gallery / visitas (super_admin only, E2E encrypted)
  galleryConfig: () => apiRequest("get", "/gallery/config"),
  gallerySetup: (payload) => apiRequest("post", "/gallery/setup", payload),
  galleryVerify: (payload) => apiRequest("post", "/gallery/verify", payload),
  galleryList: (params = {}) => apiRequest("get", "/gallery", params),
  galleryTags: () => apiRequest("get", "/gallery/tags"),
  galleryUpload: (formData) => apiRequestDocs("post", "/gallery", formData),
  galleryUpdate: (id, payload) => apiRequest("put", `/gallery/${id}`, payload),
  galleryDelete: (id) => apiRequestDelete(`/gallery/${id}`),
  galleryFile: (id) => {
    const token = localStorage.getItem("viernes_token");
    return fetch(`${API_BASE_URL}/gallery/${id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};