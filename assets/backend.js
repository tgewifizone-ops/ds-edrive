// Couche d'accès aux données : Firebase (Auth + Firestore) si configuré,
// sinon mode démonstration en lecture seule (aucun accès admin possible).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, updatePassword, reauthenticateWithCredential,
  EmailAuthProvider, sendEmailVerification, setPersistence,
  browserSessionPersistence, connectAuthEmulator
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, doc, onSnapshot, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch,
  connectFirestoreEmulator
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const cfg = window.DS_FIREBASE_CONFIG || {};
export const configured = !!(cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('A_REMPLACER'));

let auth = null, db = null;
if (configured) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
  if (window.DS_USE_EMULATOR) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  // La session admin se termine à la fermeture de l'onglet.
  setPersistence(auth, browserSessionPersistence).catch(() => {});
}

// ---------- Lecture publique (temps réel) ----------
export function watchDrivers(cb, onErr) {
  if (!configured) return () => {};
  return onSnapshot(collection(db, 'drivers'),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
}
export function watchPlaces(cb, onErr) {
  if (!configured) return () => {};
  return onSnapshot(collection(db, 'places'),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
}
export function watchSettings(cb, onErr) {
  if (!configured) return () => {};
  return onSnapshot(doc(db, 'settings', 'public'), s => cb(s.exists() ? s.data() : {}), onErr);
}

// ---------- Candidature publique ----------
export async function submitApplication(a) {
  if (!configured) throw new Error('not-configured');
  await addDoc(collection(db, 'applications'), {
    nom: a.nom, tel: a.tel, email: a.email, vehicule: a.vehicule, modele: a.modele,
    immat: a.immat, quartier: a.quartier, zone: a.zone, creneaux: a.creneaux,
    prestations: a.prestations, status: 'pending', createdAt: serverTimestamp()
  });
}

// ---------- Authentification ----------
export function onAuth(cb) {
  if (!configured) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}
export const login = (email, pwd) => signInWithEmailAndPassword(auth, email.trim(), pwd);
export const logout = () => auth && signOut(auth);
export const resetPassword = email => sendPasswordResetEmail(auth, email.trim());
export const verifyEmail = () => sendEmailVerification(auth.currentUser);
export async function changePassword(current, next) {
  const u = auth.currentUser;
  const cred = EmailAuthProvider.credential(u.email, current);
  await reauthenticateWithCredential(u, cred);
  await updatePassword(u, next);
}
export const reloadUser = () => auth.currentUser.reload().then(() => auth.currentUser.getIdToken(true));

// Vérifie côté serveur (règles Firestore) que l'utilisateur est administrateur.
export async function checkAdmin() {
  try {
    const s = await getDoc(doc(db, 'config', 'admins'));
    return { ok: true, emails: s.exists() ? (s.data().emails || []) : [] };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// ---------- Écriture admin ----------
export function watchApplications(cb, onErr) {
  return onSnapshot(query(collection(db, 'applications'), orderBy('createdAt', 'desc')),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
}
export const saveDriver = (id, data) => id
  ? updateDoc(doc(db, 'drivers', id), { ...data, updatedAt: serverTimestamp() })
  : addDoc(collection(db, 'drivers'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const removeDriver = id => deleteDoc(doc(db, 'drivers', id));
export async function approveApplication(app, driver) {
  const b = writeBatch(db);
  b.set(doc(collection(db, 'drivers')), { ...driver, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  b.delete(doc(db, 'applications', app.id));
  await b.commit();
}
export const removeApplication = id => deleteDoc(doc(db, 'applications', id));
export const savePlace = (id, data) => setDoc(doc(db, 'places', id), data);
export const removePlace = id => deleteDoc(doc(db, 'places', id));
export async function importPlaces(list) {
  const b = writeBatch(db);
  list.forEach(p => { const { id, ...rest } = p; b.set(doc(db, 'places', id), rest); });
  await b.commit();
}
export async function importDrivers(list) {
  const b = writeBatch(db);
  list.forEach(d => { const { id, ...rest } = d; b.set(doc(collection(db, 'drivers')), { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); });
  await b.commit();
}
export const saveSettings = data => setDoc(doc(db, 'settings', 'public'), data, { merge: true });
export const saveAdmins = emails => setDoc(doc(db, 'config', 'admins'), { emails });
export const currentUser = () => auth && auth.currentUser;
