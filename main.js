// === Carga materias desde correlativas.json ===
async function cargarMateriasDesdeJSON() {
  try {
  const res = await fetch('correlativas.json');
    const data = await res.json();

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
  // Por defecto, abrir el primer nivel
  const firstBtn = document.querySelector('.acordeon-titulo');
  if (firstBtn) {
    firstBtn.setAttribute('aria-expanded', 'true');
    firstBtn.nextElementSibling.style.display = 'block';
  }
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
  const materiasNivel = {};
  document.querySelectorAll('.materia').forEach(m => {
    const nombre = m.getAttribute('data-nombre');
    const nivel = m.closest('.año')?.querySelector('h2')?.textContent?.match(/(\d+)/)?.[1] || '99';
    materiasNivel[nombre] = parseInt(nivel, 10);
  });

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
      actualizarSugerencias();
      await guardarEstadosLocal();
    });
  });
}

// === Sugerencias Bot Mostrar/Ocultar ===
function inicializarSugerenciasBot() {
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

// === Modo Oscuro ===
function inicializarModoOscuro() {
  const boton = document.getElementById('darkModeToggle');

  const estadoInicial = localStorage.getItem('modoOscuro') === 'true';
  if (estadoInicial) {
    document.body.classList.add('dark-mode');
    boton.classList.add('luna');
  } else {
    boton.classList.add('sol');
  }

  boton.addEventListener('click', () => {
    const activo = document.body.classList.toggle('dark-mode');
    localStorage.setItem('modoOscuro', activo);
    boton.classList.toggle('luna', activo);
    boton.classList.toggle('sol', !activo);
  });
}

// === Inicio ===
window.addEventListener('DOMContentLoaded', () => {
  cargarMateriasDesdeJSON();
  inicializarSugerenciasBot();
  inicializarModoOscuro();
});