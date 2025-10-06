import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// --- Configuration Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyCUqG8PsbOiwusRbAX0KY4KexiF9l7mPCw",
  authDomain: "defi-amis-v1.firebaseapp.com",
  projectId: "defi-amis-v1",
  storageBucket: "defi-amis-v1.firebasestorage.app",
  messagingSenderId: "658529917029",
  appId: "1:658529917029:web:b3b2bdec77d66a7cc6ce8c",
  measurementId: "G-NTCXH5HFV2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Questions ---
const questions = [
  "Ton plat préféré ?",
  "Ton sport préféré ?",
  "Ta couleur favorite ?",
  "Ton animal préféré ?",
  "Ta chanson du moment ?"
];

// --- Sélecteurs DOM ---
const createSection = document.getElementById("create-section");
const questionsSection = document.getElementById("questions-section");
const shareSection = document.getElementById("share-section");
const playSection = document.getElementById("play-section");
const resultSection = document.getElementById("result-section");
const errorSection = document.getElementById("error-section");

const hostNameInput = document.getElementById("hostName");
const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer-input");
const shareLink = document.getElementById("share-link");
const playTitle = document.getElementById("play-title");
const playQuestion = document.getElementById("play-question");
const playAnswer = document.getElementById("play-answer");
const scoreText = document.getElementById("score-text");

// --- Variables ---
let currentQuestionIndex = 0;
let answers = [];
let currentDefiUID = null;
let currentDefi = null;
let playAnswers = [];
let score = 0;

// --- Créer un défi ---
document.getElementById("startDefi").onclick = async () => {
  const hostName = hostNameInput.value.trim();
  if(!hostName) return alert("Entre ton prénom !");

  createSection.classList.add("hidden");
  questionsSection.classList.remove("hidden");
  questionText.textContent = `${questions[currentQuestionIndex]} (${hostName})`;

  document.getElementById("next-question").onclick = async () => {
    const ans = answerInput.value.trim();
    if(!ans) return alert("Entre ta réponse !");
    answers.push({question:questions[currentQuestionIndex],answer:ans});
    answerInput.value="";
    currentQuestionIndex++;
    if(currentQuestionIndex<questions.length){
      questionText.textContent=`${questions[currentQuestionIndex]} (${hostName})`;
    } else {
      // Sauvegarde Firestore
      const uid = Math.random().toString(36).substring(2,10);
      await setDoc(doc(db,"defis",uid),{
        uid,
        host:hostName,
        questions:answers,
        createdAt:new Date().toISOString()
      });
      currentDefiUID=uid;
      questionsSection.classList.add("hidden");
      shareSection.classList.remove("hidden");
      const url=`${window.location.origin}${window.location.pathname}?defi=${uid}`;
      shareLink.value=url;
      document.getElementById("share-whatsapp").href=`https://wa.me/?text=${encodeURIComponent("Joue à mon défi Défi-Amis ! 👉 "+url)}`;
      document.getElementById("share-facebook").href=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    }
  };
};

// --- Jouer à un défi existant ---
async function loadDefi(uid){
  const docRef=doc(db,"defis",uid);
  const docSnap=await getDoc(docRef);
  if(!docSnap.exists()){errorSection.classList.remove("hidden");return;}
  currentDefi=docSnap.data();
  playSection.classList.remove("hidden");
  playTitle.textContent=`Défi de ${currentDefi.host}`;
  playQuestion.textContent=currentDefi.questions[0].question;
  let i=0;
  document.getElementById("play-next").onclick=async()=>{
    const r=playAnswer.value.trim();
    if(!r)return alert("Entre ta réponse !");
    playAnswers.push(r);
    playAnswer.value="";
    i++;
    if(i<currentDefi.questions.length){
      playQuestion.textContent=currentDefi.questions[i].question;
    }else{
      // Calcul score
      score=0;
      for(let j=0;j<currentDefi.questions.length;j++){
        if(playAnswers[j].toLowerCase()===currentDefi.questions[j].answer.toLowerCase())score++;
      }
      await addDoc(collection(db,"reponses"),{
        defiId:uid,
        nom:prompt("Ton prénom :")||"Anonyme",
        score:score,
        date:new Date().toISOString()
      });
      playSection.classList.add("hidden");
      resultSection.classList.remove("hidden");
      scoreText.textContent=`Tu as obtenu ${score}/${currentDefi.questions.length} !`;
    }
  };
}

// --- Si URL contient un défi ---
const params=new URLSearchParams(window.location.search);
const uid=params.get("defi");
if(uid){ createSection.classList.add("hidden"); loadDefi(uid); }

// --- Créer son propre défi ---
document.getElementById("create-own").onclick=()=>{
  window.location.href=window.location.pathname;
};