import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { db, auth } from './firebase'
import { Studio, BookingData, PaymentSettings, defaultPaymentSettings, studioFallbacks, normalizeStudio } from './data'

// Collection Names
const ROOMS_COLLECTION = 'rooms'
const BOOKINGS_COLLECTION = 'bookings'
const SETTINGS_COLLECTION = 'settings'
const PAYMENT_SETTINGS_DOC = 'payment'

/* ==========================================================================
   1. ROOMS / STUDIOS SERVICES
   ========================================================================== */

/**
 * Fetch all studio listings from Firebase Firestore.
 * If Firestore returns empty or errors, fall back to the local dataset.
 */
export async function getRoomsFromFirebase(): Promise<Studio[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ROOMS_COLLECTION))
    if (querySnapshot.empty) {
      return studioFallbacks
    }
    return querySnapshot.docs.map((doc) => normalizeStudio({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.warn('Firebase query fallback to local studio data:', error)
    return studioFallbacks
  }
}

/**
 * Fetch a single studio room by ID.
 */
export async function getRoomByIdFromFirebase(id: string): Promise<Studio | undefined> {
  try {
    const docRef = doc(db, ROOMS_COLLECTION, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return normalizeStudio({ id: docSnap.id, ...docSnap.data() })
    }
  } catch (error) {
    console.warn('Error fetching room from Firestore:', error)
  }
  // Fallback to local data
  return studioFallbacks.find((studio) => studio.id === id)
}

/**
 * Save or update a studio in Firestore.
 */
export async function saveRoomToFirebase(room: Studio): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, room.id)
  await setDoc(roomRef, room, { merge: true })
}

/**
 * Delete a studio by ID from Firestore.
 */
export async function deleteRoomFromFirebase(id: string): Promise<void> {
  await deleteDoc(doc(db, ROOMS_COLLECTION, id))
}

/* ==========================================================================
   2. BOOKINGS SERVICES
   ========================================================================== */

/**
 * Save a new booking request to Firestore.
 */
export async function createBookingInFirebase(booking: Omit<BookingData, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...booking,
      createdAt: new Date().toISOString(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating booking in Firebase:', error)
    throw error
  }
}

/**
 * Fetch all bookings (for Host Admin Dashboard).
 */
export async function getBookingsFromFirebase(): Promise<BookingData[]> {
  try {
    const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BookingData[]
  } catch (error) {
    console.warn('Error getting bookings from Firebase:', error)
    return []
  }
}

/**
 * Search customer bookings by phone or booking reference code.
 */
export async function searchBookingsInFirebase(searchQuery: string): Promise<BookingData[]> {
  try {
    const qPhone = query(collection(db, BOOKINGS_COLLECTION), where('customerPhone', '==', searchQuery))
    const querySnapshot = await getDocs(qPhone)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as BookingData[]
  } catch {
    return []
  }
}

/**
 * Update status of a booking (e.g. 'deposit_paid', 'confirmed', 'completed', 'cancelled').
 */
export async function updateBookingStatusInFirebase(
  bookingId: string,
  status: BookingData['status']
): Promise<void> {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId)
  await updateDoc(bookingRef, { status })
}

/* ==========================================================================
   3. PAYMENT SETTINGS SERVICES
   ========================================================================== */

export async function getPaymentSettingsFromFirebase(): Promise<PaymentSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PAYMENT_SETTINGS_DOC)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return defaultPaymentSettings
    }

    return {
      ...defaultPaymentSettings,
      ...docSnap.data(),
    } as PaymentSettings
  } catch (error) {
    console.warn('Firebase payment settings fallback to defaults:', error)
    return defaultPaymentSettings
  }
}

export async function savePaymentSettingsToFirebase(settings: PaymentSettings): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, PAYMENT_SETTINGS_DOC)
  await setDoc(
    docRef,
    {
      ...settings,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  )
}

/* ==========================================================================
   4. FIREBASE AUTHENTICATION SERVICES
   ========================================================================== */

/**
 * Admin Login via Firebase Auth Email & Password.
 */
export async function loginAdminWithFirebase(email: string, pass: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass)
  return userCredential.user
}

/**
 * Admin Logout via Firebase Auth.
 */
export async function logoutAdminFromFirebase(): Promise<void> {
  await signOut(auth)
}

/**
 * Listen to Auth state changes.
 */
export function onAdminAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}
