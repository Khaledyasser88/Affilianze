import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  accountApi,
  marketerApi,
  companyApi,
  setAuthToken,
  resolveImageUrl,
  type LoginResponse,
} from '../api/client'

type UserRole = 'Marketer' | 'Company' | 'Admin' | null

interface AuthState {
  token: string | null
  role: UserRole
  isReady: boolean
  avatar: string | null
  name: string | null
  email: string | null
  phone: string | null
}

import defaultProfileImg from '../assets/profile.jpg'

const DEFAULT_AVATAR  = defaultProfileImg
const TOKEN_KEY       = 'affiliance_token'
const ROLE_KEY        = 'affiliance_role'
const REMEMBER_KEY    = 'affiliance_remember'

// ─── Storage helpers (supports both localStorage and sessionStorage) ──────────
function getToken(): string | null {
  // sessionStorage (current tab) takes priority over localStorage (remembered session)
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null
}

function getRole(): UserRole {
  // sessionStorage MUST take priority — localStorage may contain a stale role from an old session
  const role = sessionStorage.getItem(ROLE_KEY) || localStorage.getItem(ROLE_KEY) || null
  if (!role) return null
  const lower = role.toLowerCase()
  if (lower === 'company') return 'Company'
  if (lower === 'marketer') return 'Marketer'
  if (lower === 'admin' || lower === 'administrator') return 'Admin'
  return role as UserRole
}

// Always extract the canonical role directly from the JWT — most reliable source of truth
function getRoleFromJwt(token: string): UserRole {
  try {
    const payload = parseJwt(token)
    if (!payload) return null
    const claimRole =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      payload.role || payload.Role
    if (!claimRole) return null
    const lower = String(claimRole).toLowerCase()
    if (lower === 'company') return 'Company'
    if (lower === 'admin' || lower === 'administrator') return 'Admin'
    if (lower === 'marketer') return 'Marketer'
    return null
  } catch { return null }
}

const avatarKey  = (email: string) => `affiliance_av_${email}`
const profileKey = (email: string) => `affiliance_p_${email}`


function saveAvatar(email: string, url: string) {
  if (!url || url.startsWith('blob:')) return
  try { localStorage.setItem(avatarKey(email), url) } catch {
    if (url.startsWith('http')) {
      try { localStorage.setItem(avatarKey(email), url) } catch { /* ignore */ }
    }
  }
}

function loadAvatar(email: string): string | null {
  return localStorage.getItem(avatarKey(email))
}

function saveProfile(email: string, data: Record<string, string>) {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey(email)) || '{}')
    localStorage.setItem(profileKey(email), JSON.stringify({ ...saved, ...data }))
  } catch { /* QuotaExceeded */ }
}

function loadProfile(email: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(profileKey(email)) || '{}') } catch { return {} }
}

// ─── Safe JWT Parser ─────────────────────────────────────────────────────────
function parseJwt(token: string): any {
  try {
    let base64Url = token.split('.')[1]
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) { base64 += '=' }
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function getEmailFromToken(token: string): string | null {
  try {
    const payload = parseJwt(token)
    if (!payload) return null
    return (
      payload.email || 
      payload.Email || 
      payload.sub || 
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/emailaddress'] ||
      null
    )
  } catch { return null }
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<{
  token: string | null
  role: UserRole
  isReady: boolean
  avatar: string | null
  name: string | null
  email: string | null
  phone: string | null
  updateProfile: (data: {
    name?: string
    avatar?: string
    avatarFile?: File
    email?: string
    phone?: string
  }) => Promise<void>
  login: (email: string, password: string, remember?: boolean, expectedType?: 'user' | 'admin') => Promise<void>
  logout: () => Promise<void>
  registerMarketer: (form: FormData) => Promise<void>
  registerCompany: (form: FormData) => Promise<void>
} | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = getToken()
    // JWT is the single source of truth for role — avoids stale localStorage contamination
    const jwtRole = token ? getRoleFromJwt(token) : null
    const role = jwtRole || getRole() as UserRole
    const email = token ? getEmailFromToken(token) : null
    const saved = email ? loadProfile(email) : {}
    const avatar = email ? loadAvatar(email) : null

    // Sync the correct role back to storage immediately so subsequent reads are consistent
    if (token && jwtRole) {
      const storage = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage
      storage.setItem(ROLE_KEY, jwtRole)
    }

    return {
      token,
      role,
      isReady: false,
      avatar: avatar || null,
      name:   saved.name  || null,
      email:  email || saved.email || null,
      phone:  saved.phone || null,
    }
  })

  const navigate = useNavigate()

  // ─── updateProfile ───────────────────────────────────────────────────────

  const updateProfile = useCallback(async (data: {
    name?: string
    avatar?: string
    avatarFile?: File
    email?: string
    phone?: string
  }) => {
    const currentEmail = state.email || data.email
    let finalAvatar = data.avatar

    if (finalAvatar && currentEmail) {
      saveAvatar(currentEmail, finalAvatar)
      setState(s => ({ ...s, avatar: finalAvatar! }))
    }

    // رفع الصورة للسيرفر
    if (data.avatarFile) {
      try {
        const fd = new FormData()
        fd.append('file', data.avatarFile)

        if (state.role === 'Marketer') {
          await marketerApi.putmyprofilepicture(fd).catch(() => null)
          const p = await marketerApi.getmyprofile().catch(() => null) as any
          if (p) {
            const serverUrl = resolveImageUrl(p.profilePicture || p.avatarUrl)
            // ✅ لو السيرفر رجّع URL، استخدمه عوض الـ base64
            if (serverUrl) finalAvatar = serverUrl
            if (p.phoneNumber && currentEmail) saveProfile(currentEmail, { phone: p.phoneNumber })
          }
        } else if (state.role === 'Company') {
          await companyApi.putmylogo(fd).catch(() => null)
          const p = await companyApi.getmyprofile().catch(() => null) as any
          if (p) {
            const serverUrl = resolveImageUrl(p.logoUrl)
            if (serverUrl) finalAvatar = serverUrl
            if (p.phoneNumber && currentEmail) saveProfile(currentEmail, { phone: p.phoneNumber })
          }
        }
      } catch (e) {
        console.error('Failed to upload picture:', e)
      }
    }

    // ✅ احفظ الصورة النهائية (HTTP URL أخف من base64)
    if (finalAvatar && currentEmail) {
      saveAvatar(currentEmail, finalAvatar)
    } else if (finalAvatar === '' && currentEmail) {
      localStorage.removeItem(avatarKey(currentEmail))
    }

    // احفظ باقي البيانات
    if (currentEmail) {
      const toSave: Record<string, string> = {}
      if (data.name  !== undefined) toSave.name  = data.name
      if (data.phone !== undefined) toSave.phone = data.phone
      if (data.email !== undefined) toSave.email = data.email
      if (Object.keys(toSave).length) saveProfile(currentEmail, toSave)
    }

    setState(s => ({
      ...s,
      avatar: finalAvatar !== undefined ? (finalAvatar || null) : s.avatar,
      name:   data.name  !== undefined ? data.name  : s.name,
      email:  data.email !== undefined ? data.email : s.email,
      phone:  data.phone !== undefined ? data.phone : s.phone,
    }))
  }, [state.role, state.email])

  // ─── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function init() {
      const token = getToken()
      let role  = getRole()

      if (!token || !role) {
        if (!cancelled) setState(s => ({ ...s, isReady: true }))
        return
      }

      // Self-heal: If stored role doesn't match JWT, fix it — but ONLY in the storage that holds the token
      const jwtRoleFromInit = getRoleFromJwt(token)
      if (jwtRoleFromInit && jwtRoleFromInit !== role) {
        role = jwtRoleFromInit
        // Write only to whichever storage actually contains the token
        if (sessionStorage.getItem(TOKEN_KEY)) {
          sessionStorage.setItem(ROLE_KEY, jwtRoleFromInit)
        } else {
          localStorage.setItem(ROLE_KEY, jwtRoleFromInit)
        }
        setState(s => ({ ...s, role: jwtRoleFromInit }))
      }

      setAuthToken(token)

      const emailFromToken = getEmailFromToken(token)
      const saved  = emailFromToken ? loadProfile(emailFromToken) : {}
      const savedAvatar = emailFromToken ? loadAvatar(emailFromToken) : null

      let updatedName   = saved.name  || null
      let updatedAvatar = savedAvatar || null
      let updatedEmail  = emailFromToken || saved.email || null
      let updatedPhone  = saved.phone || null

      try {
        const roleLower = String(role).toLowerCase()
        if (roleLower === 'marketer') {
          const p = await marketerApi.getmyprofile() as any
          if (p && !cancelled) {
            if (!updatedName) {
              const fName = p.firstName || p.FirstName || p.first_name || ''
              const lName = p.lastName || p.LastName || p.last_name || ''
              if (fName && lName) {
                updatedName = `${fName} ${lName}`.trim()
              } else if (fName) {
                updatedName = fName
              } else if (p.fullName) {
                updatedName = p.fullName
              } else if (p.name) {
                updatedName = p.name
              }
            }
            if (p.profilePicture || p.avatarUrl) updatedAvatar = resolveImageUrl(p.profilePicture || p.avatarUrl)
            updatedEmail = p.email || updatedEmail
            updatedPhone = p.phoneNumber || updatedPhone
          }
        } else if (roleLower === 'company') {
          const p = await companyApi.getmyprofile() as any
          if (p && !cancelled) {
            if (!updatedName && p.campanyName) updatedName = p.campanyName
            if (p.logoUrl) updatedAvatar = resolveImageUrl(p.logoUrl)
            updatedEmail = p.contactEmail || updatedEmail
            updatedPhone = p.phoneNumber || updatedPhone
          }
        } else if (roleLower === 'admin') {
          // Admin does not need a profile fetch — skip to avoid hanging
        }
      } catch (e: any) {
        console.error('Profile sync failed:', e)
        // If we get a 403/401 on the role-specific profile call, our role or token is likely stale
        if (e.message?.includes('403') || e.message?.includes('401') || e.message?.includes('Forbidden')) {
          console.warn('Authorization mismatch detected during sync. Clearing role-specific data.')
          // We don't logout automatically to avoid loops, but we can't trust the role-specific profile
        }
      }

      if (!cancelled) {
        const emailKey = updatedEmail || emailFromToken
        if (emailKey) {
          // ✅ حفظ الصورة في مفتاحها المنفصل
          if (updatedAvatar && !updatedAvatar.startsWith('blob:')) {
            saveAvatar(emailKey, updatedAvatar)
          }
          const toSave: Record<string, string> = {}
          if (updatedName)   toSave.name  = updatedName
          if (updatedEmail)  toSave.email = updatedEmail
          if (updatedPhone)  toSave.phone = updatedPhone
          if (Object.keys(toSave).length) saveProfile(emailKey, toSave)
        }

        setState(s => ({
          ...s,
          token, role,
          name:    updatedName   ?? s.name,
          avatar:  updatedAvatar ?? s.avatar,
          email:   updatedEmail  ?? s.email,
          phone:   updatedPhone  ?? s.phone,
          isReady: true,
        }))
      }
    }

    const initTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('Auth init timed out, forcing isReady')
        setState(s => ({ ...s, isReady: true }))
      }
    }, 6000)

    init().finally(() => clearTimeout(initTimeout))
    return () => { cancelled = true }
  }, [])

  // ─── Login ───────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string, remember = false, expectedType?: 'user' | 'admin') => {
    const res = await accountApi.login({ email, password })
    const token =
      (res && typeof res === 'object' && ('accessToken' in res
        ? (res as LoginResponse).accessToken
        : (res as LoginResponse).token)) ?? null
    if (!token) throw new Error('No token received')

    let userRoleRaw = (res as any)?.role || (res as any)?.data?.role
    let userRole: UserRole = null
    
    if (userRoleRaw) {
      const lower = String(userRoleRaw).toLowerCase()
      if (lower === 'company') userRole = 'Company'
      else if (lower === 'admin' || lower === 'administrator') userRole = 'Admin'
      else if (lower === 'marketer') userRole = 'Marketer'
    }

    if (!userRole) {
      try {
        const payload = parseJwt(token)
        if (payload) {
          const claimRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            || payload.role || payload.Role
          
          if (claimRole) {
            const lower = String(claimRole).toLowerCase()
            if (lower === 'company') userRole = 'Company'
            else if (lower === 'admin' || lower === 'administrator') userRole = 'Admin'
            else if (lower === 'marketer') userRole = 'Marketer'
          }
        }
      } catch { /* ignore */ }
    }

    // If we still have no role after parsing the JWT, the token is malformed — fail loudly
    if (!userRole) {
      throw new Error('Unable to determine account role. Please contact support.')
    }

    // Role-based login restriction
    if (expectedType === 'admin' && userRole !== 'Admin') {
      throw new Error('This account does not have administrator privileges.')
    }
    if (expectedType === 'user' && userRole === 'Admin') {
      throw new Error('Administrators must log in through the Administrator portal.')
    }

    // Store in the right storage based on Remember Me flag
    const storage = remember ? localStorage : sessionStorage
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, '1')
    } else {
      localStorage.removeItem(REMEMBER_KEY)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(ROLE_KEY)
    }
    storage.setItem(TOKEN_KEY, token)
    storage.setItem(ROLE_KEY,  userRole)
    setAuthToken(token)

    // Clear stale profile & company Settings drafts so server data is always shown fresh
    localStorage.removeItem('affiliance_profile_draft')
    localStorage.removeItem('affiliance_company_draft')

    // ✅ استرجع البيانات المحفوظة لهذا اليوزر
    const savedProfile = loadProfile(email)
    const savedAvatar  = loadAvatar(email)

    // Always start with null — never derive name from email
    // Favor the local name (if updated in Settings) over the API name as a source of truth
    const savedName = savedProfile.name || null
    let finalName   = savedName
    let finalAvatar = savedAvatar || null
    let finalEmail  = email
    let finalPhone  = savedProfile.phone || null

    try {
      if (userRole === 'Marketer') {
        const p = await marketerApi.getmyprofile().catch(() => null) as any
        if (p) {
          if (!finalName) {
            const fName = p.firstName || p.FirstName || p.first_name || ''
            const lName = p.lastName || p.LastName || p.last_name || ''
            if (fName && lName) {
              finalName = `${fName} ${lName}`.trim()
            } else if (fName) {
              finalName = fName
            } else if (p.fullName) {
              finalName = p.fullName
            } else if (p.name) {
              finalName = p.name
            }
          }
          finalAvatar = resolveImageUrl(p.profilePicture || p.avatarUrl) || finalAvatar
          finalEmail  = p.email || finalEmail
          finalPhone  = p.phoneNumber || finalPhone
        }
      } else if (userRole === 'Company') {
        const p = await companyApi.getmyprofile().catch(() => null) as any
        if (p) {
          if (!finalName && p.campanyName) finalName = p.campanyName
          finalAvatar = resolveImageUrl(p.logoUrl) || finalAvatar
          finalEmail  = p.contactEmail || finalEmail
          finalPhone  = p.phoneNumber || finalPhone
        }
      }
    } catch (e) {
      console.error('Post-login profile fetch failed:', e)
    }

    // If API had no name at all, fall back to previously saved name (not email-derived)
    if (!finalName) finalName = savedProfile.name || null


    if (finalAvatar && !finalAvatar.startsWith('blob:')) saveAvatar(finalEmail, finalAvatar)
    const toSave: Record<string, string> = { email: finalEmail }
    if (finalName)  toSave.name  = finalName
    if (finalPhone) toSave.phone = finalPhone
    saveProfile(finalEmail, toSave)

    setState(s => ({
      ...s, token,
      role: userRole as UserRole,
      email:   finalEmail,
      name:    finalName,
      avatar:  finalAvatar,
      phone:   finalPhone,
      isReady: true,
    }))

    const roleLower = userRole?.toLowerCase()
    
    navigate(roleLower === 'admin' ? '/admin' : roleLower === 'company' ? '/company' : '/dashboard')
  }, [navigate])

  // ─── Logout ──────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try { await accountApi.logout() } catch { /* ignore */ }
    finally {
      setAuthToken(null)
      // Clear token from both storages
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(ROLE_KEY)
      localStorage.removeItem(REMEMBER_KEY)
      localStorage.removeItem('affilianze_ai_chat')
      localStorage.removeItem('affilianze_chat_messages')
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(ROLE_KEY)
      setState({
        token: null, role: null,
        avatar: null, name: null, email: null, phone: null,
        isReady: true,
      })
      navigate('/')
    }
  }, [navigate])

  // ─── Register ────────────────────────────────────────────────────────────

  const registerMarketer = useCallback(async (form: FormData) => {
    await accountApi.registerMarketer(form)
    // Do NOT pre-write the role — it will be set correctly during login via JWT
    const phone = form.get('PhoneNumber') as string
    const email = form.get('Email') as string
    const fName = form.get('FirstName') as string
    const lName = form.get('LastName') as string
    const rName = (fName && lName) ? `${fName} ${lName}`.trim() : fName || lName || ''
    if (email) {
      const toSave: Record<string, string> = {}
      if (phone) toSave.phone = phone
      if (rName) toSave.name = rName
      saveProfile(email, toSave)
    }
    navigate('/login')
  }, [navigate])

  const registerCompany = useCallback(async (form: FormData) => {
    await accountApi.registerCompany(form)
    // Do NOT pre-write the role — it will be set correctly during login via JWT
    const phone = form.get('PhoneNumber') as string
    const email = form.get('Email') as string
    if (phone && email) saveProfile(email, { phone })
    navigate('/login')
  }, [navigate])

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!state.isReady) return null

  return (
    <AuthContext.Provider
      value={{
        token:   state.token,
        role:    state.role,
        isReady: state.isReady,
        avatar:  state.avatar || DEFAULT_AVATAR,
        name:    state.name,
        email:   state.email,
        phone:   state.phone,
        updateProfile,
        login,
        logout,
        registerMarketer,
        registerCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
