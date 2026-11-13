import { createContext } from 'react'

export const AUTH_STATUS = {
  loading: 'loading',
  authenticated: 'authenticated',
  anonymous: 'anonymous',
}

export const AuthContext = createContext(null)
