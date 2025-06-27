/* === constantes globales === */
let goal = 0;               // objectif quotidien (sera défini dynamiquement)
let currentMl = 0;          // quantité actuelle
let history = [];           // tableau des ajouts successifs

/* === récupération de la sauvegarde === */
const savedGoal    = localStorage.getItem("objectif");
const savedCurrent = localStorage.getItem("waterMl");
const savedHistory = localStorage.getItem("waterHistory");

if (savedGoal)    goal      = parseInt(savedGoal, 10);
if (savedCurrent) currentMl = parseInt(savedCurrent, 10);
if (savedHistory) {
  try { history = JSON.parse(savedHistory); } catch { history = []; }
}

/* === fonctions utilitaires === */
function save() {
  localStorage.setItem("waterMl", currentMl);
  localStorage.setItem("waterHistory", JSON.stringify(history));
}

/* === mettre à jour l'affichage de la bouteille === */
function updateBottle() {
  if (!goal) return;

  const percent = (currentMl / goal) * 100;
  document.getElementById("waterLevel").style.height = Math.min(percent, 100) + "%";
  document.getElementById("display").innerText = `${currentMl} / ${goal} ml`;

  // Graduation dynamique
  document.getElementById("g1").innerText = Math.round(goal / 2);
  document.getElementById("g2").innerText = goal;

  save();
  localStorage.setItem("objectif", goal);
}

/* === ajouter de l'eau === */
function addMl(amount) {
  if (currentMl < goal) {
    currentMl = Math.min(currentMl + amount, goal);
    history.push(amount);
    updateBottle();
  }
}

/* === annuler la dernière action === */
function undoLast() {
  if (history.length === 0) return;
  const lastAmount = history.pop();
  currentMl = Math.max(currentMl - lastAmount, 0);
  updateBottle();
}

/* === vider complètement === */
function resetBottle() {
  currentMl = 0;
  history = [];
  updateBottle();
}

/* === formulaire : valider et calculer l’objectif === */
function validerFormulaire() {
  const poids = parseFloat(document.getElementById("poids").value);
  if (!poids) { alert("Indique ton poids"); return; }

  const activite = document.getElementById("activite").value;
  let facteur = 35;
  if (activite === "sedentaire") facteur = 30;
  if (activite === "intense")    facteur = 40;

  goal = Math.round(poids * facteur);
  currentMl = 0;
  history = [];

  localStorage.setItem("objectif", goal);
  localStorage.removeItem("waterMl");
  localStorage.removeItem("waterHistory");

  // Affichage
  document.getElementById("setupForm").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  updateBottle();
}

/* === bouton pour rouvrir le formulaire plus tard === */
function ouvrirFormulaire() {
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("setupForm").classList.remove("hidden");
}

/* === initialisation au chargement de la page === */
window.addEventListener("DOMContentLoaded", () => {
  // Affichage selon présence de l'objectif
  if (!goal) {
    document.getElementById("setupForm").classList.remove("hidden");
  } else {
    document.getElementById("mainApp").classList.remove("hidden");
    updateBottle();
  }

  // Demande la permission de notifications si dispo
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        console.log("Notifications autorisées ✅");
      } else {
        console.log("Notifications refusées ❌");
      }
    });
  }

  // Notification toutes les 60 minutes (si autorisé)
  if ("Notification" in window && Notification.permission === "granted") {
    setInterval(() => {
      new Notification("💧 N'oublie pas de boire un peu d'eau !");
    }, 10 * 1000); // 1h = 60 min * 60 sec * 1000 ms
  }

  // Enregistrement du service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("✅ Service Worker actif"))
      .catch(err => console.error("Erreur SW :", err));
  }
});


/* notification */
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}
function envoyerNotification() {
  if (Notification.permission === "granted") {
    new Notification("💧 Il est temps de boire une gorgée d'eau !");
  }
}
if (document.getElementById("notifToggle").checked) {
  setInterval(envoyerNotification, 60 * 60 * 1000);
}
