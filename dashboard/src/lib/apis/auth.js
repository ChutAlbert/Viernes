import { apiRequest } from "./client";

export const authApi = {
  login: (email, password) => apiRequest("post", "/login", { email, password }),
  // luego: me: () => apiRequest("get", "/me"),
};
