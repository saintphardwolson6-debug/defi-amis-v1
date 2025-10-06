import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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

// Elements
const startButton = document.getElementById("startButton");
const hostNameInput = document.getElementById("hostName");
const questionSection = document.getElementById("question-section");
const nextButton = document.getElementById("nextButton");
const createSection = document.getElementById("create-section");
const shareSection = document.getElementById("share-section");
const shareLink = document.getElementById("shareLink");
const copyLink = document.getElementById("copyLink");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const answerSection = document.getElementById("answer-section");
const answerOptions = document.getElementById("answer-options");
const answerQuestion = document.getElementById("answer-question");
const submitButton = document.getElementById("submitAnswer");
const playerNameInput = document.getElementById("playerName");
const publicResults = document.getElementById("public-results");
const playersList = document.getElementById("players-list");
const resultDiv = document.getElementById("results");

let hostName = "";
let uid = "";
let currentQuestionIndex = 0;
let answers = {};

const questions = [
  { q: "Quel est le sport préféré de ", o: ["Football", "Basketball", "Tennis", "Natation"] },
  { q: "Quel est le plat préféré de ", o: ["Pizza", "Burger", "Riz", "Spaghetti"] },
  { q: "Quelle est la couleur préférée de ", o: ["Rouge", "Bleu", "Noir", "Vert"] },
  { q: "Quel est le passe-temps préféré de ", o: ["Dormir", "Jouer", "Lire", "Regarder des films"] },
  { q: "Quel genre de musique aime ", o: ["Rap", "Afro", "Kompa", "R&B"] }
];

// Génère UID
function generateUID() {
  return Math.random().toString(36).substring(2, 10);
}

startButton.addEventListener("click", async () => {
  hostName = hostNameInput.value.trim();
  if (!hostName) return alert("Entre ton prénom !");
  createSection.classList.add("hidden");
  questionSection.classList.remove("hidden");
  showQuestion();
});

function showQuestion() {
  const q = questions[currentQuestionIndex];
  questionText.textContent = q.q + hostName + " ?";
  optionsDiv.innerHTML = "";

  q.o.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.addEventListener("click", () => selectAnswer(option));
    optionsDiv.appendChild(btn);
  });
}

function selectAnswer(answer) {
  const qKey = "q" + currentQuestionIndex;
  answers[qKey] = answer;
  nextButton.classList.remove("hidden");
}

nextButton.addEventListener("click", async () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    nextButton.classList.add("hidden");
    showQuestion();
  } else {
    uid = generateUID();
    await setDoc(doc(db, "defis", uid), {
      hostName,
      answers,
      results: [],
      createdAt: new Date()
    });

    questionSection.classList.add("hidden");
    shareSection.classList.remove("hidden");
    shareLink.value = `${window.location.origin}${window.location.pathname}?uid=${uid}`;
    document.getElementById("view-results").classList.remove("hidden");
    document.getElementById("viewResultsLink").href = `${window.location.origin}${window.location.pathname}?uid=${uid}&view=results`;
  }
});

copyLink.addEventListener("click", () => {
  navigator.clipboard.writeText(shareLink.value);
  alert("Lien copié !");
});

// --- Mode Ami (jouer un défi)
const urlParams = new URLSearchParams(window.location.search);
const friendUID = urlParams.get("uid");
const viewMode = urlParams.get("view");

if (friendUID && !viewMode) {
  createSection.classList.add("hidden");
  answerSection.classList.remove("hidden");
  loadDefi(friendUID);
}

// --- Mode Hôte (voir résultats publics)
if (friendUID && viewMode === "results") {
  createSection.classList.add("hidden");
  loadResults(friendUID);
}

async function loadDefi(uid) {
  const docRef = doc(db, "defis", uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    document.body.innerHTML = "<h2>⚠️ Défi introuvable...</h2>";
    return;
  }

  const data = docSnap.data();
  hostName = data.hostName;
  let index = 0;
  let friendAnswers = {};

  showFriendQuestion();

  function showFriendQuestion() {
    const q = questions[index];
    answerQuestion.textContent = q.q + hostName + " ?";
    answerOptions.innerHTML = "";

    q.o.forEach(option => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.addEventListener("click", () => {
        friendAnswers["q" + index] = option;
        if (index < questions.length - 1) {
          index++;
          showFriendQuestion();
        } else {
          submitButton.classList.remove("hidden");
        }
      });
      answerOptions.appendChild(btn);
    });
  }

  submitButton.addEventListener("click", async () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) return alert("Entre ton prénom !");
    let score = 0;
    for (let key in friendAnswers) {
      if (friendAnswers[key] === data.answers[key]) score++;
    }

    await updateDoc(docRef, {
      results: arrayUnion({ name: playerName, score })
    });

    answerSection.classList.add("hidden");
    document.getElementById("result-section").classList.remove("hidden");
    resultDiv.innerHTML = `<h3>Tu connais ${hostName} à ${score}/${questions.length} !</h3>`;
  });
}

async function loadResults(uid) {
  const docRef = doc(db, "defis", uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    document.body.innerHTML = "<h2>⚠️ Défi introuvable...</h2>";
    return;
  }

  const data = docSnap.data();
  publicResults.classList.remove("hidden");
  const list = data.results || [];

  if (list.length === 0) {
    playersList.innerHTML = "<p>Aucun joueur n’a encore participé.</p>";
  } else {
    playersList.innerHTML = list
      .map(p => `<p>⭐ ${p.name} — ${p.score}/${questions.length}</p>`)
      .join("");
  }
}