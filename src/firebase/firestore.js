// Firestore Collections Reference & Helper Functions

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, limit
} from 'firebase/firestore';
import { db } from './config';

// ─── COLLECTION NAMES ───────────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  VISITS: 'visits',
  BLACKLIST: 'blacklist',
  WATCHLIST: 'watchlist',
  FEEDBACK: 'feedback',
  OCCUPANCY: 'occupancy',
  NOTIFICATIONS: 'notifications',
  AVAILABILITY: 'host_availability',
};

// ─── VISITS ─────────────────────────────────────────────────────────────────
export const addVisit = (data) =>
  addDoc(collection(db, COLLECTIONS.VISITS), { ...data, createdAt: serverTimestamp() });

export const updateVisit = (id, data) =>
  updateDoc(doc(db, COLLECTIONS.VISITS, id), data);

export const getVisitsByStatus = (status) =>
  getDocs(query(collection(db, COLLECTIONS.VISITS), where('status', '==', status)));

export const listenToVisits = (hostId, callback) =>
  onSnapshot(
    query(collection(db, COLLECTIONS.VISITS), where('hostId', '==', hostId), orderBy('createdAt', 'desc')),
    callback
  );

export const listenToAllVisits = (callback) =>
  onSnapshot(
    query(collection(db, COLLECTIONS.VISITS), orderBy('createdAt', 'desc'), limit(100)),
    callback
  );

// ─── USERS ──────────────────────────────────────────────────────────────────
export const createUser = (uid, data) =>
  updateDoc(doc(db, COLLECTIONS.USERS, uid), data).catch(() =>
    addDoc(collection(db, COLLECTIONS.USERS), { uid, ...data, createdAt: serverTimestamp() })
  );

export const getUserById = (uid) =>
  getDoc(doc(db, COLLECTIONS.USERS, uid));

export const getUsersByRole = (role) =>
  getDocs(query(collection(db, COLLECTIONS.USERS), where('role', '==', role)));

// ─── BLACKLIST ───────────────────────────────────────────────────────────────
export const addToBlacklist = (data) =>
  addDoc(collection(db, COLLECTIONS.BLACKLIST), { ...data, addedAt: serverTimestamp() });

export const removeFromBlacklist = (id) =>
  deleteDoc(doc(db, COLLECTIONS.BLACKLIST, id));

export const listenToBlacklist = (callback) =>
  onSnapshot(collection(db, COLLECTIONS.BLACKLIST), callback);

export const checkBlacklist = async (email, phone) => {
  const q1 = query(collection(db, COLLECTIONS.BLACKLIST), where('email', '==', email));
  const q2 = query(collection(db, COLLECTIONS.BLACKLIST), where('phone', '==', phone));
  const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  return !s1.empty || !s2.empty;
};

// ─── WATCHLIST ───────────────────────────────────────────────────────────────
export const addToWatchlist = (data) =>
  addDoc(collection(db, COLLECTIONS.WATCHLIST), { ...data, addedAt: serverTimestamp() });

export const listenToWatchlist = (callback) =>
  onSnapshot(collection(db, COLLECTIONS.WATCHLIST), callback);

// ─── FEEDBACK ────────────────────────────────────────────────────────────────
export const addFeedback = (data) =>
  addDoc(collection(db, COLLECTIONS.FEEDBACK), { ...data, submittedAt: serverTimestamp() });

export const getFeedbackByHost = (hostId) =>
  getDocs(query(collection(db, COLLECTIONS.FEEDBACK), where('hostId', '==', hostId)));

export const listenToAllFeedback = (callback) =>
  onSnapshot(collection(db, COLLECTIONS.FEEDBACK), callback);

// ─── OCCUPANCY ───────────────────────────────────────────────────────────────
export const listenToOccupancy = (callback) =>
  onSnapshot(collection(db, COLLECTIONS.OCCUPANCY), callback);

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const addNotification = (data) =>
  addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), { ...data, createdAt: serverTimestamp(), read: false });

export const listenToUserNotifications = (userId, callback) =>
  onSnapshot(
    query(collection(db, COLLECTIONS.NOTIFICATIONS), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(20)),
    callback
  );

// ─── AVAILABILITY ────────────────────────────────────────────────────────────
export const setHostAvailability = (hostId, data) =>
  updateDoc(doc(db, COLLECTIONS.AVAILABILITY, hostId), data).catch(() =>
    addDoc(collection(db, COLLECTIONS.AVAILABILITY), { hostId, ...data })
  );

export const getHostAvailability = (hostId) =>
  getDocs(query(collection(db, COLLECTIONS.AVAILABILITY), where('hostId', '==', hostId)));
