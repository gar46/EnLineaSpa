// Configuración de Google Sheets
// IMPORTANTE: Reemplaza esta URL con la URL de tu Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwCIfpvF3Vz6Mv5wjTN3WHSM2GLlt6mOKWOizeHiiFOFzhZbQEcFhN8z5kY5lRdfQqE/exec';

// Función para enviar datos a Google Sheets
async function enviarAGoogleSheets(datos) {
    try {
        // Si no hay URL configurada, solo guardar en localStorage
        if (GOOGLE_SCRIPT_URL === 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
            return { success: true, localOnly: true };
        }
        
        // Intentar usar fetch primero para poder leer la respuesta
        try {
            const formData = new URLSearchParams();
            formData.append('data', JSON.stringify(datos));
            
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });
            
            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                const text = await response.text();
                try {
                    const result = JSON.parse(text);
                    return result;
                } catch (e) {
                    return { success: false, error: text || 'Error al procesar la solicitud' };
                }
            }
        } catch (fetchError) {
            console.log('Fetch falló, usando método alternativo:', fetchError);
            
            // Fallback: usar formulario HTML con iframe oculto
            return new Promise((resolve, reject) => {
                try {
                    // Crear iframe oculto para recibir la respuesta sin abrir nueva pestaña
                    const iframeId = 'hidden-form-iframe-' + Date.now();
                    const iframe = document.createElement('iframe');
                    iframe.id = iframeId;
                    iframe.name = iframeId;
                    iframe.style.display = 'none';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = 'none';
                    document.body.appendChild(iframe);
                    
                    // Intentar leer la respuesta del iframe después de cargar
                    iframe.onload = function() {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                            const bodyText = iframeDoc.body ? iframeDoc.body.innerText : '';
                            
                            // Intentar parsear la respuesta JSON
                            try {
                                const result = JSON.parse(bodyText);
                                if (result.success === false) {
                                    resolve(result);
                                } else {
                                    resolve({ success: true });
                                }
                            } catch (e) {
                                // Si no es JSON, asumir éxito
                                resolve({ success: true });
                            }
                        } catch (e) {
                            // Si no se puede leer el iframe (CORS), asumir éxito
                            console.log('No se pudo leer respuesta del iframe (CORS), asumiendo éxito');
                            resolve({ success: true });
                        }
                    };
                    
                    // Crear formulario oculto
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = GOOGLE_SCRIPT_URL;
                    form.style.display = 'none';
                    form.target = iframeId;
                    form.enctype = 'application/x-www-form-urlencoded';
                    
                    // Crear campo oculto con los datos
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'data';
                    input.value = JSON.stringify(datos);
                    form.appendChild(input);
                    
                    // Agregar al body
                    document.body.appendChild(form);
                    
                    // Enviar formulario
                    form.submit();
                    
                    // Timeout de seguridad
                    setTimeout(() => {
                        try {
                            if (form.parentNode) {
                                document.body.removeChild(form);
                            }
                            if (iframe.parentNode) {
                                document.body.removeChild(iframe);
                            }
                        } catch (e) {
                            // Ignorar errores al limpiar
                        }
                    }, 5000);
                } catch (error) {
                    console.error('Error al crear/enviar formulario:', error);
                    reject(error);
                }
            });
        }
    } catch (error) {
        console.error('Error al enviar datos:', error);
        return { success: false, error: error.message };
    }
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo, elemento) {
    if (!elemento) return;
    elemento.textContent = mensaje;
    elemento.className = `form-message ${tipo}`;
    elemento.style.display = 'block';
    
    // Scroll suave al mensaje
    elemento.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        elemento.style.display = 'none';
    }, 5000);
}

// Formulario de Registro
const registrationForm = document.getElementById('registrationForm');
const formMessage = document.getElementById('formMessage');

if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value.trim();
        const correo = document.getElementById('correo').value.trim();
        const celular = document.getElementById('celular').value.trim();
        
        // Validación básica
        if (!nombre || !correo || !celular) {
            mostrarMensaje('Por favor completa todos los campos', 'error', formMessage);
            return;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            mostrarMensaje('Por favor ingresa un correo electrónico válido', 'error', formMessage);
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        const submitButton = registrationForm.querySelector('.btn-promo');
        const originalText = submitButton ? submitButton.textContent : 'Obtener descuento';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
        }
        
        // Preparar datos
        const datos = {
            tipo: 'registro',
            nombre: nombre,
            correo: correo,
            celular: celular,
            fecha: new Date().toLocaleString('es-ES'),
            descuento: '10%'
        };
        
        // Enviar a Google Sheets
        const resultado = await enviarAGoogleSheets(datos);
        
        if (resultado && resultado.success !== false) {
            if (resultado.localOnly) {
                mostrarMensaje('¡Registro guardado localmente! Configura la URL de Google Apps Script para guardar en la hoja de cálculo.', 'success', formMessage);
            } else {
                mostrarMensaje('¡Registro exitoso! Te hemos enviado un correo con tu código de descuento del 10%', 'success', formMessage);
            }
            registrationForm.reset();
            
            // Guardar en localStorage como respaldo
            const registros = JSON.parse(localStorage.getItem('registros') || '[]');
            registros.push(datos);
            localStorage.setItem('registros', JSON.stringify(registros));
            
            // Cerrar modal después de 2 segundos
            setTimeout(() => {
                if (typeof cerrarModalDescuento === 'function') {
                    cerrarModalDescuento();
                }
            }, 2000);
        } else {
            mostrarMensaje('Hubo un error al procesar tu registro. Por favor intenta nuevamente.', 'error', formMessage);
        }
        
        // Restaurar botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Variables globales para el calendario
let citasReservadas = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Cargar citas reservadas
async function cargarCitasReservadas() {
    try {
        // Intentar cargar desde localStorage primero
        const citasLocal = JSON.parse(localStorage.getItem('citas') || '[]');
        citasReservadas = citasLocal;
        
        console.log('Citas cargadas desde localStorage. Total:', citasReservadas.length);
    } catch (error) {
        console.log('Error al cargar citas:', error);
        citasReservadas = [];
    }
}

// Verificar si una fecha/hora está reservada
function estaReservada(fecha, hora) {
    const fechaNormalizada = (fecha || '').toString().trim();
    const horaNormalizada = (hora || '').toString().trim();
    
    return citasReservadas.some(cita => {
        const citaFecha = (cita.fecha || '').toString().trim();
        const citaHora = (cita.hora || '').toString().trim();
        return citaFecha === fechaNormalizada && citaHora === horaNormalizada;
    });
}

// Obtener horas ocupadas para una fecha
function obtenerHorasOcupadas(fecha) {
    const fechaNormalizada = (fecha || '').toString().trim();
    
    return citasReservadas
        .filter(cita => {
            const citaFecha = (cita.fecha || '').toString().trim();
            return citaFecha === fechaNormalizada;
        })
        .map(cita => (cita.hora || '').toString().trim())
        .filter(hora => hora);
}

// Renderizar calendario
function renderizarCalendario() {
    const calendarContainer = document.getElementById('calendarContainer');
    if (!calendarContainer) return;
    
    const fechaInput = document.getElementById('agendaFecha');
    if (!fechaInput) return;
    
    const fechaStatus = document.getElementById('fechaStatus');
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    const selectedDate = fechaInput.value ? new Date(fechaInput.value) : null;
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    let html = `
        <div class="calendar-header">
            <button class="calendar-nav" onclick="cambiarMes(-1)">‹</button>
            <h4>${monthNames[currentMonth]} ${currentYear}</h4>
            <button class="calendar-nav" onclick="cambiarMes(1)">›</button>
        </div>
        <div class="calendar-grid">
    `;
    
    // Días de la semana
    weekdays.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Días del mes anterior
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        html += `<div class="calendar-day other-month">${day}</div>`;
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(currentYear, currentMonth, day);
        const isToday = dateObj.toDateString() === today.toDateString();
        const isSelected = selectedDate && dateObj.toDateString() === selectedDate.toDateString();
        const isPast = dateObj < today && !isToday;
        
        // Verificar si el día tiene todas las horas ocupadas
        const horasOcupadas = obtenerHorasOcupadas(dateStr);
        const todasHoras = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        const todasOcupadas = !isPast && todasHoras.every(hora => horasOcupadas.includes(hora));
        const tieneCitas = horasOcupadas.length > 0 && !isPast;
        
        let classes = 'calendar-day';
        if (isPast) classes += ' past';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (todasOcupadas) {
            classes += ' fully-booked';
        } else if (tieneCitas) {
            classes += ' has-appointments';
        }
        if (isPast || todasOcupadas) {
            classes += ' other-month';
        }
        
        html += `<div class="${classes}" data-date="${dateStr}" onclick="seleccionarFecha('${dateStr}')">${day}</div>`;
    }
    
    // Días del mes siguiente
    const totalCells = 42; // 6 semanas x 7 días
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month">${day}</div>`;
    }
    
    html += '</div>';
    calendarContainer.innerHTML = html;
    
    // Actualizar estado de la fecha seleccionada
    if (selectedDate) {
        validarFecha(fechaInput.value);
    }
}

// Hacer funciones globales para que funcionen desde onclick
window.cambiarMes = function(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderizarCalendario();
};

window.seleccionarFecha = function(fecha) {
    const fechaInput = document.getElementById('agendaFecha');
    const calendarContainer = document.getElementById('calendarContainer');
    
    // Validar que no sea una fecha pasada
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaObj < hoy) {
        return;
    }
    
    // Verificar si el día está completamente ocupado
    const horasOcupadas = obtenerHorasOcupadas(fecha);
    const todasHoras = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const todasOcupadas = todasHoras.every(hora => horasOcupadas.includes(hora));
    
    if (todasOcupadas) {
        const fechaStatus = document.getElementById('fechaStatus');
        if (fechaStatus) {
            fechaStatus.className = 'fecha-status warning';
            fechaStatus.textContent = '⚠️ Este día está completamente ocupado. Por favor selecciona otra fecha.';
        }
        return;
    }
    
    fechaInput.value = fecha;
    validarFecha(fecha);
    mostrarHorasDisponibles(fecha);
};

function mostrarHorasDisponibles(fecha) {
    const horasContainer = document.getElementById('horasDisponiblesContainer');
    const horasGrid = document.getElementById('horasGrid');
    const horaHiddenInput = document.getElementById('agendaHora');
    const horaStatus = document.getElementById('horaStatus');
    
    if (!horasContainer || !horasGrid || !horaHiddenInput) return;
    
    const horasOcupadas = obtenerHorasOcupadas(fecha);
    
    // Horas disponibles
    const todasHoras = [
        { value: '09:00', label: '09:00 AM' },
        { value: '10:00', label: '10:00 AM' },
        { value: '11:00', label: '11:00 AM' },
        { value: '12:00', label: '12:00 PM' },
        { value: '14:00', label: '02:00 PM' },
        { value: '15:00', label: '03:00 PM' },
        { value: '16:00', label: '04:00 PM' },
        { value: '17:00', label: '05:00 PM' },
        { value: '18:00', label: '06:00 PM' }
    ];
    
    let html = '';
    todasHoras.forEach(hora => {
        const estaOcupada = horasOcupadas.includes(hora.value);
        const horaClass = estaOcupada ? 'hora-disponible-item ocupada' : 'hora-disponible-item disponible';
        html += `
            <div class="${horaClass}" data-hora="${hora.value}" onclick="seleccionarHora('${hora.value}')">
                ${hora.label}
            </div>
        `;
    });
    
    horasGrid.innerHTML = html;
    horasContainer.style.display = 'block';
    
    // Actualizar contador de horas disponibles
    const horasDisponibles = todasHoras.length - horasOcupadas.length;
    const horasTitle = horasContainer.querySelector('.horas-title');
    if (horasTitle) {
        horasTitle.textContent = `Selecciona una hora disponible (${horasDisponibles} disponibles)`;
    }
    
    // Limpiar selección previa
    horaHiddenInput.value = '';
    if (horaStatus) {
        horaStatus.textContent = '';
        horaStatus.className = '';
    }
}

window.seleccionarHora = function(hora) {
    const horaHiddenInput = document.getElementById('agendaHora');
    const horaStatus = document.getElementById('horaStatus');
    const horaItems = document.querySelectorAll('.hora-disponible-item');
    
    // Verificar si la hora está ocupada
    const fechaInput = document.getElementById('agendaFecha');
    const fecha = fechaInput ? fechaInput.value : '';
    const horasOcupadas = obtenerHorasOcupadas(fecha);
    
    if (horasOcupadas.includes(hora)) {
        if (horaStatus) {
            horaStatus.className = 'hora-status warning';
            horaStatus.textContent = '⚠️ Esta hora ya está reservada';
        }
        return;
    }
    
    // Remover selección previa
    horaItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // Seleccionar nueva hora
    const selectedItem = document.querySelector(`[data-hora="${hora}"]`);
    if (selectedItem && !selectedItem.classList.contains('ocupada')) {
        selectedItem.classList.add('selected');
        horaHiddenInput.value = hora;
        if (horaStatus) {
            horaStatus.className = 'hora-status';
            horaStatus.textContent = '✓ Hora seleccionada';
        }
    }
}

function validarFecha(fecha) {
    const fechaStatus = document.getElementById('fechaStatus');
    if (!fechaStatus || !fecha) return;
    
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaObj < hoy) {
        fechaStatus.className = 'fecha-status warning';
        fechaStatus.textContent = '⚠️ Por favor selecciona una fecha futura';
        return;
    }
    
    const horasOcupadas = obtenerHorasOcupadas(fecha);
    if (horasOcupadas.length > 0) {
        fechaStatus.className = 'fecha-status warning';
        fechaStatus.textContent = `ℹ️ Este día tiene ${horasOcupadas.length} hora(s) ocupada(s). Selecciona una hora disponible.`;
    } else {
        fechaStatus.className = 'fecha-status';
        fechaStatus.textContent = '✓ Fecha disponible';
    }
}

// Formulario de Agenda
const agendaForm = document.getElementById('agendaForm');
const agendaMessage = document.getElementById('agendaMessage');

if (agendaForm) {
    // Cargar citas reservadas al iniciar
    cargarCitasReservadas().then(() => {
        renderizarCalendario();
    });
    
    // Configurar fecha mínima como hoy
    const fechaInput = document.getElementById('agendaFecha');
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
        
        // Mostrar calendario al hacer clic
        fechaInput.addEventListener('focus', () => {
            const calendarContainer = document.getElementById('calendarContainer');
            if (calendarContainer) {
                calendarContainer.style.display = 'block';
            }
        });
        
        // Validar cuando cambia la fecha
        fechaInput.addEventListener('change', (e) => {
            if (e.target.value) {
                validarFecha(e.target.value);
                mostrarHorasDisponibles(e.target.value);
            } else {
                const horasContainer = document.getElementById('horasDisponiblesContainer');
                if (horasContainer) {
                    horasContainer.style.display = 'none';
                }
            }
        });
    }

    agendaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('agendaNombre').value.trim();
        const correo = document.getElementById('agendaCorreo').value.trim();
        const celular = document.getElementById('agendaCelular').value.trim();
        const fecha = document.getElementById('agendaFecha').value;
        const hora = document.getElementById('agendaHora').value;
        const servicio = document.getElementById('agendaServicio').value;
        const mensaje = document.getElementById('agendaMensaje').value.trim();
        
        // Validación
        if (!nombre || !correo || !celular || !fecha || !hora || !servicio) {
            mostrarMensaje('Por favor completa todos los campos obligatorios', 'error', agendaMessage);
            return;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            mostrarMensaje('Por favor ingresa un correo electrónico válido', 'error', agendaMessage);
            return;
        }
        
        // Validar fecha (no puede ser en el pasado)
        const fechaSeleccionada = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaSeleccionada < hoy) {
            mostrarMensaje('Por favor selecciona una fecha válida', 'error', agendaMessage);
            return;
        }
        
        // Validar que la cita no esté ya asignada (misma fecha y hora)
        const fechaNormalizada = fecha.trim();
        const horaNormalizada = hora.trim();
        
        if (estaReservada(fechaNormalizada, horaNormalizada)) {
            mostrarMensaje('⚠️ Lo sentimos, esta fecha y hora ya está reservada. Por favor selecciona otra fecha u hora.', 'error', agendaMessage);
            return;
        }
        
        // Validación adicional: verificar todas las citas en localStorage
        const todasLasCitas = JSON.parse(localStorage.getItem('citas') || '[]');
        const citaDuplicada = todasLasCitas.some(cita => {
            const citaFecha = (cita.fecha || '').toString().trim();
            const citaHora = (cita.hora || '').toString().trim();
            return citaFecha === fechaNormalizada && citaHora === horaNormalizada;
        });
        
        if (citaDuplicada) {
            mostrarMensaje('⚠️ Lo sentimos, esta fecha y hora ya está reservada. Por favor selecciona otra fecha u hora.', 'error', agendaMessage);
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        const submitButton = agendaForm.querySelector('.btn-agenda');
        const originalText = submitButton ? submitButton.textContent : 'Agendar Cita';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
        }
        
        // Preparar datos
        const datos = {
            tipo: 'agenda',
            nombre: nombre,
            correo: correo,
            celular: celular,
            fecha: fechaNormalizada,
            hora: horaNormalizada,
            servicio: servicio,
            mensaje: mensaje,
            fechaRegistro: new Date().toLocaleString('es-ES')
        };
        
        // Enviar a Google Sheets
        const resultado = await enviarAGoogleSheets(datos);
        
        if (resultado && resultado.success !== false) {
            if (resultado.localOnly) {
                mostrarMensaje('¡Cita guardada localmente! Configura la URL de Google Apps Script para guardar en la hoja de cálculo.', 'success', agendaMessage);
            } else {
                mostrarMensaje('¡Cita agendada exitosamente! Te hemos enviado un correo de confirmación.', 'success', agendaMessage);
            }
            
            // Guardar en localStorage
            todasLasCitas.push(datos);
            localStorage.setItem('citas', JSON.stringify(todasLasCitas));
            
            // Actualizar citas reservadas
            citasReservadas.push(datos);
            
            // Limpiar formulario
            agendaForm.reset();
            
            // Actualizar calendario y horas
            renderizarCalendario();
            const horasContainer = document.getElementById('horasDisponiblesContainer');
            if (horasContainer) {
                horasContainer.style.display = 'none';
            }
            
            // Cerrar modal después de 2 segundos
            setTimeout(() => {
                if (typeof cerrarModalAgenda === 'function') {
                    cerrarModalAgenda();
                }
            }, 2000);
        } else {
            const errorMsg = resultado && resultado.error ? resultado.error : 'Hubo un error al procesar tu cita. Por favor intenta nuevamente.';
            mostrarMensaje(errorMsg, 'error', agendaMessage);
        }
        
        // Restaurar botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Prevenir envío múltiple de formularios
let isSubmitting = false;

document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        if (isSubmitting) {
            e.preventDefault();
            return false;
        }
        isSubmitting = true;
        setTimeout(() => {
            isSubmitting = false;
        }, 3000);
    });
});

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
