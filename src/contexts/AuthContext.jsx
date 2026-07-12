import { createContext, useContext, useEffect, useState } from 'react' // 1. add useContext
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  createUserWithRole,
  signInUser,
  resetUserPassword,
  resendUserVerificationEmail,
  fetchUserRoleFromFirestore
} from '../utils/authUtils'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password, fullName, role) {
    return await createUserWithRole(email, password, fullName, role)
  }

  async function login(email, password) {
    return await signInUser(email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  async function resetPassword(email) {
    return await resetUserPassword(email)
  }

  async function resendVerificationEmail() {
    if (currentUser) {
      return await resendUserVerificationEmail(currentUser)
    }
  }

  async function fetchUserRole(uid) {
    try {
      const role = await fetchUserRoleFromFirestore(uid)
      return role?.toLowerCase() || 'doctor' // FIX: force lowercase
    } catch (error) {
      console.error('Error fetching user role:', error)
      return 'doctor' // final fallback
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        const role = await fetchUserRole(user.uid)
        setUserRole(role)
      } else {
        setCurrentUser(null)
        setUserRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole, // 2. expose userRole
    signup,
    login,
    logout,
    resetPassword,
    resendVerificationEmail,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// 3. ADD THIS HOOK - THIS FIXES THE ERROR
export function useAuth() {
  return useContext(AuthContext)
}