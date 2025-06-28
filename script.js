/* === constantes & états globaux ================================= */
let goal      = 0;    // objectif ml
let currentMl = 0;    // quantité bue
let history   = [];   // liste des ajouts
let badges    = [];   // badges débloqués
let notifID   = null; // id de l'intervalle notifications

/* === récupération des sauvegardes ============================== */
const getInt = key => parseInt(localStorage.getItem(key), 10);
goal        = getInt("waterGoal")    || goal;
currentMl   = getInt("waterMl")      || currentMl;
history     = JSON.parse(localStorage.getItem("waterHistory") || "[]");
badges      = JSON.parse(localStorage.getItem("badges")       || "[]");
const notifPref = localStorage.getItem("notifPref") === "on";

/* === réinitialisation quotidienne ============================== */
const today    = new Date().toISOString().split("T")[0];
const lastDate = localStorage.getItem("lastDate");
if (lastDate !== today) {
  currentMl = 0;
  history   = [];
  localStorage.setItem("lastDate", today);
}

/* === utils persistance ========================================= */
function save() {
  localStorage.setItem("waterGoal",    goal);
  localStorage.setItem("waterMl",      currentMl);
  localStorage.setItem("waterHistory", JSON.stringify(history));
  localStorage.setItem("badges",       JSON.stringify(badges));
}

/* === mise à jour visuelle ======================================= */
function updateBottle() {
  if (!goal) return;
  const percent = (currentMl / goal) * 100;
  document.getElementById("waterLevel").style.height = Math.min(percent, 100) + "%";
  document.getElementById("display").innerText = `${currentMl} / ${goal} ml`;
  document.getElementById("g1").innerText = Math.round(goal / 2);
  document.getElementById("g2").innerText = goal;

  // badge «objectif atteint»
  if (currentMl >= goal && !badges.includes(today + "_done")) {
    badges.push(today + "_done");
    alert("🎉 Bravo ! Objectif atteint aujourd’hui !");
  }
  save();
}

/* === actions utilisateur ======================================= */
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

/* === formulaire objectif ======================================= */
function validerFormulaire() {
  const poids = parseFloat(document.getElementById("poids").value);
  if (isNaN(poids) || poids < 20 || poids > 300) {
    alert("Merci d’indiquer un poids valide.");
    return;
  }
  const activite = document.getElementById("activite").value;
  let facteur = activite === "sedentaire" ? 30 : activite === "intense" ? 40 : 35;
  goal      = Math.round(poids * facteur);
  currentMl = 0;
  history   = [];
  localStorage.setItem("lastDate", today);
  save();
  document.getElementById("setupForm").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
  updateBottle();
}

function ouvrirFormulaire() {
  // cacher TOUT sauf le formulaire
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("settingsPage").classList.add("hidden");   // << ajouter cette ligne
  document.getElementById("setupForm").classList.remove("hidden");
}

/* === notifications ============================================= */
function startNotifications() {
  if (notifID) return; // déjà actif
  notifID = setInterval(() => {
    new Notification("💧 N’oublie pas de boire un peu d’eau !");
  }, 60 * 60 * 1000);
}

function stopNotifications() {
  if (notifID) clearInterval(notifID);
  notifID = null;
}

function toggleNotif(checked) {
  if (checked) {
    if (Notification.permission === "granted") startNotifications();
    else Notification.requestPermission().then(p => {
      if (p === "granted") startNotifications();
      else document.getElementById("notifToggle").checked = false;
    });
    localStorage.setItem("notifPref", "on");
  } else {
    stopNotifications();
    localStorage.setItem("notifPref", "off");
  }
}

/* === paramètres ================================================ */
function ouvrirParametres() {
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("settingsPage").classList.remove("hidden");
  const cb = document.getElementById("notifToggle");
  cb.checked = notifPref && Notification.permission === "granted";
}

function fermerParametres() {
  document.getElementById("settingsPage").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
}

/* === initialisation DOMContentLoaded ============================ */
window.addEventListener("DOMContentLoaded", () => {
  // affichage initial
  if (!goal) {
    document.getElementById("setupForm").classList.remove("hidden");
  } else {
    document.getElementById("mainApp").classList.remove("hidden");
    updateBottle();
  }

  // notifications selon préférence sauvegardée
  if (notifPref && Notification.permission === "granted") startNotifications();

  // service worker (offline + install)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("✅ Service Worker actif"))
      .catch(err => console.error("Erreur SW :", err));
  }
});
