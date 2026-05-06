import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  isAuthenticated: boolean
  userName: string | null
  userEmail: string | null
  token: string | null
}

const initialState: AuthState = {
  isAuthenticated: Boolean(localStorage.getItem('auth_token')),
  userName: localStorage.getItem('auth_user_name'),
  userEmail: localStorage.getItem('auth_user_email'),
  token: localStorage.getItem('auth_token'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ userName: string; userEmail: string; token: string }>) => {
      state.isAuthenticated = true
      state.userName = action.payload.userName
      state.userEmail = action.payload.userEmail
      state.token = action.payload.token
      localStorage.setItem('auth_token', action.payload.token)
      localStorage.setItem('auth_user_name', action.payload.userName)
      localStorage.setItem('auth_user_email', action.payload.userEmail)
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.userName = null
      state.userEmail = null
      state.token = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user_name')
      localStorage.removeItem('auth_user_email')
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
