// Configuración de Google Sheets
// IMPORTANTE: Reemplaza esta URL con la URL de tu Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwCIfpvF3Vz6Mv5wjTN3WHSM2GLlt6mOKWOizeHiiFOFzhZbQEcFhN8z5kY5lRdfQqE/exec';

// Modal Flotante de Descuento
const descuentoModal = document.getElementById('descuentoModal');
const closeModal = document.getElementById('closeModal');
const skipForm = document.getElementById('skipForm');

// Verificar si el usuario ya cerró el modal en esta sesión
const modalCerrado = sessionStorage.getItem('descuentoModalCerrado');

// Mostrar modal automáticamente al cargar la página (si no se ha cerrado)
if (!modalCerrado && descuentoModal) {
    // Pequeño delay para mejor experiencia
    setTimeout(() => {
        descuentoModal.classList.add('active');
        // Prevenir scroll del body cuando el modal está abierto
        document.body.style.overflow = 'hidden';
    }, 500);
}

// Función para cerrar el modal
function cerrarModal() {
    if (descuentoModal) {
        descuentoModal.classList.remove('active');
        document.body.style.overflow = '';
        // Guardar en sessionStorage que el usuario cerró el modal
        sessionStorage.setItem('descuentoModalCerrado', 'true');
    }
}

// Cerrar modal con el botón X
if (closeModal) {
    closeModal.addEventListener('click', cerrarModal);
}

// Cerrar modal con el botón "Quizás más tarde"
if (skipForm) {
    skipForm.addEventListener('click', cerrarModal);
}

// Cerrar modal al hacer clic fuera del contenido
if (descuentoModal) {
    descuentoModal.addEventListener('click', (e) => {
        if (e.target === descuentoModal) {
            cerrarModal();
        }
    });
}

// Cerrar modal con la tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && descuentoModal && descuentoModal.classList.contains('active')) {
        cerrarModal();
    }
});

// Menú móvil
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Cerrar menú al hacer clic en un enlace
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Función para enviar datos a Google Sheets
async function enviarAGoogleSheets(datos) {
    try {
        // Si no hay URL configurada, solo guardar en localStorage
        if (GOOGLE_SCRIPT_URL === 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
            return { success: true, localOnly: true };
        }
        
        // Google Apps Script tiene problemas con CORS, usar formulario HTML con iframe oculto
        console.log('Iniciando envío de datos mediante formulario HTML...');
        console.log('URL:', GOOGLE_SCRIPT_URL);
        console.log('Datos:', datos);
        
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
                
                // Crear formulario oculto
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = GOOGLE_SCRIPT_URL;
                form.style.display = 'none';
                form.target = iframeId; // Enviar al iframe oculto, no a nueva pestaña
                form.enctype = 'application/x-www-form-urlencoded';
                
                // Crear campo oculto con los datos
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'data';
                input.value = JSON.stringify(datos);
                form.appendChild(input);
                
                // Agregar al body
                document.body.appendChild(form);
                
                console.log('Formulario creado y agregado al DOM');
                
                // Limpiar iframe y formulario después de enviar
                const cleanup = () => {
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
                    }, 3000);
                };
                
                // Enviar formulario
                form.submit();
                
                console.log('Formulario enviado exitosamente');
                
                // Limpiar después de un momento
                cleanup();
                
                // Asumir éxito ya que no podemos leer la respuesta con este método
                resolve({ success: true });
            } catch (error) {
                console.error('Error al crear/enviar formulario:', error);
                reject(error);
            }
        });
    } catch (error) {
        console.error('Error al enviar datos:', error);
        return { success: false, error: error.message };
    }
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
        const submitButton = registrationForm.querySelector('.btn-submit');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        
        // Preparar datos
        const datos = {
            tipo: 'registro',
            nombre: nombre,
            correo: correo,
            celular: celular,
            fecha: new Date().toLocaleString('es-ES'),
            descuento: '20%'
        };
        
        // Enviar a Google Sheets
        const resultado = await enviarAGoogleSheets(datos);
        
        if (resultado && resultado.success !== false) {
            if (resultado.localOnly) {
                mostrarMensaje('¡Registro guardado localmente! Configura la URL de Google Apps Script para guardar en la hoja de cálculo.', 'success', formMessage);
            } else {
                mostrarMensaje('¡Registro exitoso! Te hemos enviado un correo con tu código de descuento del 20%', 'success', formMessage);
            }
            registrationForm.reset();
            
            // Guardar en localStorage como respaldo
            const registros = JSON.parse(localStorage.getItem('registros') || '[]');
            registros.push(datos);
            localStorage.setItem('registros', JSON.stringify(registros));
            
            // Cerrar el modal después de 2 segundos si el registro fue exitoso
            setTimeout(() => {
                cerrarModal();
            }, 2000);
        } else {
            mostrarMensaje('Hubo un error al procesar tu registro. Por favor intenta nuevamente.', 'error', formMessage);
        }
        
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.textContent = originalText;
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
        
        // Nota: No podemos cargar citas desde el servidor debido a CORS
        // Las citas se guardan en localStorage y se sincronizan cuando se agregan nuevas
        // Para ver todas las citas, revisa directamente en Google Sheets
        console.log('Citas cargadas desde localStorage. Total:', citasReservadas.length);
    } catch (error) {
        console.log('Error al cargar citas:', error);
        citasReservadas = [];
    }
}

// Verificar si una fecha/hora está reservada
function estaReservada(fecha, hora) {
    return citasReservadas.some(cita => {
        return cita.fecha === fecha && cita.hora === hora;
    });
}

// Obtener horas ocupadas para una fecha
function obtenerHorasOcupadas(fecha) {
    return citasReservadas
        .filter(cita => cita.fecha === fecha)
        .map(cita => cita.hora);
}

// Crear calendario visual
function crearCalendario() {
    const calendarContainer = document.getElementById('calendarContainer');
    if (!calendarContainer) return;
    
    const fechaInput = document.getElementById('agendaFecha');
    if (!fechaInput) return;
    
    // Mostrar/ocultar calendario al hacer clic en el input
    fechaInput.addEventListener('focus', () => {
        calendarContainer.classList.add('active');
    });
    
    // Cerrar calendario al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!calendarContainer.contains(e.target) && e.target !== fechaInput) {
            calendarContainer.classList.remove('active');
        }
    });
    
    renderizarCalendario();
}

function renderizarCalendario() {
    const calendarContainer = document.getElementById('calendarContainer');
    if (!calendarContainer) return;
    
    const fechaInput = document.getElementById('agendaFecha');
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
            <button class="calendar-nav-btn" onclick="cambiarMes(-1)">‹</button>
            <div class="calendar-month-year">${monthNames[currentMonth]} ${currentYear}</div>
            <button class="calendar-nav-btn" onclick="cambiarMes(1)">›</button>
        </div>
        <div class="calendar-weekdays">
            ${weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join('')}
        </div>
        <div class="calendar-days">
    `;
    
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
        const tieneCitas = citasReservadas.some(cita => cita.fecha === dateStr);
        
        let classes = 'calendar-day';
        if (isPast) classes += ' disabled';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (tieneCitas && !isPast) classes += ' has-appointments';
        
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
    
    fechaInput.value = fecha;
    validarFecha(fecha);
    mostrarHorasDisponibles(fecha);
    
    // Cerrar calendario después de seleccionar
    setTimeout(() => {
        calendarContainer.classList.remove('active');
    }, 300);
}

function mostrarHorasDisponibles(fecha) {
    const horasContainer = document.getElementById('horasDisponiblesContainer');
    const horasGrid = document.getElementById('horasGrid');
    const horaHiddenInput = document.getElementById('agendaHora');
    const horaStatus = document.getElementById('horaStatus');
    
    if (!horasContainer || !horasGrid) return;
    
    // Obtener horas ocupadas para esta fecha
    const horasOcupadas = obtenerHorasOcupadas(fecha);
    
    // Todas las horas disponibles
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
    
    // Generar HTML para el grid de horas
    let html = '';
    todasHoras.forEach(hora => {
        const estaOcupada = horasOcupadas.includes(hora.value);
        const horaClass = estaOcupada ? 'hora-disponible-item ocupada' : 'hora-disponible-item disponible';
        html += `
            <div class="${horaClass}" data-hora="${hora.value}" ${estaOcupada ? '' : `onclick="seleccionarHoraVisual('${hora.value}')"`}>
                <span class="hora-icon">${estaOcupada ? '✕' : '🕐'}</span>
                <span class="hora-text">${hora.label}</span>
                ${estaOcupada ? '<span class="hora-badge-ocupada">Ocupada</span>' : '<span class="hora-badge-disponible">Disponible</span>'}
            </div>
        `;
    });
    
    horasGrid.innerHTML = html;
    horasContainer.style.display = 'block';
    
    // Resetear hora seleccionada
    if (horaHiddenInput) {
        horaHiddenInput.value = '';
    }
    if (horaStatus) {
        horaStatus.className = 'hora-status';
        horaStatus.textContent = '';
    }
    
    // Actualizar contador
    const horasDisponibles = todasHoras.length - horasOcupadas.length;
    const horasTitle = horasContainer.querySelector('.horas-title');
    if (horasTitle) {
        if (horasOcupadas.length > 0) {
            horasTitle.textContent = `${horasDisponibles} hora(s) disponible(s) - ${horasOcupadas.length} ocupada(s)`;
        } else {
            horasTitle.textContent = 'Todas las horas están disponibles';
        }
    }
}

window.seleccionarHoraVisual = function(hora) {
    const horaHiddenInput = document.getElementById('agendaHora');
    const horaStatus = document.getElementById('horaStatus');
    const horaItems = document.querySelectorAll('.hora-disponible-item');
    
    // Remover selección previa
    horaItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // Marcar como seleccionada
    const selectedItem = document.querySelector(`[data-hora="${hora}"]`);
    if (selectedItem && !selectedItem.classList.contains('ocupada')) {
        selectedItem.classList.add('selected');
        if (horaHiddenInput) {
            horaHiddenInput.value = hora;
        }
        if (horaStatus) {
            horaStatus.className = 'hora-status available';
            horaStatus.textContent = '✓ Hora seleccionada correctamente';
        }
    }
}

function validarFecha(fecha) {
    const fechaStatus = document.getElementById('fechaStatus');
    if (!fechaStatus || !fecha) return;
    
    fechaStatus.className = 'fecha-status checking';
    fechaStatus.textContent = 'Verificando disponibilidad...';
    
    setTimeout(() => {
        const horasOcupadas = obtenerHorasOcupadas(fecha);
        if (horasOcupadas.length > 0) {
            fechaStatus.className = 'fecha-status unavailable';
            fechaStatus.textContent = `⚠️ ${horasOcupadas.length} hora(s) ya reservada(s) en esta fecha`;
        } else {
            fechaStatus.className = 'fecha-status available';
            fechaStatus.textContent = '✓ Fecha disponible';
        }
    }, 500);
}

function actualizarHorasDisponibles(fecha) {
    const horaSelect = document.getElementById('agendaHora');
    const horaStatus = document.getElementById('horaStatus');
    if (!horaSelect || !fecha) return;
    
    const horasOcupadas = obtenerHorasOcupadas(fecha);
    
    // Actualizar opciones del select
    Array.from(horaSelect.options).forEach(option => {
        if (option.value && horasOcupadas.includes(option.value)) {
            option.disabled = true;
            option.textContent = option.textContent.replace(' (Ocupada)', '') + ' (Ocupada)';
        } else if (option.value) {
            option.disabled = false;
            const horaBase = option.value;
            const horaTexto = horaBase === '09:00' ? '09:00 AM' :
                            horaBase === '10:00' ? '10:00 AM' :
                            horaBase === '11:00' ? '11:00 AM' :
                            horaBase === '12:00' ? '12:00 PM' :
                            horaBase === '14:00' ? '02:00 PM' :
                            horaBase === '15:00' ? '03:00 PM' :
                            horaBase === '16:00' ? '04:00 PM' :
                            horaBase === '17:00' ? '05:00 PM' :
                            horaBase === '18:00' ? '06:00 PM' : option.textContent.replace(' (Ocupada)', '');
            option.textContent = horaTexto;
        }
    });
    
    // Validar hora seleccionada
    if (horaSelect.value && horasOcupadas.includes(horaSelect.value)) {
        horaSelect.value = '';
        if (horaStatus) {
            horaStatus.className = 'hora-status unavailable';
            horaStatus.textContent = '⚠️ Esta hora ya está reservada';
        }
    } else if (horaSelect.value && horaStatus) {
        horaStatus.className = 'hora-status available';
        horaStatus.textContent = '✓ Hora disponible';
    } else if (horaStatus) {
        horaStatus.className = '';
        horaStatus.textContent = '';
    }
}

// Formulario de Agenda
const agendaForm = document.getElementById('agendaForm');
const agendaMessage = document.getElementById('agendaMessage');

if (agendaForm) {
    // Cargar citas reservadas al iniciar
    cargarCitasReservadas().then(() => {
        crearCalendario();
    });
    
    // Configurar fecha mínima como hoy
    const fechaInput = document.getElementById('agendaFecha');
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
        
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
        if (estaReservada(fecha, hora)) {
            mostrarMensaje('Lo sentimos, esta fecha y hora ya está reservada. Por favor selecciona otra fecha u hora.', 'error', agendaMessage);
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        const submitButton = agendaForm.querySelector('.btn-submit');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Agendando...';
        
        // Preparar datos
        const datos = {
            tipo: 'agenda',
            nombre: nombre,
            correo: correo,
            celular: celular,
            fecha: fecha,
            hora: hora,
            servicio: servicio,
            mensaje: mensaje || '',
            fechaRegistro: new Date().toLocaleString('es-ES')
        };
        
        // Enviar a Google Sheets
        try {
            const respuesta = await enviarAGoogleSheets(datos);
            
            if (respuesta && respuesta.success !== false) {
                mostrarMensaje('¡Cita agendada exitosamente! Te contactaremos pronto para confirmar tu cita.', 'success', agendaMessage);
                
                // Guardar en localStorage como respaldo y actualizar citas reservadas
                citasReservadas.push({
                    fecha: datos.fecha,
                    hora: datos.hora,
                    servicio: datos.servicio,
                    nombre: datos.nombre
                });
                localStorage.setItem('citas', JSON.stringify(citasReservadas));
                
                // Actualizar calendario y mostrar horas actualizadas
                renderizarCalendario();
                if (datos.fecha) {
                    mostrarHorasDisponibles(datos.fecha);
                }
                
                // Resetear formulario después de un delay
                setTimeout(() => {
                    agendaForm.reset();
                    const horasContainer = document.getElementById('horasDisponiblesContainer');
                    if (horasContainer) {
                        horasContainer.style.display = 'none';
                    }
                    const fechaStatus = document.getElementById('fechaStatus');
                    const horaStatus = document.getElementById('horaStatus');
                    if (fechaStatus) fechaStatus.textContent = '';
                    if (horaStatus) horaStatus.textContent = '';
                }, 2000);
            } else {
                const mensajeError = respuesta && respuesta.error ? respuesta.error : 'Hubo un error al agendar tu cita. Por favor intenta nuevamente o contáctanos directamente.';
                mostrarMensaje(mensajeError, 'error', agendaMessage);
            }
        } catch (error) {
            mostrarMensaje('Hubo un error al agendar tu cita. Por favor intenta nuevamente o contáctanos directamente.', 'error', agendaMessage);
        }
        
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    });
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo, elemento) {
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

// Smooth scroll para navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Animación al hacer scroll
// Observer original se actualiza en el DOMContentLoaded siguiente

// Hero Slider de Videos
document.addEventListener('DOMContentLoaded', () => {
    const heroSliderTrack = document.getElementById('heroSliderTrack');
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroSliderPrev = document.getElementById('heroSliderPrev');
    const heroSliderNext = document.getElementById('heroSliderNext');
    const heroSliderDots = document.getElementById('heroSliderDots');
    const currentSlideSpan = document.getElementById('currentSlide');
    const totalSlidesSpan = document.getElementById('totalSlides');
    const heroVideos = document.querySelectorAll('.hero-video');
    
    if (!heroSliderTrack || !heroSlides.length) return;
    
    let currentHeroSlide = 0;
    const totalHeroSlides = heroSlides.length;
    let heroAutoPlayInterval;
    
    // Establecer total de slides
    if (totalSlidesSpan) {
        totalSlidesSpan.textContent = totalHeroSlides;
    }
    
    // Obtener duración de los videos
    heroVideos.forEach((video, index) => {
        video.addEventListener('loadedmetadata', () => {
            const duration = video.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            const durationElement = document.getElementById(`duration${index + 1}`);
            if (durationElement) {
                durationElement.textContent = durationText;
            }
        });
        
        video.load();
    });
    
    // Crear dots
    heroSlides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'hero-slider-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToHeroSlide(index));
        if (heroSliderDots) {
            heroSliderDots.appendChild(dot);
        }
    });
    
    // Función para ir a un slide específico
    function goToHeroSlide(index) {
        currentHeroSlide = index;
        heroSliderTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
        
        // Actualizar slides activos
        heroSlides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentHeroSlide);
        });
        
        // Actualizar dots
        document.querySelectorAll('.hero-slider-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentHeroSlide);
        });
        
        // Actualizar indicador
        if (currentSlideSpan) {
            currentSlideSpan.textContent = currentHeroSlide + 1;
        }
        
        // Reproducir video del slide activo y pausar los demás
        heroVideos.forEach((video, i) => {
            if (i === currentHeroSlide - 1) { // -1 porque el primer slide es el banner
                video.play().catch(e => console.log('Error al reproducir video:', e));
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    }
    
    // Botón siguiente
    if (heroSliderNext) {
        heroSliderNext.addEventListener('click', () => {
            currentHeroSlide = (currentHeroSlide + 1) % totalHeroSlides;
            goToHeroSlide(currentHeroSlide);
            resetAutoPlay();
        });
    }
    
    // Botón anterior
    if (heroSliderPrev) {
        heroSliderPrev.addEventListener('click', () => {
            currentHeroSlide = (currentHeroSlide - 1 + totalHeroSlides) % totalHeroSlides;
            goToHeroSlide(currentHeroSlide);
            resetAutoPlay();
        });
    }
    
    // Auto-play del slider
    function startAutoPlay() {
        heroAutoPlayInterval = setInterval(() => {
            currentHeroSlide = (currentHeroSlide + 1) % totalHeroSlides;
            goToHeroSlide(currentHeroSlide);
        }, 6000); // Cambia cada 6 segundos
    }
    
    function stopAutoPlay() {
        if (heroAutoPlayInterval) {
            clearInterval(heroAutoPlayInterval);
        }
    }
    
    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }
    
    // Pausar auto-play al hacer hover
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
        heroSlider.addEventListener('mouseenter', stopAutoPlay);
        heroSlider.addEventListener('mouseleave', startAutoPlay);
    }
    
    // Iniciar auto-play
    startAutoPlay();
    
    // Touch/swipe para móviles
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (heroSliderTrack) {
        heroSliderTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        heroSliderTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleHeroSwipe();
        });
    }
    
    function handleHeroSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe izquierda - siguiente
            currentHeroSlide = (currentHeroSlide + 1) % totalHeroSlides;
            goToHeroSlide(currentHeroSlide);
            resetAutoPlay();
        }
        if (touchEndX > touchStartX + 50) {
            // Swipe derecha - anterior
            currentHeroSlide = (currentHeroSlide - 1 + totalHeroSlides) % totalHeroSlides;
            goToHeroSlide(currentHeroSlide);
            resetAutoPlay();
        }
    }
    
    // Inicializar primer slide
    goToHeroSlide(0);
});

// Observar elementos para animación de scroll reveal (izquierda a derecha)
const scrollRevealOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const scrollRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Agregar clase para animar
            entry.target.classList.add('scroll-reveal');
            // Opcional: dejar de observar después de animar para mejor rendimiento
            scrollRevealObserver.unobserve(entry.target);
        }
    });
}, scrollRevealOptions);

// Observar elementos para animación de scroll reveal
document.addEventListener('DOMContentLoaded', () => {
    // Observar media-items (videos con animación izquierda/derecha)
    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach((el, index) => {
        // Agregar delay escalonado para efecto secuencial
        el.style.transitionDelay = `${(index % 3) * 0.2}s`;
        scrollRevealObserver.observe(el);
    });
    
    // Observar media-cards (videos en grid)
    const mediaCards = document.querySelectorAll('.media-card');
    mediaCards.forEach((el, index) => {
        // Delay escalonado para cards
        el.style.transitionDelay = `${(index % 4) * 0.15}s`;
        scrollRevealObserver.observe(el);
    });
    
    // Observar otros elementos (agenda, contacto) sin efecto izquierda-derecha
    const otherElements = document.querySelectorAll('.agenda-form-container, .contacto-item');
    const otherObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                otherObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    otherElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        otherObserver.observe(el);
    });
});

// Efecto parallax suave en hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Lazy loading para videos
const videos = document.querySelectorAll('video[data-src]');
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const video = entry.target;
            video.src = video.dataset.src;
            video.load();
            videoObserver.unobserve(video);
        }
    });
}, { rootMargin: '50px' });

videos.forEach(video => {
    videoObserver.observe(video);
});

// Auto-reproducir videos cuando aparecen en el viewport al hacer scroll
document.addEventListener('DOMContentLoaded', () => {
    // Seleccionar todos los videos en las secciones de tratamientos (excluyendo el hero slider)
    const treatmentVideos = document.querySelectorAll('.media-item video.media-video, .media-card video.media-video');
    
    // Configuración del observer para auto-reproducción
    const autoPlayOptions = {
        threshold: 0.5, // Reproducir cuando el 50% del video es visible
        rootMargin: '0px'
    };
    
    const autoPlayObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            
            if (entry.isIntersecting) {
                // Reproducir el video cuando entra en el viewport
                video.play().catch(error => {
                    // Si falla la reproducción automática (políticas del navegador), no hacer nada
                    console.log('No se pudo reproducir automáticamente:', error);
                });
            } else {
                // Pausar el video cuando sale del viewport para ahorrar recursos
                video.pause();
            }
        });
    }, autoPlayOptions);
    
    // Observar todos los videos de tratamientos
    treatmentVideos.forEach(video => {
        // Asegurarse de que el video tenga los atributos necesarios
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', ''); // Muteado para permitir auto-play en más navegadores
        autoPlayObserver.observe(video);
    });
});

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

