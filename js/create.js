// js/create.js
import { auth } from './firebase.js';
import { questionsAmi, questionsCrush } from './questions.js';
import { createDefi } from './main.js';
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const hostNameInput = document.getElementById('hostName');
const modeSelect = document.getElementById('mode');
const questionsArea = document.getElementById('questionsArea');
const btnCreate = document.getElementById('btnCreate');
const created = document.getElementById('created');

let currentUser = null;
onAuthStateChanged(auth, user => {
  if(!user) location.href = 'login.html';
  currentUser = user;
});

function loadPreview() {
  const mode = modeSelect.value;
  const arr = mode === 'crush' ? questionsCrush : questionsAmi;
  questionsArea.innerHTML = '<p>Prévisualisation des questions (le nom de l\\'hôte sera inséré)</p>';
  arr.forEach((q,i) => {
    const text = q.question.replace(/__NOM__/g, hostNameInput.value || 'Hôte');
    questionsArea.innerHTML += `<div class="quizItem"><strong>Q${i+1}:</strong> ${text}<br>${q.options.map((o,idx)=>`<span class="opt">(${String.fromCharCode(65+idx)}) ${o}</span>`).join(' ')}</div>`;
  });
}
modeSelect.addEventListener('change', loadPreview);
hostNameInput.addEventListener('input', loadPreview);
loadPreview();

btnCreate.addEventListener('click', async ()=>{
  const host = hostNameInput.value.trim();
  if(!host) return alert('Entrez le prénom de l\\'hôte');
  // check VIP flag in users collection
  const uDoc = await getDoc(doc((await import('./firebase.js')).db, 'users', currentUser.uid));
  const uData = uDoc.exists() ? uDoc.data() : null;
  if(!uData || !uData.isVIP) return alert('Accès refusé : vous devez être VIP pour créer un défi.');
  const mode = modeSelect.value;
  const arr = mode === 'crush' ? questionsCrush : questionsAmi;
  // replace __NOM__
  const questions = arr.map(q => ({ question: q.question.replace(/__NOM__/g, host), options: q.options, answer: q.answer }));
  const res = await createDefi({ hostUid: currentUser.uid, hostName: host, mode, questions });
  created.classList.remove('hidden');
  created.innerHTML = `<p>✅ Défi créé !</p>
    <p><strong>UID :</strong> ${res.uid}</p>
    <p><strong>OwnerCode :</strong> ${res.ownerCode}</p>
    <p>Lien partageable : <input readonly style="width:100%" value="${location.origin + '/jouer.html?uid=' + res.uid}"></p>`;
});