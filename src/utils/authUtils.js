import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

export async function createUserWithRole(email, password, fullName, role) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await updateProfile(user, { displayName: fullName })

  const actionCodeSettings = {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
    iOS: { bundleId: 'com.clinicmanagement.app' },
    android: { packageName: 'com.clinicmanagement.app', installApp: true, minimumVersion: '12' },
    dynamicLinkDomain: import.meta.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN || undefined
  }

  await sendEmailVerification(user, actionCodeSettings)

  await setDoc(doc(db, 'staffData', user.uid), {
    uid: user.uid,
    email: user.email,
    fullName: fullName,
    role: role.toLowerCase(), // FIX 1
    emailVerified: false,
    createdAt: serverTimestamp(), // FIX 2
    lastLogin: null,
    verificationEmailSent: serverTimestamp() // FIX 2
  })

  return user
}

export async function signInUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  if (user.uid) {
    const userDocRef = doc(db, 'staffData', user.uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      await updateDoc(userDocRef, { lastLogin: serverTimestamp() }) // FIX 2
    } else {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || 'Unknown',
        role: 'doctor',
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(), // FIX 2
        lastLogin: serverTimestamp(), // FIX 2
        verificationEmailSent: null
      })
    }
  }
  return user
}

export async function resetUserPassword(email) {
  return await sendPasswordResetEmail(auth, email)
}

export async function resendUserVerificationEmail(user) {
  const actionCodeSettings = {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
    iOS: { bundleId: 'com.clinicmanagement.app' },
    android: { packageName: 'com.clinicmanagement.app', installApp: true, minimumVersion: '12' },
    dynamicLinkDomain: import.meta.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN || undefined
  }
  return await sendEmailVerification(user, actionCodeSettings)
}

export async function fetchUserRoleFromFirestore(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'staffData', uid))
    if (userDoc.exists()) {
      return userDoc.data().role
    }
    return 'doctor' // fallback instead of null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return 'doctor' // never throw
  }
}