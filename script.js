/* === constantes et états globaux ================================= */
let goal = 0;               // objectif quotidien (sera défini dynamiquement)
let currentMl = 0;          // quantité actuelle
let history = [];           // historique des ajouts
let badges  = [];           // liste des badges obtenus

/* === récupération des sauvegardes ================================ */
const savedGoal    = localStorage.getItem("waterGoal");
const savedCurrent = localStorage.getItem("waterMl");
const savedHistory = localStorage.getItem("waterHistory");
const savedBadges  = localStorage.getItem("badges");

if (savedGoal)    goal      = parseInt(savedGoal, 10);
if (savedCurrent) currentMl = parseInt(savedCurrent, 10);
if (savedHistory) {
  try { history = JSON.parse(savedHistory); } catch { history = []; }
}
if (savedBadges) {
  try { badges = JSON.parse(savedBadges); } catch { badges = []; }
}

/* === réinitialisation quotidienne ================================ */
const today    = new Date().toISOString().split("T")[0];           // "YYYY-MM-DD"
const lastDate = localStorage.getItem("lastDate");

if (lastDate !== today) {
  currentMl = 0;
  history   = [];
  localStorage.setItem("lastDate", today);
}

/* === fonctions utilitaires ======================================= */
function save() {
  localStorage.setItem("waterMl",      currentMl);
  localStorage.setItem("waterHistory", JSON.stringify(history));
  localStorage.setItem("badges",       JSON.stringify(badges));
  localStorage.setItem("waterGoal",    goal);
}

function updateBottle() {
  if (!goal) return;
  const percent = (currentMl / goal) * 100;
  document.getElementById("waterLevel").style.height = Math.min(percent, 100) + "%";
  document.getElementById("display").innerText = `${currentMl} / ${goal} ml`;

  // graduation dynamique
  document.getElementById("g1").innerText = Math.round(goal / 2);
  document.getElementById("g2").innerText = goal;

  // badge «objectif atteint»
  if (currentMl >= goal && !badges.includes(today + "_done")) {
    badges.push(today + "_done");
    alert("🎉 Bravo ! Objectif atteint aujourd’hui !");
  }

  save();
}

/* === actions utilisateur ========================================= */
function addMl(amount) {
  if (currentMl < goal) {
    currentMl = Math.min(currentMl + amount, goal);
    history.push(amount);
    updateBottle();
  }
}

function undoLast() {
  if (!history.length) return;
  currentMl = Math.max(currentMl - history.pop(), 0);
  updateBottle();
}

function resetBottle() {
  currentMl = 0;
  history   = [];
  updateBottle();
}

/* === formulaire de démarrage ===================================== */
function validerFormulaire() {
  const poids = parseFloat(document.getElementById("poids").value);
  if (isNaN(poids) || poids < 20 || poids > 300) {
    alert("Merci d’indiquer un poids valide.");
    return;
  }
  const activite = document.getElementById("activite").value;
  let facteur = 35;
  if (activite === "sedentaire") facteur = 30;
  if (activite === "intense")    facteur = 40;

  goal      = Math.round(poids * facteur);
  currentMl = 0;
  history   = [];
  localStorage.setItem("lastDate", today);   // nouveau départ
  save();

  document.getElementById("setupForm").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
  updateBottle();
}

function ouvrirFormulaire() {
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("setupForm").classList.remove("hidden");
}

/* === initialisation ============================================== */
window.addEventListener("DOMContentLoaded", () => {
  // Affichage selon présence de l’objectif
  if (!goal) {
    document.getElementById("setupForm").classList.remove("hidden");
  } else {
    document.getElementById("mainApp").classList.remove("hidden");
    updateBottle();
  }

  /* Permissions notifications */
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then(p => console.log("Permission :", p));
  }

  /* Notification horaire (si autorisée) */
  if ("Notification" in window && Notification.permission === "granted") {
    setInterval(() => {
      new Notification("💧 N’oublie pas de boire un peu d’eau !");
    }, 60 * 60 * 1000); // toutes les 60 min
  }

  /* Service worker */
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("✅ Service Worker actif"))
      .catch(err => console.error("Erreur SW :", err));
  }
});
