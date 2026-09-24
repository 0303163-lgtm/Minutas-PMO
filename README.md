# Minutas Ejecutivas PMO — Grupo Fórmula 🎙️📋

Aplicación web institucional de minutas ejecutivas desarrollada para la **Oficina de Gestión de Proyectos (PMO)** de **Grupo Fórmula**, con persistencia en la nube mediante **Cloud Firestore**, control de acceso con **Firebase Authentication**, exportación a **PDF formal** y diseño corporativo basado en la identidad oficial.

---

## 🚀 Características Principales

1. **Campos Ejecutivos en Español**:
   - **Datos de la Sesión**: Fecha, Hora de inicio y fin, Sede/Modalidad (Teams/Presencial) y Convocante PMO.
   - **Asistentes**: Gestor dinámico con Nombre, Área/Dirección, Rol y Asistencia.
   - **Objetivo Estratégico**: Propósito claro de la reunión.
   - **Resumen Ejecutivo**: Síntesis de alto nivel para Dirección General.
   - **Estatus por Proyecto con Semáforo Interactivo**:
     - 🟢 **Verde**: En tiempo / Sin desvíos.
     - 🟡 **Amarillo**: En riesgo / Observación.
     - 🔴 **Rojo**: Crítico / Retraso significativo.
     - Porcentaje de avance (0-100%), líder asignado y notas de hitos/desvíos.
     - Filtros de visualización por estatus.
   - **Decisiones Tomadas**: Registro numerado de acuerdos directivos institucionales.
   - **Matriz de Riesgos**: Nivel de impacto (Bajo, Medio, Alto) y estrategias de mitigación.
   - **Tabla de Acciones & Compromisos**: Qué (tarea), Quién (responsable), Fecha Límite y Estado (Pendiente / En proceso / Concluido).
   - **Próxima Sesión**: Coordenadas para el siguiente comité o sesión PMO.

2. **Botón "Nueva Minuta"**:
   - Guarda y archiva automáticamente la minuta actual en el historial de Firestore y genera un nuevo folio en blanco listo para redactar.

3. **Historial de Minutas**:
   - Panel lateral deslizante que consulta las minutas más recientes en Cloud Firestore ordenadas por fecha descendente.
   - Buscador por palabra clave en tiempo real.
   - Carga instantánea de cualquier minuta anterior para continuar editando.

4. **Exportación a PDF Ejecutivo**:
   - Encabezado formal con el logotipo oficial de Grupo Fórmula en alta resolución.
   - Formato institucional de reporte directivo A4 / Carta.
   - Pie de página obligatorio en cada página: `"Grupo Fórmula | PMO Corporativa — Documento confidencial"`.

5. **Seguridad y Firebase Authentication**:
   - Solo usuarios autenticados del equipo pueden entrar y editar.
   - Reglas de seguridad en `firestore.rules`:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```

---

## 💰 Confirmación de Plan Spark (100% Gratuito)

**No requieres contratar el plan Blaze**. Todas las funciones operan dentro del **Plan Gratuito Spark** de Firebase:
- **Firebase Hosting**: 10 GB de almacenamiento gratuito.
- **Cloud Firestore**: 1 GiB de almacenamiento, 50,000 lecturas y 20,000 escrituras diarias gratuitas.
- **Firebase Authentication**: Hasta 50,000 usuarios activos mensuales gratuitos.

---

## 🛠️ Ejecución Local

Para probar la aplicación en tu computadora:

```bash
# Iniciar servidor local
python3 -m http.server 8080
# o bien
npx --yes serve . -p 8080
```

Abre en tu navegador: [http://localhost:8080](http://localhost:8080)

---

## 🌐 Publicación en Firebase Hosting

Para desplegar la aplicación a internet en tu propio dominio `.web.app` de Firebase:

1. Inicia sesión en Firebase CLI:
   ```bash
   npx --yes firebase-tools login
   ```

2. Si ya creaste tu proyecto en la consola de Firebase ([console.firebase.google.com](https://console.firebase.google.com/)), asócialo:
   ```bash
   npx --yes firebase-tools use --add
   ```

3. Publica la aplicación y las reglas de seguridad:
   ```bash
   npx --yes firebase-tools deploy
   ```

¡Tu aplicación quedará publicada en segundos sin costo!
