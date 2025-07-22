if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("✅ Service Worker registrado"))
    .catch(err => console.error("❌ Error al registrar SW", err));
}

// formulario.js
const dbRequest = indexedDB.open("LeadsDB", 1);
let db;
let arrayLeads = [];

dbRequest.onupgradeneeded = function (e) {
  db = e.target.result;
  if (!db.objectStoreNames.contains("leads")) {
    db.createObjectStore("leads", { keyPath: "id", autoIncrement: true });
  }
};

dbRequest.onsuccess = function (e) {
  db = e.target.result;
  cargarLeadsEnMemoria();
};

dbRequest.onerror = function () {
  alert("Error al iniciar la base de datos de leads");
};

document.getElementById("leadForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const lead = {
    nombre: document.getElementById("nombre").value.trim(),
    apellido: document.getElementById("apellido").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    email: document.getElementById("email").value.trim(),
    interes: document.getElementById("interes").value.trim(),
  };

  if (Object.values(lead).some(val => val === "")) {
    alert("Por favor completá todos los campos.");
    return;
  }

  const tx = db.transaction("leads", "readwrite");
  const store = tx.objectStore("leads");
  const req = store.add(lead); // Usamos add para que IndexedDB cree el id automático

  req.onsuccess = function () {
    arrayLeads.push(lead);
    mostrarModal();
  };

  req.onerror = function () {
    alert("Error al guardar los datos.");
  };
});

function cargarLeadsEnMemoria() {
  const tx = db.transaction("leads", "readonly");
  const store = tx.objectStore("leads");
  const req = store.getAll();
  req.onsuccess = () => {
    arrayLeads = req.result || [];
  };
}

function mostrarModal() {
  document.getElementById("modalRuleta").classList.remove("hidden");
}

function descargarCSV() {
  const encabezado = "Nombre,Apellido,Teléfono,Email,Interés\n";
  const filas = arrayLeads.map(l =>
    [l.nombre, l.apellido, l.telefono, l.email, l.interes].join(",")
  ).join("\n");

  const blob = new Blob([encabezado + filas], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "leads.csv";
  a.click();
}

document.getElementById("cerrarModal").onclick = function () {
  document.getElementById("modalRuleta").classList.add("hidden");
};
