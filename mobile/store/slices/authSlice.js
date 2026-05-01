import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { viernesApi } from '../../lib/api/viernes';
import { saveToken, clearToken, loadToken, setToken } from '../../lib/api/client';

export const loginThunk = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const data = await viernesApi.login(email, password);
    await saveToken(data.access_token);
    const user = await viernesApi.me();
    return { token: data.access_token, user };
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

export const restoreAuthThunk = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try {
    const token = await loadToken();
    if (!token) return rejectWithValue('no_token');
    setToken(token);
    const user = await viernesApi.me();
    return { token, user };
  } catch {
    await clearToken();
    return rejectWithValue('invalid_token');
  }
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await clearToken();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null, loading: false, error: null, restored: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(loginThunk.fulfilled, (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; })
      .addCase(loginThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(restoreAuthThunk.pending,   (s) => { s.loading = true; })
      .addCase(restoreAuthThunk.fulfilled, (s, a) => { s.loading = false; s.restored = true; s.token = a.payload.token; s.user = a.payload.user; })
      .addCase(restoreAuthThunk.rejected,  (s) => { s.loading = false; s.restored = true; })

      .addCase(logoutThunk.fulfilled, (s) => { s.token = null; s.user = null; });
  },
});

export default authSlice.reducer;
