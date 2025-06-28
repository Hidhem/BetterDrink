/* === constantes & états globaux ================================ */
let goal      = 0;
let currentMl = 0;
let history   = [];
let badges    = [];
let notifID   = null;

/* === récupération des sauvegardes ============================== */
const getInt = k => parseInt(localStorage.getItem(k), 10);
goal      = getInt("waterGoal")    || goal;
currentMl = getInt("waterMl")      || currentMl;
history   = JSON.parse(localStorage.getItem("waterHistory") || "[]");
badges    = JSON.parse(localStorage.getItem("badges")       || "[]");
const notifPref = localStorage.getItem("notifPref") === "on";

/* === réinitialisation quotidienne ============================== */
const today    = new Date().toISOString().split("T")[0];
const lastDate = localStorage.getItem("lastDate");
if (lastDate !== today) {
  currentMl = 0;
  history   = [];
  localStorage.setItem("lastDate", today);
}

/* === persistance =============================================== */
function save() {
  localStorage.setItem("waterGoal",    goal);
  localStorage.setItem("waterMl",      currentMl);
  localStorage.setItem("waterHistory", JSON.stringify(history));
  localStorage.setItem("badges",       JSON.stringify(badges));
}

/* === UI update ================================================== */
function updateBottle() {
  if (!goal) return;
  const percent = (currentMl / goal) * 100;
  document.getElementById("waterLevel").style.height = Math.min(percent, 100) + "%";
  document.getElementById("display").innerText = `${currentMl} / ${goal} ml`;
  document.getElementById("g1").innerText = Math.round(goal / 2);
  document.getElementById("g2").innerText = goal;

  // badge «objectif atteint» avec date + heure ISO complète
  if (currentMl >= goal && !badges.some(b => b.endsWith("_done"))) {
    const nowISO = new Date().toISOString();
    badges.push(nowISO + "_done");
    alert("🎉 Bravo ! Objectif atteint aujourd’hui !");
  }
  save();
}

/* === actions ==================================================== */
function addMl(amount) {
  if (currentMl < goal) {
    currentMl = Math.min(currentMl + amount, goal);
    history.push(amount);
    updateBottle();
  }
}
function undoLast() { if (history.length) { currentMl = Math.max(currentMl - history.pop(), 0); updateBottle(); } }
function resetBottle() { currentMl = 0; history = []; updateBottle(); }

/* === formulaire objectif ======================================= */
function validerFormulaire() {
  const poids = parseFloat(document.getElementById("poids").value);
  if (isNaN(poids) || poids < 20 || poids > 300) return alert("Poids invalide.");
  const act   = document.getElementById("activite").value;
  const coef  = act === "sedentaire" ? 30 : act === "intense" ? 40 : 35;
  goal      = Math.round(poids * coef);
  currentMl = 0; history = [];
  localStorage.setItem("lastDate", today);
  save();
  document.getElementById("setupForm").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
  updateBottle();
}

function ouvrirFormulaire() {
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("settingsPage").classList.add("hidden");
  document.getElementById("successPage").classList.add("hidden");
  document.getElementById("setupForm").classList.remove("hidden");
}

/* === notifications ============================================= */
function startNotifications() {
  if (notifID) return;
  notifID = setInterval(() => {
    if (Notification.permission === "granted") {
      registration.showNotification("💧 Temps de boire un verre !", {
        body: "Touchez pour ajouter automatiquement 250 ml.",
        icon: "icon-192.png",
        vibrate: [100]
      });
    }
  }, 60 * 60 * 1000);
}
function stopNotifications() { if (notifID) clearInterval(notifID); notifID = null; }

function toggleNotif(chk) {
  if (chk) {
    if (Notification.permission === "granted") startNotifications();
    else Notification.requestPermission().then(p => {
      if (p === "granted") startNotifications();
      else chk.checked = false;
    });
    localStorage.setItem("notifPref", "on");
  } else { stopNotifications(); localStorage.setItem("notifPref", "off"); }
}

/* === paramètres ================================================ */
function ouvrirParametres() {
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("settingsPage").classList.remove("hidden");
  document.getElementById("successPage").classList.add("hidden");
  document.getElementById("notifToggle").checked = notifPref && Notification.permission === "granted";
}
function fermerParametres() {
  document.getElementById("settingsPage").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
}

/* === succès ================================================ */
function ouvrirSucces() {
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("settingsPage").classList.add("hidden");
  document.getElementById("successPage").classList.remove("hidden");
  afficherSucces();
}
function fermerSucces() {
  document.getElementById("successPage").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
}

function afficherSucces() {
  const list = document.getElementById("successList");
  list.innerHTML = "";

  if (badges.length === 0) {
    list.innerHTML = "<li>Aucun succès pour l'instant.</li>";
    return;
  }

  badges.forEach(badge => {
    if (badge.endsWith("_done")) {
      const datetimeStr = badge.slice(0, -5); // retire "_done"
      const dateObj = new Date(datetimeStr);

      const date = dateObj.toLocaleDateString('fr-FR');
      const heure = dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});

      const li = document.createElement("li");
      li.innerHTML = `🏆 <strong>Objectif atteint</strong><br><small>Le ${date} à ${heure}</small>`;
      list.appendChild(li);
    }
  });

  if (list.children.length === 0) {
    list.innerHTML = "<li>Aucun succès pour l'instant.</li>";
  }
}

/* === init ======================================================= */
window.addEventListener("DOMContentLoaded", () => {
  if (!goal) document.getElementById("setupForm").classList.remove("hidden");
  else { document.getElementById("mainApp").classList.remove("hidden"); updateBottle(); }

  if (notifPref && Notification.permission === "granted") startNotifications();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(reg => {
      console.log("✅ Service Worker actif");
      window.registration = reg;
    }).catch(err => console.error("Erreur SW :", err));
  }
});
