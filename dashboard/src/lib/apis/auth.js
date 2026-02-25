import { apiRequest } from "./client";

export const authApi = {
  login: (email, password) => apiRequest("post", "/auth/login", { email, password }),
  // luego: me: () => apiRequest("get", "/me"),
};
