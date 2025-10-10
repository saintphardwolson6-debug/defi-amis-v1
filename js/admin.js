// js/admin.js
import { db } from './firebase.js';
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Liste des demandes VIP (on suppose vous stockez demandes dans collection 'vipRequests')
export async function loadVipRequests(containerId='list') {
  const listEl = document.getElementById(containerId);
  const snaps = await getDocs(collection(db,'vipRequests'));
  const arr = [];
  snaps.forEach(s => arr.push({ id: s.id, ...s.data() }));
  if(!arr.length) { listEl.innerHTML = '<p>Aucune demande en attente.</p>'; return; }
  listEl.innerHTML = arr.map(r => `<div class="row item"><div style="flex:1"><strong>${r.name}</strong> — ${r.txn}</div><div><button data-id="${r.id}" class="btn validate">Valider</button><button data-id="${r.id}" class="btn ghost delete">Suppr</button></div></div>`).join('');
  listEl.querySelectorAll('.validate').forEach(b => b.onclick = async (e) => {
    const id = e.target.dataset.id;
    // valider: mettre isVIP:true pour l'user (ici on suppose champ userUid stocké dans r)
    const rdata = arr.find(x=>x.id===id);
    if(rdata && rdata.userUid) {
      await setDoc(doc(db,'users', rdata.userUid), { isVIP: true }, { merge:true });
    }
    await deleteDoc(doc(db,'vipRequests', id));
    loadVipRequests(containerId);
  });
  listEl.querySelectorAll('.delete').forEach(b => b.onclick = async (e)=>{
    const id = e.target.dataset.id;
    await deleteDoc(doc(db,'vipRequests', id));
    loadVipRequests(containerId);
  });
}