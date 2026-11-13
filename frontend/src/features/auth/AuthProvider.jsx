import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from '../../api/auth.js'
import { AUTH_STATUS, AuthContext } from './authContext.js'

const ANONYMOUS = { status: AUTH_STATUS.anonymous, user: null }

function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: AUTH_STATUS.loading,
    user: null,
  })

  // The session cookie survives a page reload: ask the API who is logged in.
  useEffect(() => {
    const controller = new AbortController()

    fetchCurrentUser(controller.signal)
      .then((user) => setState({ status: AUTH_STATUS.authenticated, user }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState(ANONYMOUS)
        }
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(async (email, password) => {
    const user = await loginRequest(email, password)
    setState({ status: AUTH_STATUS.authenticated, user })
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setState(ANONYMOUS)
  }, [])

  const value = useMemo(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
