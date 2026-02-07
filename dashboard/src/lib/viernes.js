import { apiRequest } from "./client";

export const viernesApi = {
    health: () => apiRequest("get", "/health"),

    chat: (message) => apiRequest("post", "/chat", { message }),

    ingest: (filename) => apiRequest("post", "/ingest", { filename }),

  // (luego) upload: (file) => ...
};
