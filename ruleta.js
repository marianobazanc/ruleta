// Ruleta principal con premios desde IndexedDB con id único y position

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("✅ Service Worker registrado"))
    .catch(err => console.error("❌ Error al registrar SW", err));
}

let db;
let todosLosPremios = [];
let premiosHabilitados = [];
let sectores = [];

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const CANVAS_SIZE = 600;
const RADIO = CANVAS_SIZE / 2;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const result = document.getElementById("result");
const spinButton = document.getElementById("spin");

function esperarDB(callback) {
  if (db) {
    callback();
  } else {
    setTimeout(() => esperarDB(callback), 100);
  }
}

function initDB() {
  const request = indexedDB.open("RuletaDB", 2);

  request.onupgradeneeded = function (e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains("premios")) {
      db.createObjectStore("premios", { keyPath: "id" });
    } else {
      const store = e.target.transaction.objectStore("premios");
      // No borramos ni tocamos premios existentes
    }
  };

  request.onsuccess = function (e) {
    db = e.target.result;
    esperarDB(() => {
      cargarPremios(() => {
        sectores = premiosHabilitados.map(p => p.nombre);
        dibujarRuleta();
        dibujarFlecha();
      });
    });
  };

  request.onerror = function () {
    alert("Error al iniciar la base de datos");
  };
}

function cargarPremios(callback) {
  const tx = db.transaction("premios", "readonly");
  const store = tx.objectStore("premios");
  const req = store.getAll();
  req.onsuccess = () => {
    todosLosPremios = req.result.sort((a, b) => a.position - b.position);
    premiosHabilitados = todosLosPremios;
    callback();
  };
}

function dibujarRuleta() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const step = 2 * Math.PI / sectores.length;
  for (let i = 0; i < sectores.length; i++) {
    const angle = i * step;
    ctx.beginPath();
const coloresBasicos = [ "#F8D514", "#F77F76", "#94C9EC", "#DDABDD"
];
ctx.fillStyle = coloresBasicos[i % coloresBasicos.length];

    ctx.moveTo(RADIO, RADIO);
    ctx.arc(RADIO, RADIO, RADIO, angle, angle + step);
    ctx.lineTo(RADIO, RADIO);
    ctx.fill();
ctx.lineWidth = 2;
ctx.strokeStyle = "white";
ctx.stroke();
    ctx.fillStyle = "black";
    ctx.font = "16px sans-serif";
    ctx.save();
    ctx.translate(RADIO, RADIO);
    ctx.rotate(angle + step / 2);
    ctx.textAlign = "right";
    ctx.fillText(sectores[i], RADIO - 10, 5);
    ctx.restore();
  }
}

function dibujarFlecha() {
  ctx.beginPath();
  ctx.moveTo(RADIO - 5, 0);
  ctx.lineTo(RADIO + 5, 0);
  ctx.lineTo(RADIO, 20);
  ctx.fillStyle = "red";
  ctx.fill();
}

function girarRuleta(premioGanador) {
  const idx = sectores.indexOf(premioGanador);
  const gradosPorSector = 360 / sectores.length;
  const anguloObjetivo = 360 * 5 + (270 - (idx * gradosPorSector) - gradosPorSector / 2);

  let inicio = null;
  let duracion = 4000;

  function animar(ts) {
    if (!inicio) inicio = ts;
    const tiempo = ts - inicio;
    const progreso = Math.min(tiempo / duracion, 1);
    const easeOut = 1 - Math.pow(1 - progreso, 3);
    const angulo = anguloObjetivo * easeOut * Math.PI / 180;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.save();
    ctx.translate(RADIO, RADIO);
    ctx.rotate(angulo);
    ctx.translate(-RADIO, -RADIO);
    dibujarRuleta();
    ctx.restore();
    dibujarFlecha();

    if (progreso < 1) {
      requestAnimationFrame(animar);
    } else {
      result.textContent = `¡Ganaste: ${premioGanador}!`;
      result.classList.remove("animar-resultado");
      void result.offsetWidth;
      result.classList.add("animar-resultado");
      setTimeout(() => {
        document.getElementById("explosion-container").innerHTML = "";
      }, 1500);
    }
  }

  requestAnimationFrame(animar);
}

spinButton.onclick = () => {
  esperarDB(() => {
    cargarPremios(() => {
      if (premiosHabilitados.length === 0) {
        result.textContent = "No hay premios habilitados.";
        return;
      }
      const habilitadosParaGanar = todosLosPremios.filter(p => p.habilitado);
      if (habilitadosParaGanar.length === 0) {
        result.textContent = "No hay premios habilitados.";
        return;
      }
      const premioGanador = habilitadosParaGanar[Math.floor(Math.random() * habilitadosParaGanar.length)];
      sectores = todosLosPremios.map(p => p.nombre);

      dibujarRuleta();
      girarRuleta(premioGanador.nombre);
    });
  });
};

initDB();
