// admin.js
let ruletaDB;
let leadsDB;
let arrayLeads = [];

const req1 = indexedDB.open("RuletaDB", 1);
req1.onsuccess = e => {
  ruletaDB = e.target.result;
  cargarPremios();
};

const req2 = indexedDB.open("LeadsDB", 1);
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
    req.result.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.habilitado ? "✅" : "❌"}</td>
        <td>
          <button class="toggle" onclick="togglePremio('${p.nombre}', ${p.habilitado})">${p.habilitado ? "Deshabilitar" : "Habilitar"}</button>
          <button class="delete" onclick="eliminarPremio('${p.nombre}')">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };
}

function togglePremio(nombre, actual) {
  const tx = ruletaDB.transaction("premios", "readwrite");
  const store = tx.objectStore("premios");
  const req = store.get(nombre);
  req.onsuccess = () => {
    const premio = req.result;
    premio.habilitado = !actual;
    store.put(premio).onsuccess = cargarPremios;
  };
}

function eliminarPremio(nombre) {
  const tx = ruletaDB.transaction("premios", "readwrite");
  const store = tx.objectStore("premios");
  store.delete(nombre).onsuccess = cargarPremios;
}

document.getElementById("btnAgregarPremio").onclick = () => {
  const nuevo = document.getElementById("nuevoPremio").value.trim();
  if (!nuevo) return;
  const tx = ruletaDB.transaction("premios", "readwrite");
  const store = tx.objectStore("premios");
  store.add({ nombre: nuevo, habilitado: true }).onsuccess = () => {
    document.getElementById("nuevoPremio").value = "";
    cargarPremios();
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
    arrayLeads.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.apellido}</td>
        <td>${p.telefono}</td>
        <td>${p.email}</td>
        <td>${p.interes}</td>
      `;
      tbody.appendChild(tr);
    });
  };
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

// Crear botón y agregarlo debajo del panel de leads
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
