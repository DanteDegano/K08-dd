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
  // Siempre iniciar cerrado
  let visible = false;

  btn.addEventListener('click', () => {
    visible = !visible;
    contenido.style.maxHeight = visible ? '420px' : '0';
    contenido.style.opacity = visible ? '1' : '0';
    contenido.style.pointerEvents = visible ? '' : 'none';
    btn.textContent = visible ? 'Ocultar' : 'Mostrar';
  });

  contenido.style.transition = 'max-height 0.3s, opacity 0.3s';
  contenido.style.maxHeight = '0';
  contenido.style.opacity = '0';
  contenido.style.pointerEvents = 'none';
  btn.textContent = 'Mostrar';
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

// Mejorar el estilo del botón de modo oscuro para íconos circulares y tamaño 60x60
if (!document.getElementById('darkmode-fix-style')) {
  const style = document.createElement('style');
  style.id = 'darkmode-fix-style';
  style.innerHTML = `
    #darkModeToggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      padding: 0;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px #0002;
      transition: background 0.2s;
    }
    #darkModeToggle:hover {
      background: #f3e6f3;
    }
    #darkModeIcon {
      font-size: 2em;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: none;
      margin: 0;
      padding: 0;
      padding-left: 7px;
      padding-bottom: 7px;
    }
  `;
  document.head.appendChild(style);
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
      mostrarLoadingUTN();
      await firebase.auth().signInWithPopup(provider);
    } catch (e) {
      alert('Error al iniciar sesión: ' + e.message);
      if (document.getElementById('loading-overlay')) document.getElementById('loading-overlay').remove();
    }
  };
}

function cerrarLoginGooglePopup() {
  const overlay = document.getElementById('login-blur-overlay');
  if (overlay) overlay.remove();
}

function mostrarLogout(nombre) {
  // Eliminar cualquier logoutDiv anterior
  const oldLogoutDiv = document.getElementById('logout-google-box');
  if (oldLogoutDiv) oldLogoutDiv.remove();
  // Buscar el header y agregar los botones ahí
  const header = document.querySelector('header');
  let logoutDiv = document.createElement('div');
  logoutDiv.id = 'logout-google-box';
  logoutDiv.style = 'display:flex;justify-content:flex-end;align-items:center;gap:16px;';
  logoutDiv.innerHTML = `
    <div class="user-info" style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
      <span style='font-size:1em;color:#ffffff;'>${nombre}</span>
      <span class="user-email" style='font-size:0.95em;color:#666;'>${firebase.auth().currentUser?.email || ''}</span>
    </div>
    <div class="logout-btns" style="display:flex;gap:8px;">
      <button id="guardar-cambios-btn" class="hover-guardar-btn" style="background:#52023f;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-size:1em;cursor:pointer;transition:background 0.2s;">Guardar cambios</button>
      <button id="logout-google-btn" style="background:#52023f;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-size:1em;cursor:pointer;">Cerrar sesión</button>
    </div>`;
  // Hover visual y feedback para el botón guardar cambios
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.innerHTML = `
      .hover-guardar-btn:hover { background: #218c5a !important; }
      .hover-guardar-btn.clicked {
        background: #43b97b !important;
        transform: scale(0.96);
        transition: background 0.2s, transform 0.1s;
      }
      .toast {
        position: fixed;
        left: 50%;
        bottom: 32px;
        transform: translateX(-50%);
        background: #222;
        color: #fff;
        padding: 14px 32px;
        border-radius: 8px;
        font-size: 1.1em;
        box-shadow: 0 2px 16px #0003;
        opacity: 0;
        pointer-events: none;
        z-index: 99999;
        transition: opacity 0.3s;
      }
      .toast.show { opacity: 1; pointer-events: auto; }
      @media (max-width: 720px) {
        .toast { font-size: 1em; padding: 10px 16px; }
      }
    `;
    document.head.appendChild(style);
  }
  if (!document.getElementById('toast-container')) {
    const toast = document.createElement('div');
    toast.id = 'toast-container';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  function showToast(msg, success = true) {
    const toast = document.getElementById('toast-container');
    toast.textContent = msg;
    toast.style.background = success ? '#1b7a4a' : '#b71c1c';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }
  header.appendChild(logoutDiv);
  const guardarBtn = document.getElementById('guardar-cambios-btn');
  guardarBtn.onclick = null;
  guardarBtn.addEventListener('click', async () => {
    // Feedback visual inmediato
    guardarBtn.classList.add('clicked');
    guardarBtn.disabled = true;
    setTimeout(() => guardarBtn.classList.remove('clicked'), 180);
    const user = firebase.auth().currentUser;
    if (user) {
      // Construir array de materias con nombre y estado (solo si tiene estado válido)
      const materias = [];
      document.querySelectorAll('.materia').forEach(m => {
        const select = m.querySelector('.estado-select');
        if (!select) return;
        const estado = select.value;
        if (!estado || estado === 'ninguno') return;
        const nombreMateria = m.getAttribute('data-nombre');
        materias.push({ nombre: nombreMateria, estado });
      });
      const datosUsuario = {
        nombre: user.displayName || '',
        email: user.email || '',
        materias
      };
      try {
        await db.collection('usuarios').doc(user.uid).set(datosUsuario);
        console.log('Datos guardados correctamente en Firestore');
        showToast('Cambios guardados correctamente', true);
      } catch (e) {
        console.error('Error en el guardado de datos:', e);
        showToast('Error al guardar los datos', false);
      }
    } else {
      showToast('Debes iniciar sesión para guardar tus cambios.', false);
    }
    setTimeout(() => { guardarBtn.disabled = false; }, 1200);
  });
  const logoutBtn = document.getElementById('logout-google-btn');
  logoutBtn.onclick = null;
  logoutBtn.addEventListener('click', async () => {
    try {
      window.isLoggingOut = true;
      document.querySelectorAll('.estado-select').forEach(select => {
        select.disabled = true;
      });
      await firebase.auth().signOut();
      location.reload();
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
      showToast('Error al cerrar sesión', false);
    }
  });
}

// === Guardar y cargar estados en Firestore ===
async function guardarEstadosFirestore(uid, estados) {
  if (window.isLoggingOut) return; // No guardar si está en logout
  await db.collection('usuarios').doc(uid).set({ estados });
}

async function cargarEstadosFirestore(uid) {
  const doc = await db.collection('usuarios').doc(uid).get();
  return doc.exists ? doc.data().estados : null;
}

// === Sincronización en tiempo real de estados con Firestore ===
// (Sin listeners en tiempo real, no se necesita unsubscribeEstados)

firebase.auth().onAuthStateChanged(async user => {
  const overlay = document.getElementById('login-blur-overlay');
  const logoutDiv = document.getElementById('logout-google-box');
  if (user) {
    if (overlay) overlay.remove();
    mostrarLogout(user.displayName || user.email);
    // Al iniciar sesión, cargar los datos una sola vez desde Firestore
    const doc = await db.collection('usuarios').doc(user.uid).get();
    let materias = doc.exists && doc.data().materias ? doc.data().materias : [];
    // Restaurar en la UI según nombre de materia
    document.querySelectorAll('.materia').forEach(m => {
      const nombre = m.getAttribute('data-nombre');
      const select = m.querySelector('.estado-select');
      if (!select) return;
      const materiaGuardada = materias.find(mat => mat.nombre === nombre);
      if (materiaGuardada) {
        select.value = materiaGuardada.estado;
        actualizarClaseMateria(m, materiaGuardada.estado);
      } else {
        select.value = '';
        actualizarClaseMateria(m, 'ninguno');
      }
    });
    actualizarSugerencias();
    // Habilitar selects por si quedaron deshabilitados
    document.querySelectorAll('.estado-select').forEach(select => {
      select.disabled = false;
    });
  } else {
    if (logoutDiv) logoutDiv.remove();
    inicializarLoginGoogle();
    // Limpiar estados locales
    localStorage.removeItem('estados');
    await restaurarEstadosLocal();
    actualizarSugerencias();
  }
});

// === Inicio ===
window.addEventListener('DOMContentLoaded', async () => {
  mostrarLoadingUTN();
  // Esperar login y datos si hay usuario
  await new Promise(resolve => {
    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        const start = Date.now();
        await cargarMateriasDesdeJSON();
        mostrarLogout(user.displayName || user.email);
        const doc = await db.collection('usuarios').doc(user.uid).get();
        let materias = doc.exists && doc.data().materias ? doc.data().materias : [];
        document.querySelectorAll('.materia').forEach(m => {
          const nombre = m.getAttribute('data-nombre');
          const select = m.querySelector('.estado-select');
          if (!select) return;
          const materiaGuardada = materias.find(mat => mat.nombre === nombre);
          if (materiaGuardada) {
            select.value = materiaGuardada.estado;
            actualizarClaseMateria(m, materiaGuardada.estado);
          } else {
            select.value = '';
            actualizarClaseMateria(m, 'ninguno');
          }
        });
        actualizarSugerencias();
        document.querySelectorAll('.estado-select').forEach(select => { select.disabled = false; });
        // Esperar al menos 2 segundos para UX
        const elapsed = Date.now() - start;
        const minWait = 2000;
        if (elapsed < minWait) {
          setTimeout(() => {
            if (document.getElementById('loading-overlay')) document.getElementById('loading-overlay').remove();
            resolve();
          }, minWait - elapsed);
        } else {
          if (document.getElementById('loading-overlay')) document.getElementById('loading-overlay').remove();
          resolve();
        }
      } else {
        await cargarMateriasDesdeJSON();
        if (document.getElementById('loading-overlay')) document.getElementById('loading-overlay').remove();
        resolve();
      }
    });
  });
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

function mostrarLoadingUTN() {
  if (document.getElementById('loading-overlay')) return;
  let overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff9;z-index:99999;display:flex;align-items:center;justify-content:center;font-size:1.5em;color:#333;flex-direction:column;gap:18px;';
  overlay.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="utn-logo-spinner">
        <svg width="90" height="106" viewBox="0 0 595.3 699.4" xmlns="http://www.w3.org/2000/svg">
          <path clip-rule="evenodd" d="m246.6 0h102v190.8c80.8-22.4 140.4-96.7 140.4-184.4h106.3c0 146.5-106.8 268.9-246.6 293.2v4.4h233.9v104.2h-214.4c130 31.8 227 149.5 227 289.1h-106.2c0-87.7-59.6-162-140.3-184.4v186.5h-102v-186.5c-80.7 22.4-140.3 96.7-140.3 184.4h-106.4c0-139.6 97-257.3 227-289.1h-214.2v-104.2h233.9v-4.4c-139.9-24.3-246.7-146.7-246.7-293.2h106.3c0 87.7 59.6 162 140.3 184.4z" fill="#222" fill-rule="evenodd"/>
        </svg>
      </div>
      <div id="loading-text">Cargando tus materias...</div>
    </div>
  `;
  document.body.appendChild(overlay);
  if (!document.getElementById('utn-logo-style')) {
    const style = document.createElement('style');
    style.id = 'utn-logo-style';
    style.innerHTML = `
      .utn-logo-spinner svg {
        animation: utn-spin 1.2s linear infinite;
        display: block;
      }
      @keyframes utn-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}