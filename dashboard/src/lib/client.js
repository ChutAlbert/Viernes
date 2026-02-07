import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
    timeout: 180000, // 3 min (por si el modelo tarda)
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
    },
});

export const apiRequest = async (method, url, payload = {}) => {
    try {
        const config = { method, url };

        if (method.toLowerCase() === "get") {
        config.params = payload;
        } else {
        config.data = payload;
        }

        const { data } = await apiClient(config);
        return data;
    } catch (error) {
        // Normaliza error para UI (FastAPI suele mandar {detail:...})
        const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Error desconocido";

        throw new Error(
        typeof message === "string" ? message : JSON.stringify(message),
        );
    }
};

export default apiClient;
