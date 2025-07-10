function actualizarEstados() {
  const materias = document.querySelectorAll(".materia");

  // Mapear estado de materias
  const estadoPorCodigo = {};
  materias.forEach(m => {
    const codigo = m.dataset.codigo;
    const estado = m.querySelector(".estado-select").value;
    estadoPorCodigo[codigo] = estado;
  });

  materias.forEach(m => {
    const estadoSelect = m.querySelector(".estado-select");
    const estado = estadoSelect.value;
    m.classList.remove("en-curso", "aprobada", "cursada" , "promocionada", "bloqueada");

    if (estado !== "ninguno") {
      m.classList.add(estado);
    }

    // Comprobar si cumple correlativas
    const correlativas = JSON.parse(m.dataset.correlativas || "[]");
    let cumple = correlativas.every(c => 
      estadoPorCodigo[c] === "aprobada" || estadoPorCodigo[c] === "promocionada"
    );

    if (!cumple && correlativas.length > 0 && estado === "ninguno") {
      m.classList.add("bloqueada");
    }

    // Pintar correlativas
    const corList = m.querySelector(".correlativas-list");
    if (correlativas.length > 0) {
      corList.innerHTML = correlativas.map(c => {
        const estadoCor = estadoPorCodigo[c] || "ninguno";
        return `<span class="cor ${estadoCor}">${c}</span>`;
      }).join(", ");
    }
  });
}

function resaltarMateriasDisponibles() {
  const materias = Array.from(document.querySelectorAll('.materia'));
  const estados = {};
  materias.forEach(m => {
    const nombre = m.getAttribute('data-nombre');
    const select = m.querySelector('.estado-select');
    estados[nombre] = select ? select.value : 'ninguno';
  });
  materias.forEach(m => {
    m.classList.remove('disponible-cursar', 'disponible-final', 'bloqueada');
    const aprobadas = JSON.parse(m.getAttribute('data-correlativas-para-cursar-aprobadas') || '[]');
    const cursadas = JSON.parse(m.getAttribute('data-correlativas-para-cursar-cursadas') || '[]');
    const finales = JSON.parse(m.getAttribute('data-correlativas-para-final') || '[]');
    const estadoActual = estados[m.getAttribute('data-nombre')];
    const puedeCursar =
      aprobadas.every(n => estados[n] === 'aprobada' || estados[n] === 'promocionada') &&
      cursadas.every(n => estados[n] === 'cursada' || estados[n] === 'aprobada' || estados[n] === 'promocionada');
    const puedeFinal = finales.every(n => estados[n] === 'aprobada' || estados[n] === 'promocionada');
    if (estadoActual === 'aprobada' || estadoActual === 'promocionada') return;
    if (puedeFinal && finales.length > 0) {
      m.classList.add('disponible-final');
    } else if (puedeCursar && (aprobadas.length > 0 || cursadas.length > 0)) {
      m.classList.add('disponible-cursar');
    } else if ((aprobadas.length > 0 || cursadas.length > 0 || finales.length > 0)) {
      // Solo bloqueada si NO puede cursar NI rendir final
      if (!puedeCursar && !puedeFinal) {
        m.classList.add('bloqueada');
      }
    }
  });
}

function actualizarColoresCorrelativasBloqueadas() {
  const materias = Array.from(document.querySelectorAll('.materia'));
  const estados = {};
  materias.forEach(m => {
    const nombre = m.getAttribute('data-nombre');
    const select = m.querySelector('.estado-select');
    estados[nombre] = select ? select.value : 'ninguno';
  });
  materias.forEach(m => {
    if (!m.classList.contains('bloqueada')) {
      // Siempre pinta correlativas cumplidas en verde y bold, aunque no se haya tocado el select
      const aprobadas = JSON.parse(m.getAttribute('data-correlativas-para-cursar-aprobadas') || '[]');
      const aprobadasSpan = m.querySelector('.correlativas-aprobadas');
      if (aprobadasSpan) {
        aprobadasSpan.innerHTML = aprobadas.map(n => {
          const tiene = estados[n] === 'aprobada' || estados[n] === 'promocionada';
          return tiene ? `<b style="color:green">${n}</b>` : n;
        }).join(', ') || '—';
      }
      const cursadas = JSON.parse(m.getAttribute('data-correlativas-para-cursar-cursadas') || '[]');
      const cursadasSpan = m.querySelector('.correlativas-cursadas');
      if (cursadasSpan) {
        cursadasSpan.innerHTML = cursadas.map(n => {
          const tiene = estados[n] === 'cursada' || estados[n] === 'aprobada' || estados[n] === 'promocionada';
          return tiene ? `<b style="color:green">${n}</b>` : n;
        }).join(', ') || '—';
      }
      const finales = JSON.parse(m.getAttribute('data-correlativas-para-final') || '[]');
      const finalesSpan = m.querySelector('.correlativas-aprobadas-final');
      if (finalesSpan) {
        finalesSpan.innerHTML = finales.map(n => {
          const tiene = estados[n] === 'aprobada' || estados[n] === 'promocionada';
          return tiene ? `<b style="color:green">${n}</b>` : n;
        }).join(', ') || '—';
      }
    } else {
      // También pinta en bloqueadas
      const aprobadas = JSON.parse(m.getAttribute('data-correlativas-para-cursar-aprobadas') || '[]');
      const aprobadasSpan = m.querySelector('.correlativas-aprobadas');
      if (aprobadasSpan) {
        aprobadasSpan.innerHTML = aprobadas.map(n => {
          const tiene = estados[n] === 'aprobada' || estados[n] === 'promocionada';
          return tiene ? `<b style="color:green">${n}</b>` : n;
        }).join(', ') || '—';
      }
      const cursadas = JSON.parse(m.getAttribute('data-correlativas-para-cursar-cursadas') || '[]');
      const cursadasSpan = m.querySelector('.correlativas-cursadas');
      if (cursadasSpan) {
        cursadasSpan.innerHTML = cursadas.map(n => {
          const tiene = estados[n] === 'cursada' || estados[n] === 'aprobada' || estados[n] === 'promocionada';
          return tiene ? `<b style="color:green">${n}</b>` : n;
        }).join(', ') || '—';
      }
      const finales = JSON.parse(m.getAttribute('data-correlativas-para-final') || '[]');
      const finalesSpan = m.querySelector('.correlativas-aprobadas-final');
      if (finalesSpan) {
        finalesSpan.innerHTML = finales.map(n => {
          const tiene = estados[n] === 'aprobada' || estados[n] === 'promocionada';
          return tiene ? `<b style="color:green">${n}</b>` : n;
        }).join(', ') || '—';
      }
    }
  });
}

// Unificar listeners y llamadas para evitar duplicados
function actualizarResaltadoYColores() {
  resaltarMateriasDisponibles();
  actualizarColoresCorrelativasBloqueadas();
}

window.addEventListener('DOMContentLoaded', () => {
  actualizarResaltadoYColores();
  document.querySelectorAll('.estado-select').forEach(sel => {
    sel.addEventListener('change', actualizarResaltadoYColores);
  });
});

// Al cargar la página, restaura los estados guardados
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.materia').forEach(function(materia, idx) {
    const nombre = materia.getAttribute('data-nombre') || idx;
    const select = materia.querySelector('.estado-select');
    const guardado = localStorage.getItem('estado-' + nombre);
    if (guardado && select) {
      select.value = guardado;
      select.className = 'estado-select ' + guardado;
      materia.classList.remove('en-curso', 'aprobada', 'cursada' , 'promocionada', 'bloqueada');
      if (guardado !== 'ninguno') materia.classList.add(guardado);
    }
    // Actualiza la clase visual al cargar
    select && select.addEventListener('change', function() {
      localStorage.setItem('estado-' + nombre, select.value);
      materia.classList.remove('en-curso', 'aprobada', 'cursada' , 'promocionada', 'bloqueada');
      select.className = 'estado-select ' + select.value; // <-- actualiza la clase del select
      if (select.value !== 'ninguno') materia.classList.add(select.value);
    });
  });
});

// Llama a la función cada vez que cambia un estado
const selects = document.querySelectorAll('.estado-select');
selects.forEach(sel => sel.addEventListener('change', () => {
  resaltarMateriasDisponibles();
  actualizarColoresCorrelativasBloqueadas();
}));
window.addEventListener('DOMContentLoaded', () => {
  resaltarMateriasDisponibles();
  actualizarColoresCorrelativasBloqueadas();
});