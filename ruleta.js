if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("✅ Service Worker registrado"))
    .catch(err => console.error("❌ Error al registrar SW", err));
}
const premiosIniciales = [
  { nombre: "Gorra", habilitado: true },
  { nombre: "Remera", habilitado: true },
  { nombre: "Llavero", habilitado: true },
  { nombre: "Taza", habilitado: true },
  { nombre: "Premio Sorpresa", habilitado: false },
  { nombre: "Auto 0km", habilitado: true }
];

let db;
let todosLosPremios = [];
let premiosHabilitados = [];
let sectores = [];

function esperarDB(callback) {
  if (db) {
    callback();
  } else {
    setTimeout(() => esperarDB(callback), 100); // espera hasta que db esté definida
  }
}

function initDB() {
  const request = indexedDB.open("RuletaDB", 1);

  request.onupgradeneeded = function (e) {
    db = e.target.result;
    const store = db.createObjectStore("premios", { keyPath: "nombre" });
    premiosIniciales.forEach(p => store.add(p));
  };

  request.onsuccess = function (e) {
  db = e.target.result;

  esperarDB(() => {
  cargarPremios(() => {
    sectores = todosLosPremios.map(p => p.nombre);
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
    todosLosPremios = req.result;
    premiosHabilitados = todosLosPremios.filter(p => p.habilitado);
    callback();
  };
}

function habilitarPremio(nombre) {
  const tx = db.transaction("premios", "readwrite");
  const store = tx.objectStore("premios");
  const req = store.get(nombre);
  req.onsuccess = () => {
    const premio = req.result;
    premio.habilitado = true;
    store.put(premio);
  };
}

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const result = document.getElementById("result");
const spinButton = document.getElementById("spin");

function dibujarRuleta() {
  const step = 2 * Math.PI / sectores.length;
  for (let i = 0; i < sectores.length; i++) {
    const angle = i * step;
    ctx.beginPath();
    ctx.fillStyle = `hsl(${i * 60}, 70%, 60%)`;
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, angle, angle + step);
    ctx.lineTo(150, 150);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.font = "14px sans-serif";
    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(angle + step / 2);
    ctx.textAlign = "right";
    ctx.fillText(sectores[i], 140, 5);
    ctx.restore();
  }
}

function dibujarFlecha() {
  ctx.beginPath();
  ctx.moveTo(145, 0);
  ctx.lineTo(155, 0);
  ctx.lineTo(150, 20);
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

    ctx.clearRect(0, 0, 300, 300);
    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(angulo);
    ctx.translate(-150, -150);
    dibujarRuleta();
    ctx.restore();
    dibujarFlecha();

    if (progreso < 1) {
      requestAnimationFrame(animar);
    } else {
      result.textContent = `¡Ganaste: ${premioGanador}!`;
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
    const premioGanador = premiosHabilitados[Math.floor(Math.random() * premiosHabilitados.length)];
    console.log("premio ganador", premioGanador);
    sectores = todosLosPremios.map(p => p.nombre);
    dibujarRuleta();
    girarRuleta(premioGanador.nombre);
  });
});
  
};

initDB();
esperarDB(() => {
cargarPremios(() => {
  sectores = todosLosPremios.map(p => p.nombre);
  dibujarRuleta();
  dibujarFlecha(); // para mostrar la flecha también al inicio
})
});