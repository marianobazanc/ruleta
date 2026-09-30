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
let CANVAS_SIZE = 300;
let RADIO = CANVAS_SIZE / 2;
let girando = false;
let yaGiroAlgunaVez = false;

const result = document.getElementById("result");
const spinButton = document.getElementById("spin");

function configurarCanvas() {
  const wrapper = document.querySelector(".wheel-wrapper");
  const size = Math.floor(wrapper.getBoundingClientRect().width);
  if (size < 1) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  CANVAS_SIZE = size;
  RADIO = size / 2;
  canvas.width = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function pausarAnimacionGirar() {
  spinButton.classList.add("sin-animacion");
}

function reanudarAnimacionGirar() {
  girando = false;
  spinButton.classList.remove("sin-animacion");
  spinButton.classList.add("animacion-lenta");
}

function restaurarAnimacionSiPuedeGirar() {
  if (girando) return;
  spinButton.classList.remove("sin-animacion");
  if (yaGiroAlgunaVez) spinButton.classList.add("animacion-lenta");
}

configurarCanvas();

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
ctx.lineWidth = Math.max(2, CANVAS_SIZE / 150);
ctx.strokeStyle = "white";
ctx.stroke();
    ctx.fillStyle = "black";
    ctx.font = `bold ${Math.max(12, Math.round(CANVAS_SIZE * 0.038))}px sans-serif`;
    ctx.save();
    ctx.translate(RADIO, RADIO);
    ctx.rotate(angle + step / 2);
    ctx.textAlign = "right";
    ctx.fillText(sectores[i], RADIO - CANVAS_SIZE * 0.04, CANVAS_SIZE * 0.012);
    ctx.restore();
  }
}

function dibujarFlecha() {
  const mitad = Math.max(4, CANVAS_SIZE * 0.016);
  const punta = Math.max(14, CANVAS_SIZE * 0.055);
  ctx.beginPath();
  ctx.moveTo(RADIO - mitad, 0);
  ctx.lineTo(RADIO + mitad, 0);
  ctx.lineTo(RADIO, punta);
  ctx.fillStyle = "red";
  ctx.fill();
}

function girarRuleta(premioGanador) {
  const idx = sectores.indexOf(premioGanador);
  const gradosPorSector = 360 / sectores.length;
  const anguloObjetivo = 360 * 5 + (270 - (idx * gradosPorSector) - gradosPorSector / 2);

  let inicio = null;
  let duracion = 5000;

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
      // Mostrar resultado con animación casino y confeti
      mostrarResultadoCasino(premioGanador);
      setTimeout(() => {
        document.getElementById("explosion-container").innerHTML = "";
      }, 1500);
    }
  }

  requestAnimationFrame(animar);
}

let toqueSinSoltar = false;

spinButton.addEventListener("pointerdown", () => {
  if (girando) return;
  toqueSinSoltar = true;
  pausarAnimacionGirar();
});

spinButton.addEventListener("pointerup", () => {
  toqueSinSoltar = false;
});

spinButton.addEventListener("pointerleave", () => {
  if (!toqueSinSoltar || girando) return;
  toqueSinSoltar = false;
  restaurarAnimacionSiPuedeGirar();
});

spinButton.onclick = () => {
  if (girando) return;
  girando = true;
  pausarAnimacionGirar();
  esperarDB(() => {
    cargarPremios(() => {
      if (premiosHabilitados.length === 0) {
        girando = false;
        if (result) result.textContent = "No hay premios habilitados.";
        restaurarAnimacionSiPuedeGirar();
        return;
      }
      const habilitadosParaGanar = todosLosPremios.filter(p => p.habilitado);
      if (habilitadosParaGanar.length === 0) {
        girando = false;
        if (result) result.textContent = "No hay premios habilitados.";
        restaurarAnimacionSiPuedeGirar();
        return;
      }
      yaGiroAlgunaVez = true;
      const premioGanador = habilitadosParaGanar[Math.floor(Math.random() * habilitadosParaGanar.length)];
      sectores = todosLosPremios.map(p => p.nombre);

      dibujarRuleta();
      girarRuleta(premioGanador.nombre);
    });
  });
};

window.addEventListener("resize", () => {
  if (girando) return;
  configurarCanvas();
  if (sectores.length) {
    dibujarRuleta();
    dibujarFlecha();
  }
});

initDB();


