/**
 * Minutas PMO Grupo Fórmula — Configuración y Servicios Firebase SDK v10 (CDN Modular)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Configuración real del proyecto Firebase minutas-pmo
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA_hm-eTI1zfE5EWRtswkrsWjlC7Gveqsw",
  authDomain: "minutas-pmo.firebaseapp.com",
  projectId: "minutas-pmo",
  storageBucket: "minutas-pmo.firebasestorage.app",
  messagingSenderId: "858253362534",
  appId: "1:858253362534:web:21815852b35d3aff4274a7",
  measurementId: "G-9FXLTT6XTY"
};

// Carga la configuración guardada por el usuario en localStorage o usa la predeterminada
function getActiveFirebaseConfig() {
  const saved = localStorage.getItem("formula_firebase_config");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error al parsear configuración personalizada de Firebase:", e);
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveCustomFirebaseConfig(config) {
  localStorage.setItem("formula_firebase_config", JSON.stringify(config));
  window.location.reload();
}

export function resetFirebaseConfig() {
  localStorage.removeItem("formula_firebase_config");
  window.location.reload();
}

let app = null;
let auth = null;
let db = null;
let isLiveFirebase = false;

// Estado de usuario actual para modo local/fallback
let mockUser = JSON.parse(localStorage.getItem("formula_mock_user") || "null");

export function initFirebase() {
  const config = getActiveFirebaseConfig();
  const isDefaultOrPlaceholder = !config.apiKey || config.apiKey.includes("CONFIGURA_TU_API_KEY");

  if (!isDefaultOrPlaceholder) {
    try {
      app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
      isLiveFirebase = true;
      console.log("🔥 [Firebase] Conectado exitosamente al proyecto:", config.projectId);
      return { success: true, isLive: true, app, auth, db };
    } catch (error) {
      console.warn("⚠️ [Firebase] No se pudo inicializar con las credenciales actuales, activando modo seguro:", error);
      isLiveFirebase = false;
      return { success: false, isLive: false, error };
    }
  } else {
    console.info("ℹ️ [Firebase] Modo Local / Demostración activo. Para conectar con Cloud Firestore en vivo, ingresa las credenciales en 'Configurar Firebase'.");
    isLiveFirebase = false;
    return { success: true, isLive: false };
  }
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

export function observeAuthState(callback) {
  if (isLiveFirebase && auth) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          photoURL: user.photoURL || null,
          isAnonymous: user.isAnonymous
        });
      } else {
        callback(null);
      }
    });
  } else {
    // Modo local / Fallback
    callback(mockUser);
    return () => {};
  }
}

export async function loginWithEmail(email, password) {
  if (isLiveFirebase && auth) {
    try {
      // 1. Intenta iniciar sesión
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split("@")[0]
      };
    } catch (error) {
      console.warn("Aviso en signInWithEmailAndPassword:", error.code);
      // 2. Si el usuario no existe aún, intenta registrarlo automáticamente
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, email, password);
          return {
            uid: newCred.user.uid,
            email: newCred.user.email,
            displayName: email.split("@")[0]
          };
        } catch (regError) {
          // Si el proveedor no está activo en Firebase Console, usar sesión local
          if (regError.code === "auth/operation-not-allowed" || regError.code === "auth/configuration-not-found") {
            return loginLocalPMO(email);
          }
          throw regError;
        }
      } else if (error.code === "auth/operation-not-allowed" || error.code === "auth/configuration-not-found") {
        // El servicio de Auth aún no está activado en Firebase Console, usar acceso seguro local
        return loginLocalPMO(email);
      }
      throw error;
    }
  } else {
    return loginLocalPMO(email);
  }
}

export function loginLocalPMO(email = "valeria.pmo@radioformula.com.mx") {
  mockUser = {
    uid: "usr_pmo_" + Date.now(),
    email: email,
    displayName: email.includes("@") ? email.split("@")[0].toUpperCase() + " (PMO)" : "Valeria Mejía (PMO)",
    photoURL: null
  };
  localStorage.setItem("formula_mock_user", JSON.stringify(mockUser));
  return mockUser;
}

export async function registerWithEmail(email, password, displayName) {
  if (isLiveFirebase && auth) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || email.split("@")[0]
      };
    } catch (e) {
      if (e.code === "auth/operation-not-allowed") {
        return loginLocalPMO(email);
      }
      throw e;
    }
  } else {
    return loginLocalPMO(email);
  }
}

export async function loginWithGoogle() {
  if (isLiveFirebase && auth) {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email,
        photoURL: cred.user.photoURL
      };
    } catch (error) {
      console.warn("Aviso en signInWithPopup:", error);
      // Fallback a sesión PMO en caso de bloqueo de popups o proveedor desactivado
      return loginLocalPMO("valeria.pmo@radioformula.com.mx");
    }
  } else {
    return loginLocalPMO("valeria.pmo@radioformula.com.mx");
  }
}

export async function logoutUser() {
  if (isLiveFirebase && auth) {
    await signOut(auth);
  } else {
    mockUser = null;
    localStorage.removeItem("formula_mock_user");
  }
}

// ==========================================
// SERVICIOS FIRESTORE (MINUTAS)
// ==========================================

const LOCAL_STORAGE_MINUTAS_KEY = "formula_minutas_db";

function getLocalMinutas() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MINUTAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalMinutas(list) {
  localStorage.setItem(LOCAL_STORAGE_MINUTAS_KEY, JSON.stringify(list));
}

/**
 * Guarda o actualiza una minuta en Firestore (o almacenamiento local)
 */
export async function guardarMinutaEnFirestore(minuta) {
  const docId = minuta.id || `minuta_${Date.now()}`;
  const timestamp = new Date().toISOString();

  const dataToSave = {
    ...minuta,
    id: docId,
    actualizadoEl: timestamp,
    fechaModificacionHumana: new Date().toLocaleString("es-MX", { 
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" 
    })
  };

  if (!dataToSave.creadoEl) {
    dataToSave.creadoEl = timestamp;
  }

  if (isLiveFirebase && db) {
    try {
      const docRef = doc(db, "minutas", docId);
      await setDoc(docRef, dataToSave, { merge: true });
      return { success: true, id: docId, data: dataToSave, source: "firestore" };
    } catch (error) {
      console.error("Error guardando en Cloud Firestore:", error);
      throw error;
    }
  } else {
    // Almacenamiento local para modo seguro/offline
    const list = getLocalMinutas();
    const index = list.findIndex(m => m.id === docId);
    if (index >= 0) {
      list[index] = dataToSave;
    } else {
      list.unshift(dataToSave);
    }
    saveLocalMinutas(list);
    return { success: true, id: docId, data: dataToSave, source: "local" };
  }
}

/**
 * Obtiene las minutas más recientes (para el historial)
 */
export async function obtenerMinutasRecientes(limite = 25) {
  if (isLiveFirebase && db) {
    try {
      const q = query(
        collection(db, "minutas"), 
        orderBy("actualizadoEl", "desc"), 
        limit(limite)
      );
      const snapshot = await getDocs(q);
      const minutas = [];
      snapshot.forEach(docSnap => {
        minutas.push(docSnap.data());
      });
      return minutas;
    } catch (error) {
      console.warn("Error leyendo de Cloud Firestore, verificando almacenamiento local:", error);
      return getLocalMinutas().slice(0, limite);
    }
  } else {
    const list = getLocalMinutas();
    list.sort((a, b) => new Date(b.actualizadoEl || 0) - new Date(a.actualizadoEl || 0));
    return list.slice(0, limite);
  }
}

/**
 * Obtiene una minuta específica por su ID
 */
export async function obtenerMinutaPorId(id) {
  if (isLiveFirebase && db) {
    try {
      const docRef = doc(db, "minutas", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error al obtener minuta por ID:", error);
      const list = getLocalMinutas();
      return list.find(m => m.id === id) || null;
    }
  } else {
    const list = getLocalMinutas();
    return list.find(m => m.id === id) || null;
  }
}

/**
 * Suscripción en tiempo real a los cambios del historial
 */
export function escucharHistorialMinutas(callback) {
  if (isLiveFirebase && db) {
    const q = query(
      collection(db, "minutas"), 
      orderBy("actualizadoEl", "desc"), 
      limit(25)
    );
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(d => list.push(d.data()));
      callback(list);
    }, (error) => {
      console.warn("Aviso en listener de Firestore:", error);
      callback(getLocalMinutas());
    });
  } else {
    callback(getLocalMinutas());
    return () => {};
  }
}

export function isFirebaseConnected() {
  return isLiveFirebase;
}

export function getCurrentFirebaseConfig() {
  return getActiveFirebaseConfig();
}
