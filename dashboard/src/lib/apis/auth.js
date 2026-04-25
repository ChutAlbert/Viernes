import { apiRequest } from "./client";

export const authApi = {
  login: (email, password) => apiRequest("post", "/auth/login", { email, password }),
  me: () => apiRequest("get", "/auth/me"),
};
