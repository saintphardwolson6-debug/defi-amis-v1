// js/main.js
import { db, auth } from './firebase.js';
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc, query, where, orderBy, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export function genUid(seed='DEF') {
  return (seed||'DEF').toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,3) + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
}
export function genOwnerCode(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }

/**
 * Créer un défi dans Firestore:
 * collection 'defis' document id = uid
 * fields: hostUid (créateur user.uid), hostName, mode, ownerCode, createdAt
 * sous-collection 'participants' pour stocker joueurs (évite duplicate)
 */
export async function createDefi({ hostUid, hostName, mode, questions }) {
  const uid = genUid(hostName);
  const ownerCode = genOwnerCode();
  const docRef = doc(db, 'defis', uid);
  await setDoc(docRef, {
    uid,
    hostUid,
    hostName,
    mode,
    ownerCode,
    createdAt: serverTimestamp()
  });
  // store questions as subcollection doc 'meta' or as field
  await setDoc(doc(db,'defis',uid,'meta','questions'), { questions });
  return { uid, ownerCode };
}

/**
 * Ouvrir un défi (récupérer meta + participants)
 */
export async function getDefi(uid) {
  const d = await getDoc(doc(db, 'defis', uid));
  if(!d.exists()) return null;
  const metaSnap = await getDoc(doc(db,'defis',uid,'meta','questions'));
  const questions = metaSnap.exists() ? metaSnap.data().questions : [];
  return { ...d.data(), questions };
}

/**
 * Ajouter participant: empêche double-play par user.uid si connecté,
 * sinon empêche double-play par prénom (case-insensitive) pour éviter duplicate.
 * participants stored under defis/{uid}/participants with doc id = uid_joueur (or auto)
 */
export async function addParticipant(uidDefi, player) {
  // player: { uid?:user.uid, name, score, date }
  // check existing
  const participantsCol = collection(db, 'defis', uidDefi, 'participants');
  if(player.uid) {
    // check by uid
    const q = query(participantsCol, where('uid','==',player.uid));
    const snaps = await getDocs(q);
    if(!snaps.empty) throw new Error('Vous avez déjà participé à ce défi.');
  } else {
    // check by name (case-insensitive)
    const q = query(participantsCol, where('name','==', player.name));
    const snaps = await getDocs(q);
    if(!snaps.empty) throw new Error('Ce prénom a déjà joué sur ce défi.');
  }

  // push participant
  await addDoc(participantsCol, {
    uid: player.uid || null,
    name: player.name,
    score: player.score,
    date: serverTimestamp(),
    verified: false
  });

  // also add to global scores collection
  await addDoc(collection(db,'scores'), {
    name: player.name,
    score: player.score,
    defiUid: uidDefi,
    date: serverTimestamp()
  });

  return true;
}

/**
 * Récupérer participants (classés)
 */
export async function getParticipants(uidDefi) {
  const parts = [];
  const snaps = await getDocs(collection(db, 'defis', uidDefi, 'participants'));
  snaps.forEach(s => parts.push({ id: s.id, ...s.data() }));
  parts.sort((a,b) => (b.score || 0) - (a.score || 0));
  return parts;
}

/**
 * Récupérer classement global (top N)
 */
export async function getGlobalTop(limit = 50) {
  const snaps = await getDocs(query(collection(db,'scores'), orderBy('score','desc')));
  const arr = [];
  snaps.forEach(s => arr.push({ id: s.id, ...s.data() }));
  return arr.slice(0, limit);
}