import { apiRequest, apiRequestDelete, apiRequestDocs } from './client';

export const viernesApi = {
  health: () => apiRequest('get', '/health'),

  // auth
  login: (email, password) => apiRequest('post', '/auth/login', { email, password }),
  me:    () => apiRequest('get', '/auth/me'),

  // chat
  listSessions:   ()            => apiRequest('get', '/chat/sessions'),
  createSession:  ()            => apiRequest('post', '/chat/sessions'),
  getMessages:    (id)          => apiRequest('get', `/chat/sessions/${id}/messages`),
  renameSession:  (id, title)   => apiRequest('patch', `/chat/sessions/${id}`, { title }),
  deleteSession:  (id)          => apiRequestDelete(`/chat/sessions/${id}`),
  sendMessage:    (payload)     => apiRequest('post', '/chat', payload),

  // gmail
  gmailStatus:   ()             => apiRequest('get', '/gmail/status'),
  gmailInbox:    (limit = 20)   => apiRequest('get', '/gmail/inbox', { limit }),
  gmailEmail:    (id)           => apiRequest('get', `/gmail/email/${id}`),
  gmailSearch:   (q, limit=20)  => apiRequest('get', '/gmail/search', { q, limit }),
  gmailMarkRead: (id)           => apiRequest('post', `/gmail/mark-read/${id}`),
  gmailSend:     (payload)      => apiRequest('post', '/gmail/send', payload),

  // documents
  listDocuments:    ()          => apiRequest('get', '/documents'),
  uploadDocument:   (form)      => apiRequestDocs('post', '/documents/upload', form),
  deleteDocument:   (filename)  => apiRequestDelete(`/documents/${encodeURIComponent(filename)}`),

  // tasks
  listTasks:          ()        => apiRequest('get', '/tasks'),
  pendingTasks:       ()        => apiRequest('get', '/tasks/pending'),
  createTask:         (p)       => apiRequest('post', '/tasks', p),
  updateTask:         (id, p)   => apiRequest('put', `/tasks/${id}`, p),
  toggleTaskComplete: (id)      => apiRequest('patch', `/tasks/${id}/complete`),
  deleteTask:         (id)      => apiRequestDelete(`/tasks/${id}`),
  uploadTaskAudio:    (id, fd)  => apiRequestDocs('post', `/tasks/${id}/audio`, fd),

  // notes
  listNotes:   ()               => apiRequest('get', '/notes'),
  createNote:  (p)              => apiRequest('post', '/notes', p),
  updateNote:  (id, p)          => apiRequest('put', `/notes/${id}`, p),
  deleteNote:  (id)             => apiRequestDelete(`/notes/${id}`),

  // visits
  visitStats:  ()               => apiRequest('get', '/api/visits/stats'),
  clearVisits: ()               => apiRequest('delete', '/api/visits'),

  // inventario
  listInventarioItems:   ()     => apiRequest('get', '/inventario/items'),
  createInventarioItem:  (p)    => apiRequest('post', '/inventario/items', p),
  updateInventarioItem:  (id,p) => apiRequest('put', `/inventario/items/${id}`, p),
  deleteInventarioItem:  (id)   => apiRequestDelete(`/inventario/items/${id}`),
  getInventarioAlertas:  ()     => apiRequest('get', '/inventario/alertas'),
  listInventarioCompras: ()     => apiRequest('get', '/inventario/compras'),
  createInventarioCompra:(p)    => apiRequest('post', '/inventario/compras', p),
  deleteInventarioCompra:(id)   => apiRequestDelete(`/inventario/compras/${id}`),

  // piezas — desde la fusion viven en catalogo_productos, no en /piezas
  listPiezas:  ()               => apiRequest('get', '/catalogo/productos'),
  getPieza:    (id)             => apiRequest('get', `/catalogo/productos/${id}`),
  createPieza: (p)              => apiRequest('post', '/catalogo/productos', p),
  updatePieza: (id, p)          => apiRequest('put', `/catalogo/productos/${id}`, p),
  deletePieza: (id)             => apiRequestDelete(`/catalogo/productos/${id}`),

  // filamentos (material + color unificados)
  listFilamentos:  ()           => apiRequest('get', '/catalogo/filamentos'),
  createFilamento: (p)          => apiRequest('post', '/catalogo/filamentos', p),
  updateFilamento: (id, p)      => apiRequest('put', `/catalogo/filamentos/${id}`, p),
  deleteFilamento: (id)         => apiRequestDelete(`/catalogo/filamentos/${id}`),

  // website (servicios)
  listServicios: ()             => apiRequest('get', '/website/services'),

  // contactos y redes: una sola tabla, marcada con es_contacto / es_red
  listContactos:   ()           => apiRequest('get', '/website/admin/contacts'),
  createContacto:  (p)          => apiRequest('post', '/website/admin/contacts', p),
  updateContacto:  (id, p)      => apiRequest('put', `/website/admin/contacts/${id}`, p),
  deleteContacto:  (id)         => apiRequestDelete(`/website/admin/contacts/${id}`),

  // vault
  vaultConfig:      ()          => apiRequest('get', '/vault/config'),
  initVault:        ()          => apiRequest('post', '/vault/config'),
  listVaultEntries: ()          => apiRequest('get', '/vault/entries'),
  createVaultEntry: (p)         => apiRequest('post', '/vault/entries', p),
  updateVaultEntry: (id, p)     => apiRequest('put', `/vault/entries/${id}`, p),
  deleteVaultEntry: (id)        => apiRequestDelete(`/vault/entries/${id}`),

  // users (admin)
  listUsers:   ()               => apiRequest('get', '/users'),
  createUser:  (p)              => apiRequest('post', '/users', p),
  updateUser:  (id, p)          => apiRequest('put', `/users/${id}`, p),
  deleteUser:  (id)             => apiRequestDelete(`/users/${id}`),

  // locations
  updateLocation:   (p)         => apiRequest('post', '/locations/update', p),
  needsRefresh:     (deviceId)  => apiRequest('get', `/locations/${deviceId}/needs-refresh`),
};
