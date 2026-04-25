import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "@apis/auth";

const STORAGE_KEY = "viernes_token";

const initialState = {
  token: localStorage.getItem(STORAGE_KEY) || null,
  user: null,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem(STORAGE_KEY, data.access_token);
      const user = await authApi.me();
      return { token: data.access_token, user };
    } catch (err) {
      return rejectWithValue(err?.message ?? "Credenciales inválidas");
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.me();
    } catch (err) {
      return rejectWithValue(err?.message ?? "Error al cargar usuario");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      state.loading = false;
      localStorage.removeItem(STORAGE_KEY);
    },
    setToken(state, action) {
      state.token = action.payload;
      localStorage.setItem(STORAGE_KEY, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem(STORAGE_KEY, action.payload.token);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Credenciales inválidas";
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        // Token is invalid — force logout
        state.token = null;
        state.user = null;
        localStorage.removeItem(STORAGE_KEY);
      });
  },
});

export const { logout, setToken } = authSlice.actions;
export default authSlice.reducer;
