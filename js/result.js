// js/result.js
// page resultat.html: récupère dernier score dans URL ou Firestore si besoin
document.addEventListener('DOMContentLoaded', ()=>{
  const params = new URLSearchParams(location.search);
  const name = params.get('name');
  const score = params.get('score');
  const total = params.get('total');
  const el = document.getElementById('resultContent');
  if(name && score) {
    el.innerHTML = `<h3>${name}, ton score est ${score}/${total}</h3>`;
  } else {
    el.innerHTML = '<p>Aucun résultat récent.</p>';
  }
});