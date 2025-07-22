// admin.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("✅ Service Worker registrado"))
    .catch(err => console.error("❌ Error al registrar SW", err));
}

let ruletaDB;
let leadsDB;
let arrayLeads = [];

// Abrir RuletaDB
const req1 = indexedDB.open("RuletaDB", 2);
req1.onupgradeneeded = e => {
  ruletaDB = e.target.result;
  if (!ruletaDB.objectStoreNames.contains("premios")) {
    ruletaDB.createObjectStore("premios", { keyPath: "id", autoIncrement: true });
  }
};
req1.onsuccess = e => {
  ruletaDB = e.target.result;
  cargarPremios();
};

// Abrir LeadsDB
const req2 = indexedDB.open("LeadsDB", 1);
req2.onupgradeneeded = e => {
  leadsDB = e.target.result;
  if (!leadsDB.objectStoreNames.contains("leads")) {
    leadsDB.createObjectStore("leads", { keyPath: "id", autoIncrement: true });
  }
};
req2.onsuccess = e => {
  leadsDB = e.target.result;
  cargarLeads();
};

function cargarPremios() {
  const tx = ruletaDB.transaction("premios", "readonly");
  const store = tx.objectStore("premios");
  const req = store.getAll();
  req.onsuccess = () => {
    const tbody = document.querySelector("#tablaPremios tbody");
    tbody.innerHTML = "";
    req.result.sort((a, b) => a.position - b.position).forEach(p => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><span class="nombre">${p.nombre}</span><input class="input-nombre hidden" type="text" value="${p.nombre}"></td>
        <td>${p.habilitado ? "✅" : "❌"}</td>
        <td><span class="pos">${p.position}</span><input class="input-pos hidden" type="number" value="${p.position}" min="1" style="width: 60px;"></td>
        <td>
          <button onclick="togglePremio(${p.id}, ${p.habilitado})">${p.habilitado ? "Deshabilitar" : "Habilitar"}</button>
          <button onclick="eliminarPremio(${p.id})">Eliminar</button>
          <button onclick="editarPremio(${p.id}, this)">Editar</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  };
}
function editarPremio(id, btn) {
  const tr = btn.closest("tr");
  const spanNombre = tr.querySelector(".nombre");
  const inputNombre = tr.querySelector(".input-nombre");
  const spanPos = tr.querySelector(".pos");
  const inputPos = tr.querySelector(".input-pos");

  if (btn.textContent === "Editar") {
    spanNombre.classList.add("hidden");
    inputNombre.classList.remove("hidden");
    spanPos.classList.add("hidden");
    inputPos.classList.remove("hidden");
    btn.textContent = "Guardar";

    // Crear botón cancelar
    const cancelarBtn = document.createElement("button");
    cancelarBtn.textContent = "Cancelar";
    cancelarBtn.onclick = () => cargarPremios();
    btn.after(cancelarBtn);
  } else {
    const nuevoNombre = inputNombre.value.trim();
    const nuevaPos = parseInt(inputPos.value);

    if (!nuevoNombre || isNaN(nuevaPos)) {
      alert("Nombre o posición inválidos");
      return;
    }

    const tx = ruletaDB.transaction("premios", "readwrite");
    const store = tx.objectStore("premios");
    const req = store.get(id);
    req.onsuccess = () => {
      const premio = req.result;
      premio.nombre = nuevoNombre;
      premio.position = nuevaPos;
      store.put(premio).onsuccess = cargarPremios;
    };
  }
}


function togglePremio(id, actual) {
  const tx = ruletaDB.transaction("premios", "readwrite");
  const store = tx.objectStore("premios");
  const req = store.get(id);
  req.onsuccess = () => {
    const premio = req.result;
    premio.habilitado = !actual;
    store.put(premio).onsuccess = cargarPremios;
  };
}

function eliminarPremio(id) {
  const tx = ruletaDB.transaction("premios", "readwrite");
  const store = tx.objectStore("premios");
  store.delete(id).onsuccess = cargarPremios;
}

document.getElementById("btnAgregarPremio").onclick = () => {
  const nuevo = document.getElementById("nuevoPremio").value.trim();
  if (!nuevo) return;

  const tx = ruletaDB.transaction("premios", "readwrite");
  const store = tx.objectStore("premios");

  const getAllReq = store.getAll();
  getAllReq.onsuccess = () => {
    const existing = getAllReq.result;
    const maxPosition = existing.reduce((max, p) => Math.max(max, p.position ?? 0), 0);
    const nuevoPremio = {
      nombre: nuevo,
      habilitado: true,
      position: maxPosition + 1
    };
    store.put(nuevoPremio).onsuccess = () => {
      document.getElementById("nuevoPremio").value = "";
      cargarPremios();
    };
  };
};


function cargarLeads() {
  const tx = leadsDB.transaction("leads", "readonly");
  const store = tx.objectStore("leads");
  const req = store.getAll();
  req.onsuccess = () => {
    arrayLeads = req.result || [];
    const tbody = document.querySelector("#tablaLeads tbody");
    tbody.innerHTML = "";
    arrayLeads.forEach(l => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.nombre}</td>
        <td>${l.apellido}</td>
        <td>${l.telefono}</td>
        <td>${l.email}</td>
        <td>${l.interes}</td>
      `;
      tbody.appendChild(tr);
    });
  };
}

function descargarCSV() {
  const encabezado = "Nombre,Apellido,Teléfono,Email,Interés\n";
  const filas = arrayLeads.map(l => [l.nombre, l.apellido, l.telefono, l.email, l.interes].join(",")).join("\n");
  const blob = new Blob([encabezado + filas], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads.csv";
  a.click();
}

const btnCSV = document.createElement("button");
btnCSV.textContent = "Descargar Leads en CSV";
btnCSV.style.margin = "20px auto";
btnCSV.style.display = "block";
btnCSV.style.padding = "10px 20px";
btnCSV.style.background = "#17a2b8";
btnCSV.style.color = "white";
btnCSV.style.border = "none";
btnCSV.style.borderRadius = "5px";
btnCSV.style.cursor = "pointer";
btnCSV.onclick = descargarCSV;
document.querySelector(".admin-container").appendChild(btnCSV);