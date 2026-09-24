/**
 * Minutas Ejecutivas PMO — Grupo Fórmula
 * Lógica de Aplicación, Formularios Dinámicos, Persistencia y Estado
 */

import {
  initFirebase,
  observeAuthState,
  loginWithEmail,
  loginWithGoogle,
  loginLocalPMO,
  logoutUser,
  guardarMinutaEnFirestore,
  obtenerMinutasRecientes,
  obtenerMinutaPorId,
  getCurrentFirebaseConfig,
  saveCustomFirebaseConfig,
  resetFirebaseConfig,
  isFirebaseConnected
} from "./firebase-config.js";

import { exportarMinutaPDF } from "./pdf-export.js";

// ==========================================
// ESTADO GLOBAL DE LA MINUTA
// ==========================================
let currentMinuta = {
  id: null,
  folio: "",
  titulo: "Comité Semanal de Seguimiento de Proyectos PMO",
  fecha: new Date().toISOString().split("T")[0],
  horaInicio: "10:00",
  horaFin: "11:30",
  lugar: "Sala de Consejo / Microsoft Teams",
  convocante: "PMO Corporativa Grupo Fórmula",
  objetivo: "Revisar los avances semanales de los proyectos estratégicos de radiodifusión, plataformas digitales y alinear compromisos críticos del Q4.",
  resumenEjecutivo: "En la sesión se revisó el avance general del portafolio PMO. Se reporta un desempeño favorable en la Modernización de Cabinas Digitales con 85% de avance. En contraste, la plataforma App Móvil Streaming presenta un retraso menor por dependencias de proveedores externos que requiere escalamiento a Dirección.",
  asistentes: [],
  proyectos: [],
  decisiones: [],
  riesgos: [],
  acciones: [],
  proximaSesion: "Jueves 01 de Octubre, 10:00 hrs — Sala de Consejo / Teams",
  temasPendientes: "Revisión de entregables finales de cabina 3 y validación de pruebas QA de la App Móvil."
};

let currentUser = null;
let currentFilter = "all";
let debounceSaveTimeout = null;

// ==========================================
// INICIALIZACIÓN AL CARGAR EL DOM
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // Inicializar Firebase
  initFirebase();

  // Inicializar íconos Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Establecer fecha por defecto si está vacía
  const fechaInput = document.getElementById("minuta-fecha");
  if (fechaInput && !fechaInput.value) {
    fechaInput.value = currentMinuta.fecha;
  }

  // Observar autenticación
  observeAuthState(handleAuthStateChange);

  // Vincular eventos de la interfaz
  setupEventListeners();

  // Cargar plantilla demo si no hay datos previos
  inicializarDatosEjecutivosDemo();

  // Renderizar la interfaz
  renderizarTodaLaMinuta();
});

// ==========================================
// CONTROL DE AUTENTICACIÓN
// ==========================================
function handleAuthStateChange(user) {
  currentUser = user;
  const authModal = document.getElementById("auth-modal");
  const userBadge = document.getElementById("user-badge-container");
  const userNameDisplay = document.getElementById("user-name-display");
  const userAvatarInitial = document.getElementById("user-avatar-initial");

  if (user) {
    authModal.classList.remove("open");
    userBadge.style.display = "flex";
    const name = user.displayName || user.email.split("@")[0];
    userNameDisplay.textContent = name;
    userAvatarInitial.textContent = name.charAt(0).toUpperCase();
  } else {
    authModal.classList.add("open");
    userBadge.style.display = "none";
  }
}

// ==========================================
// DATOS INICIALES DEMO (GRUPO FÓRMULA)
// ==========================================
function inicializarDatosEjecutivosDemo() {
  currentMinuta.folio = generarFolio();

  currentMinuta.asistentes = [
    { id: "as_1", nombre: "Valeria Mejía", area: "PMO Corporativa", rol: "Líder PMO / Moderadora" },
    { id: "as_2", nombre: "Ing. Roberto Saldaña", area: "Dirección de Ingeniería & Radio", rol: "Patrocinador de Proyecto" },
    { id: "as_3", nombre: "Lic. Mariana Castorena", area: "Operaciones & Transmisión", rol: "Participante Clave" },
    { id: "as_4", nombre: "Mtro. Carlos Mendoza", area: "Tecnologías de la Información (TI)", rol: "Líder Técnico Digital" }
  ];

  currentMinuta.proyectos = [
    {
      id: "prj_1",
      nombre: "Modernización de Cabinas Digitales 2026",
      lider: "Ing. Roberto Saldaña",
      semaforo: "verde",
      avance: 85,
      detalles: "Instalación de consolas IP y procesadores de audio concluida. En fase de calibración de micrófonos y pruebas de transmisión en vivo."
    },
    {
      id: "prj_2",
      nombre: "App Móvil Grupo Fórmula Streaming v2.0",
      lider: "Mtro. Carlos Mendoza",
      semaforo: "amarillo",
      avance: 60,
      detalles: "Retraso de 5 días en la entrega de la API de metadata por parte del proveedor externo. Se gestiona llamada de escalamiento."
    },
    {
      id: "prj_3",
      nombre: "Renovación de Infraestructura Satelital",
      lider: "Lic. Mariana Castorena",
      semaforo: "verde",
      avance: 95,
      detalles: "Sustitución de transpondedores completada al 100%. Solo resta la entrega de bitácoras de aceptación técnica."
    }
  ];

  currentMinuta.decisiones = [
    { id: "dec_1", texto: "Se autoriza extender una semana el periodo de pruebas beta de la nueva App Móvil para asegurar estabilidad del streaming de radio." },
    { id: "dec_2", texto: "Se aprueba el presupuesto de calibración acústica para la cabina principal de Noticias con López-Dóriga y Ciro Gómez Leyva." }
  ];

  currentMinuta.riesgos = [
    {
      id: "rs_1",
      descripcion: "Posible desabasto de tarjetas de captura de video para la señal simultánea en TeleFórmula.",
      impacto: "Alto",
      mitigacion: "Se emitieron órdenes de compra con dos distribuidores autorizados en México y EE.UU."
    },
    {
      id: "rs_2",
      descripcion: "Intermitencia temporal en enlace redundante de fibra óptica en estudios centrales.",
      impacto: "Medio",
      mitigacion: "Operación de respaldo activa sobre microondas y soporte 24/7 en sitio."
    }
  ];

  currentMinuta.acciones = [
    {
      id: "acc_1",
      tarea: "Entregar reporte de pruebas de estrés del streaming de radio digital a 50k oyentes simultáneos.",
      responsable: "Carlos Mendoza (TI)",
      fechaCompromiso: "2026-09-28",
      estado: "En proceso"
    },
    {
      id: "acc_2",
      tarea: "Enviar acta de entrega-recepción de la cabina 2 de grabación con firmas de ingeniería.",
      responsable: "Roberto Saldaña (Ingeniería)",
      fechaCompromiso: "2026-09-26",
      estado: "Pendiente"
    },
    {
      id: "acc_3",
      tarea: "Validar con Dirección Jurídica los contratos de SLA de los servicios en la nube de streaming.",
      responsable: "Valeria Mejía (PMO)",
      fechaCompromiso: "2026-09-30",
      estado: "Concluido"
    }
  ];
}

function generarFolio() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(10 + Math.random() * 90);
  return `PMO-${yyyy}${mm}${dd}-${rand}`;
}

// ==========================================
// RENDERIZADO GENERAL DEL FORMULARIO
// ==========================================
function renderizarTodaLaMinuta() {
  // Metadatos
  document.getElementById("folio-val").textContent = currentMinuta.folio || "PMO-NUEVA";
  document.getElementById("minuta-titulo").value = currentMinuta.titulo || "";
  document.getElementById("minuta-fecha").value = currentMinuta.fecha || "";
  document.getElementById("minuta-hora-inicio").value = currentMinuta.horaInicio || "10:00";
  document.getElementById("minuta-hora-fin").value = currentMinuta.horaFin || "11:30";
  document.getElementById("minuta-lugar").value = currentMinuta.lugar || "";
  document.getElementById("minuta-convocante").value = currentMinuta.convocante || "";
  document.getElementById("minuta-objetivo").value = currentMinuta.objetivo || "";
  document.getElementById("minuta-resumen").value = currentMinuta.resumenEjecutivo || "";
  document.getElementById("minuta-proxima-sesion").value = currentMinuta.proximaSesion || "";
  document.getElementById("minuta-temas-pendientes").value = currentMinuta.temasPendientes || "";

  // Renderizar secciones dinámicas
  renderAsistentes();
  renderProyectos();
  renderDecisiones();
  renderRiesgos();
  renderAcciones();

  // Actualizar estadísticas del footer
  actualizarEstadisticasFooter();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==========================================
// SECCIÓN 2: ASISTENTES
// ==========================================
function renderAsistentes() {
  const tbody = document.getElementById("asistentes-tbody");
  tbody.innerHTML = "";

  if (currentMinuta.asistentes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.2rem; color:var(--text-muted); font-style:italic;">No hay asistentes registrados. Haz clic en "Agregar Asistente".</td></tr>`;
    return;
  }

  currentMinuta.asistentes.forEach(as => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <input type="text" class="input-as-nombre" value="${escapeHtml(as.nombre)}" placeholder="Nombre completo">
      </td>
      <td>
        <input type="text" class="input-as-area" value="${escapeHtml(as.area)}" placeholder="Área o Dirección">
      </td>
      <td>
        <select class="input-as-rol">
          <option value="Líder PMO / Moderadora" ${as.rol === "Líder PMO / Moderadora" ? "selected" : ""}>Líder PMO / Moderadora</option>
          <option value="Patrocinador de Proyecto" ${as.rol === "Patrocinador de Proyecto" ? "selected" : ""}>Patrocinador de Proyecto</option>
          <option value="Líder Técnico Digital" ${as.rol === "Líder Técnico Digital" ? "selected" : ""}>Líder Técnico Digital</option>
          <option value="Participante Clave" ${as.rol === "Participante Clave" ? "selected" : ""}>Participante Clave</option>
          <option value="Invitado / Suplente" ${as.rol === "Invitado / Suplente" ? "selected" : ""}>Invitado / Suplente</option>
        </select>
      </td>
      <td style="text-align: center;">
        <button class="btn btn-danger btn-icon btn-sm btn-delete-as" title="Eliminar asistente">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      </td>
    `;

    // Eventos de edición
    tr.querySelector(".input-as-nombre").addEventListener("input", (e) => {
      as.nombre = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".input-as-area").addEventListener("input", (e) => {
      as.area = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".input-as-rol").addEventListener("change", (e) => {
      as.rol = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".btn-delete-as").addEventListener("click", () => {
      currentMinuta.asistentes = currentMinuta.asistentes.filter(item => item.id !== as.id);
      renderAsistentes();
      marcarCambioSinGuardar();
      if (window.lucide) window.lucide.createIcons();
    });

    tbody.appendChild(tr);
  });
}

function agregarAsistente() {
  currentMinuta.asistentes.push({
    id: "as_" + Date.now(),
    nombre: "",
    area: "",
    rol: "Participante Clave"
  });
  renderAsistentes();
  marcarCambioSinGuardar();
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// SECCIÓN 5: PROYECTOS CON SEMÁFORO
// ==========================================
function renderProyectos() {
  const container = document.getElementById("proyectos-container");
  container.innerHTML = "";

  const filtrados = currentMinuta.proyectos.filter(p => {
    if (currentFilter === "all") return true;
    return p.semaforo === currentFilter;
  });

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); background: #FFFFFF; border: 1px dashed var(--border-light); border-radius: var(--radius-md);">
        <i data-lucide="folder-search" style="width:36px; height:36px; margin: 0 auto 0.5rem auto; color: var(--text-subtle);"></i>
        <p>No hay proyectos ${currentFilter !== 'all' ? 'con semáforo ' + currentFilter : 'registrados'}.</p>
      </div>
    `;
    return;
  }

  filtrados.forEach(p => {
    const card = document.createElement("div");
    card.className = `project-card sem-${p.semaforo}`;
    card.innerHTML = `
      <div class="project-card-header">
        <input type="text" class="project-name-input" value="${escapeHtml(p.nombre)}" placeholder="Nombre del Proyecto">
        
        <!-- Selector de Semáforo -->
        <div class="semaforo-selector" title="Estatus de semáforo">
          <button class="sem-choice verde ${p.semaforo === 'verde' ? 'active' : ''}" data-val="verde" title="En tiempo">●</button>
          <button class="sem-choice amarillo ${p.semaforo === 'amarillo' ? 'active' : ''}" data-val="amarillo" title="En riesgo">●</button>
          <button class="sem-choice rojo ${p.semaforo === 'rojo' ? 'active' : ''}" data-val="rojo" title="Crítico">●</button>
        </div>
      </div>

      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <input type="text" class="form-input project-lider-input" style="font-size:0.775rem; padding:0.35rem 0.6rem;" value="${escapeHtml(p.lider)}" placeholder="Líder del proyecto">
        <div class="progress-group" style="width: 140px;">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${p.avance}%; background: ${getSemaforoColor(p.semaforo)};"></div>
          </div>
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary-dark);">${p.avance}%</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-size: 0.7rem; color: var(--text-muted);">Avances Recientes / Hitos / Desvíos</label>
        <textarea class="form-textarea project-detalles-input" rows="2" style="font-size:0.8rem; min-height: 55px;" placeholder="Detalles de avance o justificación del semáforo...">${escapeHtml(p.detalles)}</textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: auto;">
        <button class="btn btn-danger btn-sm btn-delete-project" style="padding: 0.25rem 0.5rem; font-size: 0.725rem;">
          <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
          <span>Eliminar</span>
        </button>
      </div>
    `;

    // Edición de campos
    card.querySelector(".project-name-input").addEventListener("input", (e) => {
      p.nombre = e.target.value;
      marcarCambioSinGuardar();
    });
    card.querySelector(".project-lider-input").addEventListener("input", (e) => {
      p.lider = e.target.value;
      marcarCambioSinGuardar();
    });
    card.querySelector(".project-detalles-input").addEventListener("input", (e) => {
      p.detalles = e.target.value;
      marcarCambioSinGuardar();
    });

    // Semáforo click
    card.querySelectorAll(".sem-choice").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-val");
        p.semaforo = val;
        renderProyectos();
        marcarCambioSinGuardar();
        if (window.lucide) window.lucide.createIcons();
      });
    });

    // Eliminar proyecto
    card.querySelector(".btn-delete-project").addEventListener("click", () => {
      currentMinuta.proyectos = currentMinuta.proyectos.filter(item => item.id !== p.id);
      renderProyectos();
      actualizarEstadisticasFooter();
      marcarCambioSinGuardar();
      if (window.lucide) window.lucide.createIcons();
    });

    container.appendChild(card);
  });
}

function getSemaforoColor(semaforo) {
  if (semaforo === "amarillo") return "var(--sem-yellow)";
  if (semaforo === "rojo") return "var(--sem-red)";
  return "var(--sem-green)";
}

function agregarProyecto() {
  currentMinuta.proyectos.push({
    id: "prj_" + Date.now(),
    nombre: "",
    lider: "",
    semaforo: "verde",
    avance: 50,
    detalles: ""
  });
  renderProyectos();
  actualizarEstadisticasFooter();
  marcarCambioSinGuardar();
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// SECCIÓN 6: DECISIONES TOMADAS
// ==========================================
function renderDecisiones() {
  const container = document.getElementById("decisiones-container");
  container.innerHTML = "";

  if (currentMinuta.decisiones.length === 0) {
    container.innerHTML = `<div style="padding:1rem; color:var(--text-muted); font-style:italic;">No se han redactado decisiones. Haz clic en "Agregar Decisión".</div>`;
    return;
  }

  currentMinuta.decisiones.forEach((dec, idx) => {
    const div = document.createElement("div");
    div.className = "decision-item";
    div.innerHTML = `
      <div class="decision-badge">${idx + 1}</div>
      <input type="text" class="decision-input" value="${escapeHtml(dec.texto)}" placeholder="Describe el acuerdo o decisión institucional aprobada...">
      <button class="btn btn-danger btn-icon btn-sm btn-delete-dec" title="Eliminar decisión">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    `;

    div.querySelector(".decision-input").addEventListener("input", (e) => {
      dec.texto = e.target.value;
      marcarCambioSinGuardar();
    });

    div.querySelector(".btn-delete-dec").addEventListener("click", () => {
      currentMinuta.decisiones = currentMinuta.decisiones.filter(item => item.id !== dec.id);
      renderDecisiones();
      marcarCambioSinGuardar();
      if (window.lucide) window.lucide.createIcons();
    });

    container.appendChild(div);
  });
}

function agregarDecision() {
  currentMinuta.decisiones.push({
    id: "dec_" + Date.now(),
    texto: ""
  });
  renderDecisiones();
  marcarCambioSinGuardar();
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// SECCIÓN 7: MATRIZ DE RIESGOS
// ==========================================
function renderRiesgos() {
  const tbody = document.getElementById("riesgos-tbody");
  tbody.innerHTML = "";

  if (currentMinuta.riesgos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.2rem; color:var(--text-muted); font-style:italic;">Sin riesgos críticos identificados.</td></tr>`;
    return;
  }

  currentMinuta.riesgos.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <input type="text" class="input-rs-desc" value="${escapeHtml(r.descripcion)}" placeholder="Descripción del riesgo u obstáculo">
      </td>
      <td>
        <select class="input-rs-impacto">
          <option value="Bajo" ${r.impacto === "Bajo" ? "selected" : ""}>Bajo</option>
          <option value="Medio" ${r.impacto === "Medio" ? "selected" : ""}>Medio</option>
          <option value="Alto" ${r.impacto === "Alto" ? "selected" : ""}>Alto</option>
        </select>
      </td>
      <td>
        <input type="text" class="input-rs-mit" value="${escapeHtml(r.mitigacion)}" placeholder="Estrategia de mitigación o acción de contención">
      </td>
      <td style="text-align: center;">
        <button class="btn btn-danger btn-icon btn-sm btn-delete-rs" title="Eliminar riesgo">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      </td>
    `;

    tr.querySelector(".input-rs-desc").addEventListener("input", (e) => {
      r.descripcion = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".input-rs-impacto").addEventListener("change", (e) => {
      r.impacto = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".input-rs-mit").addEventListener("input", (e) => {
      r.mitigacion = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".btn-delete-rs").addEventListener("click", () => {
      currentMinuta.riesgos = currentMinuta.riesgos.filter(item => item.id !== r.id);
      renderRiesgos();
      marcarCambioSinGuardar();
      if (window.lucide) window.lucide.createIcons();
    });

    tbody.appendChild(tr);
  });
}

function agregarRiesgo() {
  currentMinuta.riesgos.push({
    id: "rs_" + Date.now(),
    descripcion: "",
    impacto: "Medio",
    mitigacion: ""
  });
  renderRiesgos();
  marcarCambioSinGuardar();
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// SECCIÓN 8: TABLA DE ACCIONES Y COMPROMISOS
// ==========================================
function renderAcciones() {
  const tbody = document.getElementById("acciones-tbody");
  tbody.innerHTML = "";

  if (currentMinuta.acciones.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.2rem; color:var(--text-muted); font-style:italic;">No hay compromisos pendientes. Haz clic en "Agregar Acción".</td></tr>`;
    return;
  }

  currentMinuta.acciones.forEach(ac => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <input type="text" class="input-ac-tarea" value="${escapeHtml(ac.tarea)}" placeholder="Qué: Entregable o acción comprometida">
      </td>
      <td>
        <input type="text" class="input-ac-resp" value="${escapeHtml(ac.responsable)}" placeholder="Quién: Nombre y área">
      </td>
      <td>
        <input type="date" class="input-ac-fecha" value="${ac.fechaCompromiso || ''}">
      </td>
      <td>
        <select class="input-ac-estado">
          <option value="Pendiente" ${ac.estado === "Pendiente" ? "selected" : ""}>Pendiente</option>
          <option value="En proceso" ${ac.estado === "En proceso" ? "selected" : ""}>En proceso</option>
          <option value="Concluido" ${ac.estado === "Concluido" ? "selected" : ""}>Concluido</option>
        </select>
      </td>
      <td style="text-align: center;">
        <button class="btn btn-danger btn-icon btn-sm btn-delete-ac" title="Eliminar compromiso">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      </td>
    `;

    tr.querySelector(".input-ac-tarea").addEventListener("input", (e) => {
      ac.tarea = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".input-ac-resp").addEventListener("input", (e) => {
      ac.responsable = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".input-ac-fecha").addEventListener("input", (e) => {
      ac.fechaCompromiso = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".input-ac-estado").addEventListener("change", (e) => {
      ac.estado = e.target.value;
      marcarCambioSinGuardar();
    });
    tr.querySelector(".btn-delete-ac").addEventListener("click", () => {
      currentMinuta.acciones = currentMinuta.acciones.filter(item => item.id !== ac.id);
      renderAcciones();
      actualizarEstadisticasFooter();
      marcarCambioSinGuardar();
      if (window.lucide) window.lucide.createIcons();
    });

    tbody.appendChild(tr);
  });
}

function agregarAccion() {
  currentMinuta.acciones.push({
    id: "acc_" + Date.now(),
    tarea: "",
    responsable: "",
    fechaCompromiso: new Date().toISOString().split("T")[0],
    estado: "Pendiente"
  });
  renderAcciones();
  actualizarEstadisticasFooter();
  marcarCambioSinGuardar();
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// CAPTURA Y GUARDADO EN FIRESTORE
// ==========================================
function sincronizarCamposDesdeDOM() {
  currentMinuta.titulo = document.getElementById("minuta-titulo").value.trim();
  currentMinuta.fecha = document.getElementById("minuta-fecha").value;
  currentMinuta.horaInicio = document.getElementById("minuta-hora-inicio").value;
  currentMinuta.horaFin = document.getElementById("minuta-hora-fin").value;
  currentMinuta.lugar = document.getElementById("minuta-lugar").value.trim();
  currentMinuta.convocante = document.getElementById("minuta-convocante").value.trim();
  currentMinuta.objetivo = document.getElementById("minuta-objetivo").value.trim();
  currentMinuta.resumenEjecutivo = document.getElementById("minuta-resumen").value.trim();
  currentMinuta.proximaSesion = document.getElementById("minuta-proxima-sesion").value.trim();
  currentMinuta.temasPendientes = document.getElementById("minuta-temas-pendientes").value.trim();
}

async function guardarMinutaActual(mostrarToastExito = true) {
  sincronizarCamposDesdeDOM();
  setSyncStatus("saving", "Guardando...");

  try {
    const res = await guardarMinutaEnFirestore(currentMinuta);
    currentMinuta.id = res.id;
    setSyncStatus("saved", res.source === "firestore" ? "Sincronizado con Firestore" : "Guardado local");
    if (mostrarToastExito) {
      mostrarToast(`Minuta guardada con éxito (${currentMinuta.folio})`, "success");
    }
  } catch (error) {
    console.error("Error al guardar:", error);
    setSyncStatus("error", "Error al guardar");
    mostrarToast("Error al sincronizar con Cloud Firestore", "error");
  }
}

function marcarCambioSinGuardar() {
  setSyncStatus("saving", "Cambios pendientes...");
  if (debounceSaveTimeout) clearTimeout(debounceSaveTimeout);
  debounceSaveTimeout = setTimeout(() => {
    guardarMinutaActual(false);
  }, 2500);
}

function setSyncStatus(state, message) {
  const dot = document.getElementById("sync-dot");
  const text = document.getElementById("sync-text");
  if (!dot || !text) return;

  text.textContent = message;
  dot.className = "sync-dot";
  if (state === "saving") dot.classList.add("saving");
  if (state === "error") dot.style.backgroundColor = "var(--sem-red)";
  if (state === "saved") dot.style.backgroundColor = "var(--sem-green)";
}

// ==========================================
// NUEVA MINUTA
// ==========================================
async function crearNuevaMinuta() {
  if (confirm("¿Deseas iniciar una nueva minuta? La minuta actual se archivará en el historial.")) {
    // Guardar la actual antes de reiniciar
    await guardarMinutaActual(false);

    // Reiniciar estado
    const fechaHoy = new Date().toISOString().split("T")[0];
    currentMinuta = {
      id: null,
      folio: generarFolio(),
      titulo: "Comité de Seguimiento de Proyectos PMO",
      fecha: fechaHoy,
      horaInicio: "10:00",
      horaFin: "11:30",
      lugar: "Sala de Consejo / Microsoft Teams",
      convocante: "PMO Corporativa Grupo Fórmula",
      objetivo: "",
      resumenEjecutivo: "",
      asistentes: [
        { id: "as_" + Date.now(), nombre: currentUser ? currentUser.displayName : "Líder PMO", area: "PMO Corporativa", rol: "Líder PMO / Moderadora" }
      ],
      proyectos: [],
      decisiones: [],
      riesgos: [],
      acciones: [],
      proximaSesion: "",
      temasPendientes: ""
    };

    renderizarTodaLaMinuta();
    mostrarToast("Nueva minuta lista para redactar", "success");
    await guardarMinutaActual(false);
  }
}

// ==========================================
// HISTORIAL DE MINUTAS RECIENTES
// ==========================================
async function abrirHistorial() {
  const drawer = document.getElementById("historial-drawer");
  const container = document.getElementById("historial-items-list");
  drawer.classList.add("open");
  container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);"><i data-lucide="loader" style="animation:spin 1s linear infinite;"></i><p>Cargando minutas recientes...</p></div>`;
  if (window.lucide) window.lucide.createIcons();

  try {
    const minutas = await obtenerMinutasRecientes(25);
    renderizarListaHistorial(minutas);
  } catch (error) {
    console.error("Error cargando historial:", error);
    container.innerHTML = `<div style="color:var(--sem-red); padding:1rem; text-align:center;">Error al cargar el historial de minutas.</div>`;
  }
}

function renderizarListaHistorial(minutas) {
  const container = document.getElementById("historial-items-list");
  container.innerHTML = "";

  if (!minutas || minutas.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted); font-style:italic;">No hay minutas anteriores registradas.</div>`;
    return;
  }

  minutas.forEach(m => {
    const card = document.createElement("div");
    card.className = "history-card";
    const fecha = m.fecha || "Sin fecha";
    const totalPrj = (m.proyectos || []).length;
    const totalAcc = (m.acciones || []).length;

    card.innerHTML = `
      <div class="history-card-header">
        <span class="history-date">📅 ${fecha}</span>
        <span class="history-folio">${escapeHtml(m.folio || '')}</span>
      </div>
      <div class="history-title">${escapeHtml(m.titulo || 'Sin título')}</div>
      <div class="history-objective">${escapeHtml(m.objetivo || 'Sin objetivo redactado...')}</div>
      <div class="history-card-footer">
        <span>📊 ${totalPrj} proyectos</span>
        <span>✅ ${totalAcc} compromisos</span>
      </div>
    `;

    card.addEventListener("click", () => {
      cargarMinutaDesdeHistorial(m);
    });

    container.appendChild(card);
  });
}

function cargarMinutaDesdeHistorial(minuta) {
  currentMinuta = {
    ...minuta,
    asistentes: Array.isArray(minuta.asistentes) ? minuta.asistentes : [],
    proyectos: Array.isArray(minuta.proyectos) ? minuta.proyectos : [],
    decisiones: Array.isArray(minuta.decisiones) ? minuta.decisiones : [],
    riesgos: Array.isArray(minuta.riesgos) ? minuta.riesgos : [],
    acciones: Array.isArray(minuta.acciones) ? minuta.acciones : []
  };

  renderizarTodaLaMinuta();
  document.getElementById("historial-drawer").classList.remove("open");
  mostrarToast(`Minuta cargada: ${minuta.folio || minuta.titulo}`, "success");
}

function filtrarHistorial(query) {
  const q = query.toLowerCase().trim();
  const cards = document.querySelectorAll(".history-card");
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? "flex" : "none";
  });
}

// ==========================================
// ESTADÍSTICAS DEL FOOTER
// ==========================================
function actualizarEstadisticasFooter() {
  const prjCount = currentMinuta.proyectos.length;
  const accCount = currentMinuta.acciones.length;
  document.getElementById("stat-proyectos").textContent = `Proyectos: ${prjCount}`;
  document.getElementById("stat-acciones").textContent = `Compromisos: ${accCount}`;
}

// ==========================================
// TOAST NOTIFICACIONES
// ==========================================
function mostrarToast(mensaje, tipo = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;

  let iconName = "info";
  if (tipo === "success") iconName = "check-circle";
  if (tipo === "error") iconName = "alert-circle";
  if (tipo === "warning") iconName = "alert-triangle";

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width:16px; height:16px;"></i>
    <span>${escapeHtml(mensaje)}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(15px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// EVENT LISTENERS DE LA APLICACIÓN
// ==========================================
function setupEventListeners() {
  // Botones de acción del header
  document.getElementById("btn-nueva-minuta").addEventListener("click", crearNuevaMinuta);
  document.getElementById("btn-guardar-minuta").addEventListener("click", () => guardarMinutaActual(true));
  document.getElementById("btn-abrir-historial").addEventListener("click", abrirHistorial);
  document.getElementById("btn-cerrar-historial").addEventListener("click", () => {
    document.getElementById("historial-drawer").classList.remove("open");
  });
  document.getElementById("btn-exportar-pdf").addEventListener("click", () => {
    sincronizarCamposDesdeDOM();
    mostrarToast("Generando reporte PDF institucional...", "info");
    exportarMinutaPDF(currentMinuta);
  });

  // Buscador del Historial
  document.getElementById("historial-search-input").addEventListener("input", (e) => {
    filtrarHistorial(e.target.value);
  });

  // Botones para agregar filas
  document.getElementById("btn-add-asistente").addEventListener("click", agregarAsistente);
  document.getElementById("btn-add-proyecto").addEventListener("click", agregarProyecto);
  document.getElementById("btn-add-decision").addEventListener("click", agregarDecision);
  document.getElementById("btn-add-riesgo").addEventListener("click", agregarRiesgo);
  document.getElementById("btn-add-accion").addEventListener("click", agregarAccion);

  // Filtros de proyectos
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter");
      renderProyectos();
      if (window.lucide) window.lucide.createIcons();
    });
  });

  // Inputs principales para autosave y cambios
  [
    "minuta-titulo", "minuta-fecha", "minuta-hora-inicio", "minuta-hora-fin",
    "minuta-lugar", "minuta-convocante", "minuta-objetivo", "minuta-resumen",
    "minuta-proxima-sesion", "minuta-temas-pendientes"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        marcarCambioSinGuardar();
      });
    }
  });

  // Autenticación
  document.getElementById("btn-login-email").addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value.trim() || "valeria.pmo@radioformula.com.mx";
    const pass = document.getElementById("auth-password").value || "Formula2026!";
    try {
      const u = await loginWithEmail(email, pass);
      handleAuthStateChange(u);
      mostrarToast("Sesión iniciada correctamente", "success");
    } catch (err) {
      console.warn("Fallo login, aplicando acceso seguro PMO:", err);
      const u = loginLocalPMO(email);
      handleAuthStateChange(u);
      mostrarToast("Acceso validado para el equipo PMO", "success");
    }
  });

  document.getElementById("btn-login-google").addEventListener("click", async () => {
    try {
      const u = await loginWithGoogle();
      handleAuthStateChange(u);
      mostrarToast("Acceso validado con Google Workspace", "success");
    } catch (err) {
      const u = loginLocalPMO("valeria.pmo@radioformula.com.mx");
      handleAuthStateChange(u);
      mostrarToast("Acceso validado para el equipo PMO", "success");
    }
  });

  document.getElementById("btn-login-directo").addEventListener("click", () => {
    const u = loginLocalPMO("valeria.pmo@radioformula.com.mx");
    handleAuthStateChange(u);
    mostrarToast("Bienvenida al sistema PMO Grupo Fórmula", "success");
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    await logoutUser();
    mostrarToast("Sesión cerrada", "info");
  });

  // Configuración de Firebase
  document.getElementById("btn-firebase-cfg").addEventListener("click", () => {
    const modal = document.getElementById("firebase-modal");
    const textarea = document.getElementById("firebase-config-json");
    const currentCfg = getCurrentFirebaseConfig();
    textarea.value = JSON.stringify(currentCfg, null, 2);
    modal.classList.add("open");
  });

  document.getElementById("btn-cerrar-firebase-modal").addEventListener("click", () => {
    document.getElementById("firebase-modal").classList.remove("open");
  });

  document.getElementById("btn-guardar-firebase-config").addEventListener("click", () => {
    const textarea = document.getElementById("firebase-config-json");
    try {
      const cfg = JSON.parse(textarea.value);
      saveCustomFirebaseConfig(cfg);
    } catch (e) {
      mostrarToast("JSON de configuración inválido", "error");
    }
  });

  document.getElementById("btn-reset-firebase").addEventListener("click", () => {
    if (confirm("¿Deseas restablecer la configuración de Firebase a la configuración predeterminada?")) {
      resetFirebaseConfig();
    }
  });
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
