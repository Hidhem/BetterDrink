/* === constantes & storage ==================================== */
let goal = 0, currentMl = 0;
let history = [];
let badges  = [];
let totals  = {};                 // { "YYYY-MM-DD": total ML }
let notifID = null;

const parseOr = (k, v) => JSON.parse(localStorage.getItem(k) || JSON.stringify(v));
goal      = parseInt(localStorage.getItem("waterGoal")) || 0;
currentMl = parseInt(localStorage.getItem("waterMl"))   || 0;
history   = parseOr("waterHistory", []);
badges    = parseOr("badges",       []);
totals    = parseOr("totals",       {});
const notifPref = localStorage.getItem("notifPref")==="on";

const today = new Date().toISOString().split("T")[0];
if (!totals[today]) totals[today]=0;

/* --- persistance --------------------------------------------- */
function saveAll() {
  localStorage.setItem("waterGoal", goal);
  localStorage.setItem("waterMl", currentMl);
  localStorage.setItem("waterHistory", JSON.stringify(history));
  localStorage.setItem("badges", JSON.stringify(badges));
  localStorage.setItem("totals", JSON.stringify(totals));
}

/* === UI ====================================================== */
function updateBottle() {
  if (!goal) return;
  const pct = currentMl / goal * 100;
  document.getElementById("waterLevel").style.height = Math.min(pct, 100) + "%";
  document.getElementById("display").innerText = `${currentMl} / ${goal} ml`;
  document.getElementById("g1").innerText = Math.round(goal / 2);
  document.getElementById("g2").innerText = goal;

  if (currentMl >= goal && !badges.some(b => b.endsWith("_done"))) {
    badges.push(new Date().toISOString() + "_done");
    alert("🎉 Objectif atteint !");
  }
  saveAll();
}

/* === actions utilisateur ===================================== */
function addMl(ml) {
  if (currentMl >= goal) return;
  currentMl = Math.min(currentMl + ml, goal);
  history.push(ml);
  totals[today] += ml;
  updateBottle();
}
function undoLast() {
  if (!history.length) return;
  const ml = history.pop();
  currentMl = Math.max(currentMl - ml, 0);
  totals[today] = Math.max(totals[today] - ml, 0);
  updateBottle();
}
function resetBottle() {
  currentMl = 0;
  history = [];
  totals[today] = 0;   // ← remettre à zéro la consommation du jour
  updateBottle();
}

/* === navigation simple ======================================= */
function switchPage(id) {
  document.querySelectorAll("main > section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* --- Paramètres ---------------------------------------------- */
function ouvrirParametres() {
  switchPage("settingsPage");
  document.getElementById("notifToggle").checked =
    notifPref && Notification.permission === "granted";
}
function fermerParametres() {
  switchPage("mainApp");
}

/* --- Succès -------------------------------------------------- */
function ouvrirSucces() {
  switchPage("successPage");
  afficherSucces();
}
function fermerSucces() {
  switchPage("mainApp");
}

function afficherSucces() {
  const ul = document.getElementById("successList");
  ul.innerHTML = "";
  badges.forEach(b => {
    if (b.endsWith("_done")) {
      const dt = new Date(b.slice(0, -5));
      const date = dt.toLocaleDateString('fr-FR');
      const time = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const li = document.createElement("li");
      li.innerHTML = `🏆 <strong>Objectif atteint</strong><br><small>${date} à ${time}</small>`;
      ul.appendChild(li);
    }
  });
  if (!ul.children.length) ul.innerHTML = "<li>Aucun succès pour l'instant.</li>";
}

/* --- Stats --------------------------------------------------- */
function ouvrirStats() {
  switchPage("statsPage");
  renderStats();
}
function fermerStats() {
  switchPage("mainApp");
}

let statsChart = null; // variable globale pour stocker le graphique

function renderStats() {
  const ctx = document.getElementById('statsChart').getContext('2d');

  const keys = Object.keys(totals).sort().slice(-7).reverse();

  // Format des labels en jour/mois (ex : 29/06)
  const labels = keys.map(d => {
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  });

  // Valeurs en ml
  const data = keys.map(d => totals[d] || 0);

  // Détruire le graphique existant pour ne pas empiler
  if (statsChart) statsChart.destroy();

  // Créer un nouveau graphique barres
  statsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Eau bue (ml)',
        data: data,
        backgroundColor: '#3498db',
        borderRadius: 5
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 250
          }
        }
      },
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: { enabled: true }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // NOTE : il manquait une accolade fermante ici dans ta version qui cassait tout
  // if(!ul.children.length) ul.innerHTML="<li>Aucune donnée.</li>";  -> supprimée car non pertinente ici
}

/* --- Formulaire objectif ------------------------------------- */
function validerFormulaire() {
  const p = parseFloat(document.getElementById("poids").value);
  if (isNaN(p) || p < 20 || p > 300) return alert("Poids invalide.");
  const act = document.getElementById("activite").value;
  const coef = act === "sedentaire" ? 30 : act === "intense" ? 40 : 35;
  goal = Math.round(p * coef);
  currentMl = 0;
  history = [];
  totals[today] = 0;
  saveAll();
  switchPage("mainApp");
  updateBottle();
}

/* --- Notifications (simple) ---------------------------------- */
function startNotifications() {
  if (notifID) return;
  notifID = setInterval(() => {
    if (Notification.permission === "granted") {
      registration.showNotification("💧 Temps de boire !", { body: "Touchez pour +250 ml" });
    }
  }, 60 * 60 * 1000);
}
function stopNotifications() {
  if (notifID) {
    clearInterval(notifID);
    notifID = null;
  }
}
function toggleNotif(chk) {
  if (chk) {
    if (Notification.permission === "granted") startNotifications();
    else
      Notification.requestPermission().then(p => {
        if (p === "granted") startNotifications();
        else chk.checked = false;
      });
    localStorage.setItem("notifPref", "on");
  } else {
    stopNotifications();
    localStorage.setItem("notifPref", "off");
  }
}

/* === init ===================================================== */
window.addEventListener("DOMContentLoaded", () => {
  if (goal) switchPage("mainApp");
  else switchPage("setupForm");
  updateBottle();

  if (notifPref && Notification.permission === "granted") startNotifications();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(reg => (window.registration = reg));
  }
});
