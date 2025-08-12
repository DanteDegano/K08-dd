// === Long press para modo oscuro en mobile ===
function inicializarLongPressDarkMode() {
  let pressTimer;
  const isMobile = window.innerWidth <= 720;
  if (!isMobile) return;
  const target = document.body; // O usar document.querySelector('main') si prefieres
  target.addEventListener('touchstart', function(e) {
    pressTimer = setTimeout(() => {
      // Cambiar modo oscuro
      const activo = document.body.classList.toggle('dark-mode');
      localStorage.setItem('modoOscuro', activo);
      const icono = document.getElementById('darkModeIcon');
      if (icono) icono.textContent = activo ? '☀️' : '🌙';
    }, 700); // 700ms para long press
  });
  target.addEventListener('touchend', function(e) {
    clearTimeout(pressTimer);
  });
  target.addEventListener('touchmove', function(e) {
    clearTimeout(pressTimer);
  });
}
// === Carga materias desde correlativas.json ===
async function cargarMateriasDesdeJSON() {
  try {
  const res = await fetch('correlativas.json');
    const data = await res.json();

    // Guardar materiasData global para sugerencias
    window._materiasData = data;

    const materiasPorAnio = {};
    data.forEach(m => {
      const anio = m.anio || 'Sin año';
      if (!materiasPorAnio[anio]) materiasPorAnio[anio] = [];
      materiasPorAnio[anio].push(m);
    });


    const niveles = [1, 2, 3, 4, 5];
    // Detectar si es mobile (ancho <= 700px)
    const isMobile = window.innerWidth <= 700;
    let materiasHTML;
    if (isMobile) {
      materiasHTML = niveles.map(anio => {
        const materias = (materiasPorAnio[anio] || []).map(crearMateriaHTML).join('');
        return `
          <div class="acordeon-nivel">
            <button class="acordeon-titulo" aria-expanded="false">${anio}° Nivel</button>
            <div class="acordeon-contenido" style="display:none;">${materias}</div>
          </div>
        `;
      }).join('');
      document.getElementById('materias').innerHTML = `
        <div class="acordeon-niveles">
          ${materiasHTML}
        </div>`;
      inicializarAcordeonNiveles();
    } else {
      materiasHTML = niveles.map(anio => {
        const materias = (materiasPorAnio[anio] || []).map(crearMateriaHTML).join('');
        return `<div class="año"><h2>${anio}° Nivel</h2>${materias}</div>`;
      }).join('');
      document.getElementById('materias').innerHTML = `
        <div class="niveles-grid">
          ${materiasHTML}
        </div>`;
    }
    inicializarSelects();
    await restaurarEstadosLocal();
    actualizarSugerencias();
// === Inicializar acordeón de niveles ===
function inicializarAcordeonNiveles() {
  document.querySelectorAll('.acordeon-titulo').forEach(btn => {
    btn.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.acordeon-titulo').forEach(b => b.setAttribute('aria-expanded', 'false'));
      document.querySelectorAll('.acordeon-contenido').forEach(c => c.style.display = 'none');
      if (!expanded) {
        this.setAttribute('aria-expanded', 'true');
        this.nextElementSibling.style.display = 'block';
      }
    });
  });
  // Por defecto, todos cerrados (no hacer nada)
}

  } catch (error) {
    console.error('Error cargando correlativas.json:', error);
  }
}

function crearMateriaHTML(m) {
  return `
    <div class="materia" 
      data-nombre="${m.nombre}"
      data-correlativas-para-cursar-aprobadas='${JSON.stringify(m.correlativas_para_cursar_aprobadas)}'
      data-correlativas-para-cursar-cursadas='${JSON.stringify(m.correlativas_para_cursar_cursadas)}'
      data-correlativas-para-final='${JSON.stringify(m.correlativas_para_final)}'>
      <h3>${m.nombre}</h3>
      <p><strong>Horas semanales:</strong> ${m.horas_semanales ? m.horas_semanales + ' Hs' : '-'}</p>
      <label>Estado:
        <select class="estado-select">
          <option value="ninguno">—</option>
          <option value="en-curso">En Curso</option>
          <option value="cursada">Cursada</option>
          <option value="aprobada">Aprobada</option>
          <option value="promocionada">Promocionada</option>
        </select>
      </label>
      <div class="correlativas">
        <strong>Requisitos para cursar:</strong>
        <ul style="list-style:none;padding-left:0;margin:0">
          <li><strong>Aprobadas/Promocionadas:</strong> <span class="correlativas-aprobadas">${m.correlativas_para_cursar_aprobadas.join(', ') || '—'}</span></li>
          <li><strong>Cursadas:</strong> <span class="correlativas-cursadas">${m.correlativas_para_cursar_cursadas.join(', ') || '—'}</span></li>
        </ul>
        <strong>Requisitos para Final:</strong>
        <ul style="list-style:none;padding-left:0;margin:0">
          <li><strong>Aprobadas/Promocionadas:</strong> <span class="correlativas-aprobadas-final">${m.correlativas_para_final.join(', ') || '—'}</span></li>
        </ul>
      </div>
    </div>
  `;
}

// === Guardar y restaurar estados ===
async function guardarEstadosLocal() {
  const estados = {};
  document.querySelectorAll('.materia').forEach(m => {
    const nombre = m.getAttribute('data-nombre');
    const estado = m.querySelector('.estado-select')?.value || 'ninguno';
    estados[nombre] = estado;
  });
  localStorage.setItem('estados', JSON.stringify(estados));
}

async function restaurarEstadosLocal() {
  const estados = JSON.parse(localStorage.getItem('estados') || '{}');
  document.querySelectorAll('.materia').forEach(m => {
    const nombre = m.getAttribute('data-nombre');
    const estado = estados[nombre];
    const select = m.querySelector('.estado-select');
    if (estado && select) {
      select.value = estado;
      actualizarClaseMateria(m, estado);
    }
  });
}

function actualizarClaseMateria(materia, estado) {
  const estados = ['en-curso', 'aprobada', 'cursada', 'promocionada', 'bloqueada'];
  materia.classList.remove(...estados);
  const select = materia.querySelector('.estado-select');
  if (select) {
    select.className = 'estado-select ' + estado;
  }
  if (estado !== 'ninguno') {
    materia.classList.add(estado);
  }
}

// === Sugerencias ===
function actualizarSugerencias() {
  const estados = {};
  document.querySelectorAll('.materia').forEach(m => {
    const nombre = m.getAttribute('data-nombre');
    const estado = m.querySelector('.estado-select')?.value || 'ninguno';
    estados[nombre] = estado;
  });

  // Función para obtener el porcentaje de carrera según el estado
  function obtenerPorcentaje(estado) {
    if (estado === 'aprobada' || estado === 'promocionada') return 100;
    if (estado === 'cursada') return 50;
    return 0;
  }

  // Calcular porcentaje total de carrera completada
  const materias = document.querySelectorAll('.materia');
  let suma = 0;
  materias.forEach(m => {
    const estado = m.querySelector('.estado-select')?.value || 'ninguno';
    suma += obtenerPorcentaje(estado);
  });
  const porcentajeCarrera = materias.length > 0 ? Math.round(suma / materias.length) : 0;

  function correlativasCumplidas(materia, tipo) {
    const aprobadasReq = JSON.parse(materia.getAttribute('data-correlativas-para-cursar-aprobadas') || '[]');
    const cursadasReq = JSON.parse(materia.getAttribute('data-correlativas-para-cursar-cursadas') || '[]');
    const finalReq = JSON.parse(materia.getAttribute('data-correlativas-para-final') || '[]');

    if (tipo === 'cursar_aprobadas') {
      return aprobadasReq.every(req => ['aprobada', 'promocionada'].includes(estados[req]));
    }
    if (tipo === 'cursar_cursadas') {
      return cursadasReq.every(req => ['cursada'].includes(estados[req]));
    }
    if (tipo === 'final') {
      return finalReq.every(req => ['aprobada', 'promocionada'].includes(estados[req]));
    }
    return false;
  }

  // Recolectar materias con su nivel para priorizar
  const paraAnotar = [];
  const paraRendirFinal = [];
  // Obtener niveles desde correlativas.json (window._materiasData)
  const materiasNivel = {};
  if (window._materiasData) {
    window._materiasData.forEach(m => {
      materiasNivel[m.nombre] = m.anio;
    });
  } else {
    document.querySelectorAll('.materia').forEach(m => {
      const nombre = m.getAttribute('data-nombre');
      materiasNivel[nombre] = 99;
    });
  }

  document.querySelectorAll('.materia').forEach(m => {
    const nombre = m.getAttribute('data-nombre');
    const estado = estados[nombre];

    if (!['cursada', 'aprobada', 'promocionada', 'en-curso'].includes(estado)) {
      // Requisitos: todas las correlativas aprobadas/promocionadas Y todas las cursadas
      const aprobadasReq = JSON.parse(m.getAttribute('data-correlativas-para-cursar-aprobadas') || '[]');
      const cursadasReq = JSON.parse(m.getAttribute('data-correlativas-para-cursar-cursadas') || '[]');
      const cumpleAprobadas = aprobadasReq.every(req => ['aprobada', 'promocionada'].includes(estados[req]));
      const cumpleCursadas = cursadasReq.every(req => ['cursada'].includes(estados[req]));
      if (cumpleAprobadas && cumpleCursadas) {
        paraAnotar.push({ nombre, nivel: materiasNivel[nombre] });
        m.classList.add('disponible-cursar');
      } else {
        m.classList.remove('disponible-cursar');
      }
    }

    // Solo materias con estado 'cursada' pueden rendir final
    if (estado === 'cursada') {
      if (correlativasCumplidas(m, 'final')) {
        paraRendirFinal.push(nombre);
      }
    }
  });

  // Ordenar y limitar materias para anotar (máximo 3, menor nivel primero)
  paraAnotar.sort((a, b) => a.nivel - b.nivel);
  const paraAnotarLimit = paraAnotar.slice(0, 3);

  const contenido = document.getElementById('sugerencias-contenido');
  // Diseño visual con HTML
  let html = '';
  html += `<div class="sug-carrera">Carrera completada: <span>${porcentajeCarrera}%</span></div>`;

  if (paraAnotarLimit.length === 0) {
    html += '<div style="margin-bottom:10px;">No hay materias recomendadas para anotarte por ahora.</div>';
  } else {
    html += '<div class="sug-anotar-titulo">Podés anotarte a cursar estas materias:</div>';
    html += '<ul class="sug-anotar-list">';
    paraAnotarLimit.forEach(obj => {
      html += `<li><span class='sug-materia-nombre'>${obj.nombre}</span> <span class='sug-materia-nivel'>(Nivel ${obj.nivel})</span></li>`;
    });
    html += '</ul>';
  }

  if (paraRendirFinal.length === 0) {
    html += '<div>No hay finales recomendados para rendir por ahora.</div>';
  } else {
    html += '<div class="sug-final-titulo">Podés rendir el final de estas materias:</div>';
    html += '<ul class="sug-final-list">';
    paraRendirFinal.forEach(nombre => {
      html += `<li><span class='sug-materia-nombre'>${nombre}</span></li>`;
    });
    html += '</ul>';
  }

  contenido.innerHTML = html;
}

// === Selects ===
function inicializarSelects() {
  document.querySelectorAll('.estado-select').forEach(select => {
    select.addEventListener('change', async () => {
      const materia = select.closest('.materia');
      actualizarClaseMateria(materia, select.value);
      await guardarEstadosLocal();
      // Forzar recarga de estados y sugerencias para reflejar cambios en Vercel
      await restaurarEstadosLocal();
      actualizarSugerencias();
    });
  });
}

// === Sugerencias Bot Mostrar/Ocultar ===
function inicializarSugerenciasBot() {
  const btn = document.getElementById('toggle-sugerencias');
  const contenido = document.getElementById('sugerencias-contenido');
  // Si es mobile, iniciar oculto; si no, visible
  let visible = window.innerWidth > 720;

  btn.addEventListener('click', () => {
    visible = !visible;
    contenido.style.maxHeight = visible ? '420px' : '0';
    contenido.style.opacity = visible ? '1' : '0';
    contenido.style.pointerEvents = visible ? '' : 'none';
    btn.textContent = visible ? 'Ocultar' : 'Mostrar';
  });

  contenido.style.transition = 'max-height 0.3s, opacity 0.3s';
  contenido.style.maxHeight = visible ? '420px' : '0';
  contenido.style.opacity = visible ? '1' : '0';
  contenido.style.pointerEvents = visible ? '' : 'none';
  btn.textContent = visible ? 'Ocultar' : 'Mostrar';
}

// === Modo Oscuro ===
function inicializarModoOscuro() {
  const boton = document.getElementById('darkModeToggle');
  const icono = document.getElementById('darkModeIcon');

  const estadoInicial = localStorage.getItem('modoOscuro') === 'true';
  if (estadoInicial) {
    document.body.classList.add('dark-mode');
    icono.textContent = '☀️';
  } else {
    icono.textContent = '🌙';
  }
  boton.addEventListener('click', () => {
    const activo = document.body.classList.toggle('dark-mode');
    localStorage.setItem('modoOscuro', activo);
    icono.textContent = activo ? '☀️' : '🌙';
  });
}

// === Login con Google y manejo de usuario ===
function inicializarLoginGoogle() {
  // Crear overlay blureado
  let overlay = document.getElementById('login-blur-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'login-blur-overlay';
    overlay.style = `
      position: fixed; z-index: 9999; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;`;
    document.body.appendChild(overlay);
  }
  // Crear popup
  let popup = document.getElementById('login-google-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'login-google-popup';
    popup.style = `
      background: #fff; border-radius: 18px; box-shadow: 0 4px 32px #0005; padding: 38px 32px 32px 32px; min-width: 280px; max-width: 90vw;
      display: flex; flex-direction: column; align-items: center; gap: 18px; position: relative;`;
    popup.innerHTML = `
      <h2 style='margin-bottom:10px;font-size:1.3em;color:#7a1b63;'>Iniciar sesión</h2>
      <button id="login-google-btn" style="background:#fff;color:#222;border:1px solid #ccc;padding:12px 28px;border-radius:8px;font-size:1.1em;display:flex;align-items:center;gap:10px;cursor:pointer;"><img src='https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' style='width:24px;height:24px;'> Iniciar sesión con Google</button>
    `;
    overlay.appendChild(popup);
  }
  document.getElementById('login-google-btn').onclick = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (e) {
      alert('Error al iniciar sesión: ' + e.message);
    }
  };
}

function cerrarLoginGooglePopup() {
  const overlay = document.getElementById('login-blur-overlay');
  if (overlay) overlay.remove();
}

function mostrarLogout(nombre) {
  let logoutDiv = document.getElementById('logout-google-box');
  if (!logoutDiv) {
    logoutDiv = document.createElement('div');
    logoutDiv.id = 'logout-google-box';
    logoutDiv.style = 'display:flex;justify-content:center;align-items:center;margin:30px 0;gap:16px;';
    logoutDiv.innerHTML = `<span style='font-size:1.1em;'>👤 ${nombre}</span><button id="logout-google-btn" style="background:#7a1b63;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-size:1em;cursor:pointer;">Cerrar sesión</button>`;
    document.body.prepend(logoutDiv);
  }
  document.getElementById('logout-google-btn').onclick = async () => {
    await firebase.auth().signOut();
    location.reload();
  };
}

// === Guardar y cargar estados en Firestore ===
async function guardarEstadosFirestore(uid, estados) {
  await db.collection('usuarios').doc(uid).set({ estados });
}

async function cargarEstadosFirestore(uid) {
  const doc = await db.collection('usuarios').doc(uid).get();
  return doc.exists ? doc.data().estados : null;
}

// === Sincronización en tiempo real de estados con Firestore ===
let unsubscribeEstados = null;

firebase.auth().onAuthStateChanged(async user => {
  const overlay = document.getElementById('login-blur-overlay');
  const logoutDiv = document.getElementById('logout-google-box');
  if (unsubscribeEstados) { unsubscribeEstados(); unsubscribeEstados = null; }
  if (user) {
    if (overlay) overlay.remove();
    mostrarLogout(user.displayName || user.email);
    // Escuchar en tiempo real los cambios de estados
    unsubscribeEstados = db.collection('usuarios').doc(user.uid)
      .onSnapshot(async doc => {
        let estados = doc.exists ? doc.data().estados : null;
        if (!estados) {
          // Si hay datos en localStorage, usarlos; si no, objeto vacío
          estados = JSON.parse(localStorage.getItem('estados') || '{}');
          await guardarEstadosFirestore(user.uid, estados);
        }
        localStorage.setItem('estados', JSON.stringify(estados));
        restaurarEstadosLocal();
        actualizarSugerencias();
      });
    // Guardar automáticamente en Firestore al cambiar estados
    document.querySelectorAll('.estado-select').forEach(select => {
      select.addEventListener('change', async () => {
        const nuevosEstados = JSON.parse(localStorage.getItem('estados') || '{}');
        await guardarEstadosFirestore(user.uid, nuevosEstados);
      });
    });
  } else {
    if (logoutDiv) logoutDiv.remove();
    if (unsubscribeEstados) { unsubscribeEstados(); unsubscribeEstados = null; }
    inicializarLoginGoogle();
    // Limpiar estados locales
    localStorage.removeItem('estados');
    await restaurarEstadosLocal();
    actualizarSugerencias();
  }
});


// === Inicio ===
window.addEventListener('DOMContentLoaded', () => {
  cargarMateriasDesdeJSON();
  inicializarSugerenciasBot();
  if (window.innerWidth > 720) {
    // Agregar botón de modo oscuro solo en desktop
    const header = document.querySelector('header');
    const btn = document.createElement('button');
    btn.id = 'darkModeToggle';
    btn.className = 'extravagant';
    btn.innerHTML = '<span id="darkModeIcon">🌙</span>';
    header.appendChild(btn);
    inicializarModoOscuro();
  }
  inicializarLongPressDarkMode();
});

// Redibujar acordeón/grid al cambiar el tamaño de la ventana
window.addEventListener('resize', () => {
  // Evitar recarga excesiva: solo si cambia de mobile a desktop o viceversa
  const wasMobile = document.querySelector('.acordeon-niveles');
  const isMobileNow = window.innerWidth <= 720;
  if ((wasMobile && !isMobileNow) || (!wasMobile && isMobileNow)) {
    cargarMateriasDesdeJSON();
  }
});