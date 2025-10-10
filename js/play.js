// js/play.js
import { getDefi, addParticipant, getParticipants } from './main.js';
import { auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const uidInput = document.getElementById('uidInput');
const openBtn = document.getElementById('openBtn');
const openUrlBtn = document.getElementById('openUrlBtn');
const roomDiv = document.getElementById('room');
const hostNameEl = document.getElementById('hostName');
const roomModeEl = document.getElementById('roomMode');
const questionZone = document.getElementById('questionZone');
const playerName = document.getElementById('playerName');
const playBtn = document.getElementById('playBtn');
const resultBox = document.getElementById('resultBox');
const hostDisplay = document.getElementById('hostDisplay');
const podium = document.getElementById('podium');
const leaderboard = document.getElementById('leaderboard');
const ownerPanel = document.getElementById('ownerPanel');
const ownerCodeInput = document.getElementById('ownerCode');
const checkOwner = document.getElementById('checkOwner');

let currentDefi = null;
let currentUID = null;
let answers = {};
let currentUser = null;

onAuthStateChanged(auth, user => { currentUser = user; });

openBtn.onclick = () => openRoom(uidInput.value.trim());
openUrlBtn.onclick = () => {
  const params = new URLSearchParams(location.search);
  const uid = params.get('uid'); if(uid) openRoom(uid); else alert('Aucun UID dans l\\'URL.');
};

async function openRoom(uid) {
  if(!uid) return alert('Entrez l\'UID.');
  try {
    const u = new URL(uid);
    const p = new URLSearchParams(u.search);
    if(p.get('uid')) uid = p.get('uid');
  } catch(e){}
  const r = await getDefi(uid);
  if(!r) return alert('Défi introuvable.');
  currentDefi = r; currentUID = uid;
  hostNameEl.textContent = r.hostName;
  roomModeEl.textContent = r.mode === 'ami' ? 'Mode Amitié' : 'Mode Crush';
  hostDisplay.textContent = r.hostName;
  renderQuestions(r.questions);
  roomDiv.classList.remove('hidden');
  renderLeaderboard();
  ownerPanel.classList.remove('hidden');
}

function renderQuestions(questions){
  questionZone.innerHTML = '';
  questions.forEach((q,i) => {
    const div = document.createElement('div'); div.className = 'quizItem';
    div.innerHTML = `<p>${i+1}. ${q.question}</p>`;
    q.options.forEach((opt, idx) => {
      const b = document.createElement('button'); b.className = 'optionBtn'; b.textContent = opt;
      b.onclick = () => { answers[i] = idx; const siblings = b.parentNode.querySelectorAll('.optionBtn'); siblings.forEach(s=>s.classList.remove('selected')); b.classList.add('selected'); };
      div.appendChild(b);
    });
    questionZone.appendChild(div);
  });
}

playBtn.onclick = async () => {
  const name = playerName.value.trim();
  if(!name) return alert('Entrez votre prénom.');
  // compute score
  const total = currentDefi.questions.length;
  let score = 0;
  currentDefi.questions.forEach((q,i) => { const g = typeof answers[i] === 'number' ? answers[i] : -1; if(g === q.answer) score++; });
  // prepare player object
  const player = { uid: currentUser ? currentUser.uid : null, name, score };
  try {
    await addParticipant(currentUID, player);
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `<h3>Résultat : ${score} / ${total}</h3><p>Merci d'avoir joué !</p>`;
    renderLeaderboard();
  } catch(e) {
    alert('Erreur: ' + e.message);
  }
};

async function renderLeaderboard(){
  const arr = await getParticipants(currentUID);
  leaderboard.innerHTML = '';
  if(!arr.length){ leaderboard.innerHTML = '<li>Aucun joueur</li>'; podium.innerHTML = ''; return; }
  const top = arr.slice(0,3);
  podium.innerHTML = top.map((p,i)=>`<div class="slot">${i===0?'🥇':i===1?'🥈':'🥉'}<br><strong>${p.name}</strong><div>${p.score}</div></div>`).join('');
  arr.forEach(p => { const li = document.createElement('li'); li.innerHTML = `<strong>${p.name}</strong> — ${p.score} pts ${p.verified?'<span class="small">✅</span>':''}`; leaderboard.appendChild(li); });
}

checkOwner.onclick = async () => {
  const code = ownerCodeInput.value.trim();
  if(!code) return alert('Entrez OwnerCode');
  if(!currentDefi) return alert('Ouvrez d\\'abord le défi');
  if(code === currentDefi.ownerCode) {
    alert('Owner vérifié.');
    // show participant list (simple)
    const arr = await getParticipants(currentUID);
    const panel = document.createElement('div'); panel.className = 'created';
    panel.innerHTML = '<h4>Participants</h4>' + arr.map(p => `<div class="item"><strong>${p.name}</strong> — ${p.score} pts</div>`).join('');
    roomDiv.appendChild(panel);
  } else alert('OwnerCode invalide.');
};