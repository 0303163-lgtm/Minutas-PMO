/**
 * Motor de Exportación a PDF Ejecutivo — Minutas PMO Grupo Fórmula
 * Genera un reporte formal A4/Carta con el logotipo oficial, paleta institucional y pie de página confidencial.
 */

export function exportarMinutaPDF(minutaData) {
  // Asegurar que existe el contenedor temporal de exportación
  let exportContainer = document.getElementById("pdf-render-zone");
  if (!exportContainer) {
    exportContainer = document.createElement("div");
    exportContainer.id = "pdf-render-zone";
    document.body.appendChild(exportContainer);
  }

  // Sanitizar y preparar datos
  const fechaStr = minutaData.fecha || new Date().toISOString().split("T")[0];
  const horaStr = `${minutaData.horaInicio || "09:00"} a ${minutaData.horaFin || "10:30"}`;
  const titulo = minutaData.titulo || "Sesión de Seguimiento de Proyectos PMO";
  const folio = minutaData.folio || ("PMO-" + fechaStr.replace(/-/g, "") + "-01");
  const proximaSesion = minutaData.proximaSesion || "Por definir en comité directivo";
  const lugar = minutaData.lugar || "Sala de Consejo / Conexión Virtual";
  const convocante = minutaData.convocante || "PMO Corporativa Grupo Fórmula";

  // Generar filas de asistentes
  const asistentes = Array.isArray(minutaData.asistentes) ? minutaData.asistentes : [];
  const asistentesHTML = asistentes.length > 0 
    ? asistentes.map(a => `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0d2b52;">${escapeHtml(a.nombre || "—")}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${escapeHtml(a.area || "—")}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${escapeHtml(a.rol || "Participante")}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="3" style="padding: 10px; text-align: center; color: #64748b; font-style: italic;">No se registraron asistentes específicos.</td></tr>`;

  // Generar proyectos con semáforo
  const proyectos = Array.isArray(minutaData.proyectos) ? minutaData.proyectos : [];
  const proyectosHTML = proyectos.length > 0
    ? proyectos.map(p => {
        const sem = (p.semaforo || "verde").toLowerCase();
        let badgeColor = "#10b981";
        let badgeBg = "#ecfdf5";
        let badgeText = "EN TIEMPO";

        if (sem === "amarillo") {
          badgeColor = "#d97706";
          badgeBg = "#fffbeb";
          badgeText = "EN RIESGO";
        } else if (sem === "rojo") {
          badgeColor = "#dc2626";
          badgeBg = "#fef2f2";
          badgeText = "CRÍTICO";
        }

        return `
          <div style="border: 1px solid #e2e8f0; border-left: 5px solid ${badgeColor}; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0d2b52;">${escapeHtml(p.nombre || "Proyecto sin nombre")}</h4>
              <span style="display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">
                ● ${badgeText} ${p.avance ? `(${p.avance}%)` : ''}
              </span>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              <strong>Responsable / Líder:</strong> ${escapeHtml(p.lider || "No especificado")}
            </div>
            ${p.detalles ? `<div style="font-size: 11px; color: #334155; margin-top: 4px; line-height: 1.4;">${escapeHtml(p.detalles)}</div>` : ''}
          </div>
        `;
      }).join("")
    : `<div style="padding: 10px; color: #64748b; font-style: italic;">No se registraron proyectos en esta sesión.</div>`;

  // Decisiones
  const decisiones = Array.isArray(minutaData.decisiones) ? minutaData.decisiones : [];
  const decisionesHTML = decisiones.length > 0
    ? `<ol style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #1e293b; line-height: 1.6;">
        ${decisiones.map(d => `<li style="margin-bottom: 4px;">${escapeHtml(typeof d === 'string' ? d : d.texto || '')}</li>`).join("")}
       </ol>`
    : `<p style="font-size: 11px; color: #64748b; margin: 0; font-style: italic;">No se registraron decisiones extraordinarias.</p>`;

  // Riesgos
  const riesgos = Array.isArray(minutaData.riesgos) ? minutaData.riesgos : [];
  const riesgosHTML = riesgos.length > 0
    ? `<table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left; color: #0d2b52;">
            <th style="padding: 6px 10px; border-bottom: 2px solid #cbd5e1;">Riesgo / Obstáculo</th>
            <th style="padding: 6px 10px; border-bottom: 2px solid #cbd5e1; width: 100px;">Impacto</th>
            <th style="padding: 6px 10px; border-bottom: 2px solid #cbd5e1;">Plan de Mitigación</th>
          </tr>
        </thead>
        <tbody>
          ${riesgos.map(r => `
            <tr>
              <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${escapeHtml(r.descripcion || "—")}</td>
              <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: ${r.impacto === 'Alto' ? '#dc2626' : (r.impacto === 'Medio' ? '#d97706' : '#2563eb')};">${escapeHtml(r.impacto || "Medio")}</td>
              <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${escapeHtml(r.mitigacion || "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`
    : `<p style="font-size: 11px; color: #64748b; margin: 0; font-style: italic;">Sin riesgos críticos identificados.</p>`;

  // Tabla de Acciones (Qué, Quién, Fecha, Estado)
  const acciones = Array.isArray(minutaData.acciones) ? minutaData.acciones : [];
  const accionesHTML = acciones.length > 0
    ? `<table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #1753A2; color: #ffffff; text-align: left;">
            <th style="padding: 8px 10px; border-top-left-radius: 4px;">Qué (Acuerdo / Tarea)</th>
            <th style="padding: 8px 10px; width: 140px;">Quién (Responsable)</th>
            <th style="padding: 8px 10px; width: 100px;">Fecha Límite</th>
            <th style="padding: 8px 10px; width: 90px; border-top-right-radius: 4px;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${acciones.map((ac, idx) => `
            <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${escapeHtml(ac.tarea || "—")}</td>
              <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #334155; font-weight: 600;">${escapeHtml(ac.responsable || "—")}</td>
              <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #1753a2; font-weight: 600;">${escapeHtml(ac.fechaCompromiso || "—")}</td>
              <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">
                <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 700; background: ${ac.estado === 'Concluido' ? '#dcfce7' : (ac.estado === 'En proceso' ? '#e0f2fe' : '#fef3c7')}; color: ${ac.estado === 'Concluido' ? '#15803d' : (ac.estado === 'En proceso' ? '#0369a1' : '#b45309')};">
                  ${escapeHtml(ac.estado || "Pendiente")}
                </span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>`
    : `<p style="font-size: 11px; color: #64748b; margin: 0; font-style: italic;">Sin acuerdos registrados.</p>`;

  // Estructura completa de la plantilla de impresión
  exportContainer.innerHTML = `
    <div id="pdf-doc-content" style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 32px 36px; max-width: 800px; margin: 0 auto; box-sizing: border-box; line-height: 1.45;">
      
      <!-- ENCABEZADO INSTITUCIONAL -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1753A2; padding-bottom: 18px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="logo.png" alt="Grupo Fórmula" style="height: 52px; object-fit: contain;" />
        </div>
        <div style="text-align: right;">
          <div style="font-size: 18px; font-weight: 800; color: #0D2B52; letter-spacing: -0.3px; text-transform: uppercase;">MINUTA EJECUTIVA</div>
          <div style="font-size: 12px; font-weight: 700; color: #1753A2;">OFICINA DE GESTIÓN DE PROYECTOS (PMO)</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Folio: <strong style="color: #0f172a;">${escapeHtml(folio)}</strong></div>
        </div>
      </div>

      <!-- METADATOS DE LA REUNIÓN -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
          <tr>
            <td style="padding: 4px 8px 4px 0; color: #64748b; width: 15%;"><strong>Título:</strong></td>
            <td style="padding: 4px 8px; color: #0D2B52; font-weight: 700; font-size: 13px;" colspan="3">${escapeHtml(titulo)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px 4px 0; color: #64748b;"><strong>Fecha:</strong></td>
            <td style="padding: 4px 8px; color: #1e293b; font-weight: 600;">${escapeHtml(fechaStr)}</td>
            <td style="padding: 4px 8px; color: #64748b; width: 15%;"><strong>Horario:</strong></td>
            <td style="padding: 4px 8px; color: #1e293b; font-weight: 600;">${escapeHtml(horaStr)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px 4px 0; color: #64748b;"><strong>Convocante:</strong></td>
            <td style="padding: 4px 8px; color: #1e293b;">${escapeHtml(convocante)}</td>
            <td style="padding: 4px 8px; color: #64748b;"><strong>Lugar/Vía:</strong></td>
            <td style="padding: 4px 8px; color: #1e293b;">${escapeHtml(lugar)}</td>
          </tr>
        </table>
      </div>

      <!-- OBJETIVO -->
      <div style="margin-bottom: 18px;">
        <div style="font-size: 12px; font-weight: 800; color: #1753A2; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 3px;">
          1. Objetivo de la Sesión
        </div>
        <p style="font-size: 11.5px; color: #334155; margin: 0; line-height: 1.5; background: #ffffff; padding: 6px 0;">
          ${escapeHtml(minutaData.objetivo || "Alinear avances y acuerdos de los proyectos prioritarios de Grupo Fórmula.")}
        </p>
      </div>

      <!-- ASISTENTES -->
      <div style="margin-bottom: 18px;">
        <div style="font-size: 12px; font-weight: 800; color: #1753A2; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 3px;">
          2. Asistentes y Convocados
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; color: #0d2b52;">
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1;">Nombre</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1;">Área / Dirección</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1;">Rol</th>
            </tr>
          </thead>
          <tbody>
            ${asistentesHTML}
          </tbody>
        </table>
      </div>

      <!-- RESUMEN EJECUTIVO -->
      <div style="margin-bottom: 18px;">
        <div style="font-size: 12px; font-weight: 800; color: #1753A2; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 3px;">
          3. Resumen Ejecutivo
        </div>
        <div style="font-size: 11.5px; color: #334155; line-height: 1.55; white-space: pre-line; background: #ffffff; padding: 4px 0;">
          ${escapeHtml(minutaData.resumenEjecutivo || "No se redactó resumen ejecutivo.")}
        </div>
      </div>

      <!-- ESTATUS POR PROYECTO (SEMÁFORO) -->
      <div style="margin-bottom: 18px; page-break-inside: avoid;">
        <div style="font-size: 12px; font-weight: 800; color: #1753A2; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 3px;">
          4. Estatus por Proyecto (Semáforo de Desempeño)
        </div>
        <div>
          ${proyectosHTML}
        </div>
      </div>

      <!-- DECISIONES TOMADAS -->
      <div style="margin-bottom: 18px; page-break-inside: avoid;">
        <div style="font-size: 12px; font-weight: 800; color: #1753A2; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 3px;">
          5. Decisiones Tomadas
        </div>
        <div style="background: #f8fafc; border-left: 3px solid #1753a2; padding: 10px 14px; border-radius: 0 6px 6px 0;">
          ${decisionesHTML}
        </div>
      </div>

      <!-- MATRIZ DE RIESGOS -->
      <div style="margin-bottom: 18px; page-break-inside: avoid;">
        <div style="font-size: 12px; font-weight: 800; color: #1753A2; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 3px;">
          6. Riesgos y Bloqueos Identificados
        </div>
        <div>
          ${riesgosHTML}
        </div>
      </div>

      <!-- TABLA DE ACCIONES Y COMPROMISOS -->
      <div style="margin-bottom: 22px; page-break-inside: avoid;">
        <div style="font-size: 12px; font-weight: 800; color: #1753A2; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 3px;">
          7. Tabla de Acciones y Compromisos
        </div>
        <div>
          ${accionesHTML}
        </div>
      </div>

      <!-- PRÓXIMA SESIÓN -->
      <div style="margin-bottom: 25px; page-break-inside: avoid;">
        <div style="background: #eef5fd; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11.5px; color: #1e40af; font-weight: 700;">📅 Próxima Sesión Acordada:</span>
          <span style="font-size: 12px; color: #0d2b52; font-weight: 800;">${escapeHtml(proximaSesion)}</span>
        </div>
      </div>

      <!-- PIE DE PÁGINA OBLIGATORIO -->
      <div style="margin-top: 30px; border-top: 1.5px solid #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b;">
        <span>Grupo Fórmula — Oficina de Gestión de Proyectos (PMO)</span>
        <span style="font-weight: 800; color: #dc2626; letter-spacing: 0.8px; text-transform: uppercase;">Documento confidencial</span>
        <span>Generado el ${new Date().toLocaleDateString("es-MX")}</span>
      </div>

    </div>
  `;

  const fileName = `Minuta_PMO_Formula_${fechaStr}_${slugify(titulo)}.pdf`;

  // Intentar exportar usando html2pdf.js si está cargado
  if (window.html2pdf) {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(exportContainer).save().then(() => {
      exportContainer.innerHTML = "";
    }).catch(err => {
      console.warn("Fallo html2pdf, recurriendo a diálogo de impresión nativo:", err);
      fallbackToPrint();
    });
  } else {
    fallbackToPrint();
  }

  function fallbackToPrint() {
    window.print();
  }
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

function slugify(text) {
  return String(text || "minuta")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 30);
}
