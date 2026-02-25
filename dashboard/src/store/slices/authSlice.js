import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "@apis/auth";

const STORAGE_KEY = "viernes_token";

const initialState = {
  token: localStorage.getItem(STORAGE_KEY) || null,
  user: null, // luego cuando tengas /me
  loading: false,
  error: null,
};

// Thunk async para login
export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authApi.login(email, password);
      // suponiendo que regresa { access_token: "..." }
      return data.access_token;
    } catch (err) {
      return rejectWithValue(err?.message ?? "Credenciales inválidas");
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
        state.token = action.payload;
        localStorage.setItem(STORAGE_KEY, action.payload);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Credenciales inválidas";
      });
  },
});

export const { logout, setToken } = authSlice.actions;
export default authSlice.reducer;