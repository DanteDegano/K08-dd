// === USUARIO ===
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = prompt('Ingresá un nombre de usuario único para guardar tu avance:');
  localStorage.setItem('userId', userId);
}

// === FUNCIONES DE ESTADO ===
async function guardarEstadosEnFirestore() {
  const estados = {};
  document.querySelectorAll('.materia').forEach(m => {
    const nombre = m.getAttribute('data-nombre');
    const estado = m.querySelector('.estado-select')?.value || 'ninguno';
    estados[nombre] = estado;
  });
  await db.collection('usuarios').doc(userId).set({ estados });
}

async function restaurarEstadosDesdeFirestore() {
  const doc = await db.collection('usuarios').doc(userId).get();
  if (doc.exists) {
    const estados = doc.data().estados || {};
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
}

// === FUNCIONES DE MATERIAS ===
function actualizarClaseMateria(materia, estado) {
  console.log('actualizarClaseMateria:', materia, estado);
  const estados = ['en-curso', 'aprobada', 'cursada', 'promocionada', 'bloqueada'];
  materia.classList.remove(...estados);
  materia.querySelector('.estado-select').className = 'estado-select ' + estado;
  if (estado !== 'ninguno') {
    materia.classList.add(estado);
    console.log('Clase agregada:', estado);
  }
}

function inicializarSelects() {
  document.querySelectorAll('.estado-select').forEach(select => {
    select.addEventListener('change', async () => {
      const materia = select.closest('.materia');
      actualizarClaseMateria(materia, select.value);
      if (typeof actualizarResaltadoYColores === 'function') actualizarResaltadoYColores();
      await guardarEstadosEnFirestore();
    });
  });
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

function cargarMateriasDesdeJSON() {
  fetch('correlativas.json')
    .then(res => res.json())
    .then(data => {
      const materiasPorAnio = {};
      data.forEach(m => {
        const anio = m.anio || 'Sin año';
        if (!materiasPorAnio[anio]) materiasPorAnio[anio] = [];
        materiasPorAnio[anio].push(m);
      });
      const niveles = [1, 2, 3, 4, 5];
      const materiasHTML = niveles.map(anio => {
        const materias = (materiasPorAnio[anio] || []).map(crearMateriaHTML).join('');
        return `<div class="año"><h2>${anio}° Nivel</h2>${materias}</div>`;
      }).join('');
      document.getElementById('materias').innerHTML = `
        <div class="niveles-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:1rem;">
          ${materiasHTML}
        </div>`;
      inicializarSelects();
      restaurarEstadosDesdeFirestore().then(() => {
        if (typeof actualizarResaltadoYColores === 'function') actualizarResaltadoYColores();
      });
    });
}


// === MODO OSCURO ===
function setDarkModeButton() {
  const btn = document.getElementById('darkModeToggle');
  const icon = document.getElementById('darkModeIcon');
  const text = document.getElementById('darkModeText');
  btn.querySelectorAll('.star').forEach(e => e.remove());

  if (document.body.classList.contains('dark-mode')) {
    icon.textContent = '🌙';
    text.textContent = 'Modo Oscuro';
    btn.classList.add('luna');
    btn.classList.remove('sol');
    for (let i = 0; i < 18; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      const size = Math.random() * 2.5 + 1.5;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 95}%`;
      star.style.top = `${Math.random() * 80}%`;
      star.style.animationDelay = `${Math.random() * 2}s`;
      btn.appendChild(star);
    }
  } else {
    icon.textContent = '☀️';
    text.textContent = 'Modo Claro';
    btn.classList.add('sol');
    btn.classList.remove('luna');
  }
}

function inicializarModoOscuro() {
  const btn = document.getElementById('darkModeToggle');
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    setDarkModeButton();
    if (typeof actualizarResaltadoYColores === 'function') actualizarResaltadoYColores();
  });
  setDarkModeButton();
}

// === TOGGLE DE SUGERENCIAS ===
function inicializarSugerenciasBot() {
  const aside = document.getElementById('sugerencias-bot');
  const btn = document.getElementById('toggle-sugerencias');
  const contenido = document.getElementById('sugerencias-contenido');
  let visible = true;

  btn.addEventListener('click', () => {
    visible = !visible;
    contenido.style.maxHeight = visible ? '420px' : '0';
    contenido.style.opacity = visible ? '1' : '0';
    contenido.style.pointerEvents = visible ? '' : 'none';
    btn.textContent = visible ? 'Ocultar' : 'Mostrar';
  });

  contenido.style.transition = 'max-height 0.3s, opacity 0.3s';
  contenido.style.maxHeight = '420px';
  contenido.style.opacity = '1';
}

// === INICIALIZACIÓN GLOBAL ===
window.addEventListener('DOMContentLoaded', () => {
  inicializarModoOscuro();
  inicializarSugerenciasBot();
  cargarMateriasDesdeJSON();
});
