// script.js – TrueFriend Test + Firebase v12 modulaire + reCAPTCHA

// --- 1️⃣ IMPORTS FIREBASE (modulaire) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// --- 2️⃣ CONFIG PERSONNELLE ---
const firebaseConfig = {
  apiKey: "AIzaSyCUqG8PsbOiwusRbAX0KY4KexiF9l7mPCw",
  authDomain: "defi-amis-v1.firebaseapp.com",
  projectId: "defi-amis-v1",
  storageBucket: "defi-amis-v1.firebasestorage.app",
  messagingSenderId: "658529917029",
  appId: "1:658529917029:web:b3b2bdec77d66a7cc6ce8c",
  measurementId: "G-NTCXH5HFV2"
};

// --- 3️⃣ INITIALISATION ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 4️⃣ UTILS ---
function genUID(name="USER") {
  const n = name.toUpperCase().replace(/[^A-Z0-9]+/g,"").slice(0,5) || "USER";
  return `${n}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function burstConfetti(){
  const c=document.getElementById("confetti");if(!c)return;
  c.classList.remove("hidden");c.width=innerWidth;c.height=innerHeight;
  const ctx=c.getContext("2d"),parts=[];
  for(let i=0;i<100;i++)parts.push({x:Math.random()*c.width,y:-20,vx:(Math.random()-.5)*6,vy:Math.random()*4+2,r:Math.random()*6+2,color:["#ff4d7e","#ffd166","#06d6a0","#8ec5ff"][Math.floor(Math.random()*4)]});
  let t=0;function f(){ctx.clearRect(0,0,c.width,c.height);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.05;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
  if(t++<180)requestAnimationFrame(f);else c.classList.add("hidden");}f();
}

// --- 5️⃣ ROUTAGE SELON PAGE ---
const page = location.pathname.split("/").pop() || "index.html";

// INDEX ---------------------------------
if(page==="index.html"){
  document.getElementById("createBtn").onclick=()=>{
    const n=document.getElementById("hostName").value.trim();
    if(!n)return alert("Entre ton prénom !");
    sessionStorage.setItem("hostNameTemp",n);
    location.href="create.html";
  };
  document.getElementById("joinBtn").onclick=async()=>{
    const id=document.getElementById("joinUID").value.trim();
    if(!id)return alert("Entre un UID !");
    const d=await getDoc(doc(db,"rooms",id));
    if(!d.exists())return alert("Défi introuvable !");
    location.href=`jeu.html?uid=${id}`;
  };
}

// CREATE ---------------------------------
if(page==="create.html"){
  const QUESTIONS=[
    "Ton plat préféré ?",
    "Ta couleur préférée ?",
    "Ton sport préféré ?",
    "Ta qualité principale ?",
    "Ta saison préférée ?"
  ];
  const host=sessionStorage.getItem("hostNameTemp")||prompt("Ton prénom ?")||"Hôte";
  document.getElementById("title").textContent=`Créer le défi de ${host}`;
  const qWrap=document.getElementById("questions");
  QUESTIONS.forEach((q,i)=>{
    const d=document.createElement("div");d.className="question";
    d.innerHTML=`<label>${i+1}. ${q}</label><input id="a${i}" type="text" placeholder="Réponse de ${host}...">`;
    qWrap.appendChild(d);
  });

  // callback ReCAPTCHA invisible
  window.onSubmitRecaptcha=async()=>{
    const answers=[];for(let i=0;i<5;i++)answers.push(document.getElementById(`a${i}`).value.trim());
    const uid=genUID(host);
    try{
      await setDoc(doc(db,"rooms",uid),{host,answers,uid,createdAt:serverTimestamp()});
      const base=location.origin+location.pathname.replace(/create\.html.*$/,"");
      const link=`${base}jeu.html?uid=${uid}`;
      const box=document.getElementById("createdBox");
      box.classList.remove("hidden");
      box.innerHTML=`<h3>✅ Défi créé !</h3>
        <p><strong>UID:</strong> ${esc(uid)}</p>
        <input value="${link}" readonly style="width:100%;padding:8px;margin-top:6px">
        <div class="row" style="margin-top:8px">
          <button onclick="navigator.clipboard.writeText('${link}')" class="icon-btn">📋</button>
          <a target="_blank" href="https://wa.me/?text=${encodeURIComponent('Viens deviner les réponses de '+host+' : '+link)}" class="icon-btn">💬</a>
          <a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}" class="icon-btn">🔗</a>
          <a href="${link}" class="btn ghost">Voir la salle</a>
        </div>`;
    }catch(e){alert("Erreur : "+e.message);}
  };
}

// JEU ------------------------------------
if(page==="jeu.html"){
  const params=new URLSearchParams(location.search);
  const uid=params.get("uid");
  if(!uid)return location.href="index.html";
  const roomSnap=await getDoc(doc(db,"rooms",uid));
  if(!roomSnap.exists())return alert("Défi introuvable !");
  const room=roomSnap.data();
  document.getElementById("roomTitle").textContent=`Défi de ${room.host}`;
  document.getElementById("hostNameTitle").textContent=room.host;
  document.getElementById("roomInfo").textContent=`UID : ${uid}`;

  const startBtn=document.getElementById("startPlayBtn");
  const playerInput=document.getElementById("playerName");
  const quizForm=document.getElementById("quizForm");

  startBtn.onclick=()=>{
    const p=playerInput.value.trim();if(!p)return alert("Entre ton prénom");
    quizForm.innerHTML="";
    (room.answers||[]).forEach((_,i)=>{
      const q=document.createElement("div");q.className="question";
      q.innerHTML=`<label>${i+1}. Question</label><input id="r${i}" type="text" placeholder="Ta réponse">`;
      quizForm.appendChild(q);
    });
    const btn=document.createElement("button");btn.className="btn";btn.textContent="Terminer";
    btn.onclick=async ev=>{
      ev.preventDefault();
      let score=0;const g=[];(room.answers||[]).forEach((a,i)=>{
        const r=document.getElementById(`r${i}`).value.trim();g.push(r);
        if(a&&r&&a.toLowerCase()===r.toLowerCase())score++;
      });
      await addDoc(collection(db,"rooms",uid,"players"),{name:p,score,answers:g,playedAt:serverTimestamp()});
      document.getElementById("resultBox").classList.remove("hidden");
      document.getElementById("resultBox").innerHTML=`<h3>${esc(p)} : ${score}/${room.answers.length}</h3>`;
      burstConfetti();
    };
    quizForm.appendChild(btn);
    quizForm.classList.remove("hidden");
    document.getElementById("joinArea").classList.add("hidden");
  };

  // live leaderboard
  onSnapshot(query(collection(db,"rooms",uid,"players"),orderBy("score","desc")),snap=>{
    const ol=document.getElementById("leaderboard");ol.innerHTML="";
    snap.forEach(d=>{
      const v=d.data();
      ol.innerHTML+=`<li><strong>${esc(v.name)}</strong> – ${v.score}/${room.answers.length}</li>`;
    });
  });
}