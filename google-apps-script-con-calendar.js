/**
 * Google Apps Script para En Línea Spa - CON INTEGRACIÓN DE GOOGLE CALENDAR
 * 
 * INSTRUCCIONES:
 * 1. Sigue la guía GUIA_SINCRONIZACION_GOOGLE_CALENDAR.md
 * 2. Configura el CALENDAR_ID abajo
 * 3. Reemplaza el código actual en Google Apps Script con este
 * 4. Autoriza el script cuando se ejecute por primera vez
 */

// ============================================
// CONFIGURACIÓN - IMPORTANTE: MODIFICA ESTOS VALORES
// ============================================

// ID del calendario de Google Calendar
// Para obtenerlo: Google Calendar > Configuración del calendario > "ID de calendario"
// Formato: "abc123def456@group.calendar.google.com"
const CALENDAR_ID = 'TU_CALENDAR_ID_AQUI@group.calendar.google.com';

// Zona horaria (ejemplo para Colombia)
const TIMEZONE = 'America/Bogota';

// Duración de las citas en minutos (ajusta según tus servicios)
const DURACION_CITA_MINUTOS = 60;

// ============================================
// FUNCIONES DE GOOGLE CALENDAR
// ============================================

/**
 * Crea un evento en Google Calendar
 * @param {Object} datosCita - Datos de la cita (nombre, fecha, hora, servicio, etc.)
 * @returns {Object} - Resultado de la operación
 */
function crearEventoEnCalendar(datosCita) {
  try {
    // Obtener el calendario
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    
    if (!calendar) {
      Logger.log('Error: No se encontró el calendario con ID: ' + CALENDAR_ID);
      return { success: false, error: 'Calendario no encontrado' };
    }
    
    // Parsear fecha y hora
    const fechaStr = datosCita.fecha; // Formato: "YYYY-MM-DD"
    const horaStr = datosCita.hora;   // Formato: "HH:MM"
    
    // Crear objeto Date para la fecha y hora de inicio
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const [hora, minuto] = horaStr.split(':').map(Number);
    
    const fechaInicio = new Date(anio, mes - 1, dia, hora, minuto);
    const fechaFin = new Date(fechaInicio.getTime() + (DURACION_CITA_MINUTOS * 60 * 1000));
    
    // Crear título del evento
    const titulo = `Cita: ${datosCita.servicio} - ${datosCita.nombre}`;
    
    // Crear descripción del evento
    const descripcion = `
Cliente: ${datosCita.nombre}
Correo: ${datosCita.correo}
Celular: ${datosCita.celular}
Servicio: ${datosCita.servicio}
${datosCita.mensaje ? 'Mensaje: ' + datosCita.mensaje : ''}

Agendado desde: En Línea Spa Website
    `.trim();
    
    // Crear el evento
    const evento = calendar.createEvent(
      titulo,
      fechaInicio,
      fechaFin,
      {
        description: descripcion,
        location: 'En Línea Spa', // Puedes cambiar esto por tu dirección
        guests: datosCita.correo, // Invitar al cliente por email
        sendInvites: true // Enviar invitación por email
      }
    );
    
    // Agregar recordatorio (1 día antes)
    evento.addEmailReminder(24 * 60); // 24 horas antes en minutos
    
    // Agregar recordatorio (2 horas antes)
    evento.addPopupReminder(120); // 2 horas antes en minutos
    
    Logger.log('Evento creado exitosamente: ' + evento.getId());
    
    return {
      success: true,
      eventId: evento.getId(),
      eventUrl: evento.getHtmlLink()
    };
    
  } catch (error) {
    Logger.log('Error al crear evento en Calendar: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Obtiene eventos de Google Calendar para una fecha específica
 * @param {String} fecha - Fecha en formato "YYYY-MM-DD"
 * @returns {Array} - Array de eventos con sus horas
 */
function obtenerEventosDelCalendar(fecha) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    
    if (!calendar) {
      Logger.log('Error: No se encontró el calendario');
      return [];
    }
    
    // Parsear fecha
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const inicioDia = new Date(anio, mes - 1, dia, 0, 0, 0);
    const finDia = new Date(anio, mes - 1, dia, 23, 59, 59);
    
    // Obtener eventos del día
    const eventos = calendar.getEvents(inicioDia, finDia);
    
    // Extraer horas ocupadas
    const horasOcupadas = eventos.map(evento => {
      const horaInicio = evento.getStartTime();
      const hora = horaInicio.getHours();
      const minutos = horaInicio.getMinutes();
      return `${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    });
    
    return horasOcupadas;
    
  } catch (error) {
    Logger.log('Error al obtener eventos: ' + error.toString());
    return [];
  }
}

/**
 * Verifica si una fecha y hora específica está disponible
 * @param {String} fecha - Fecha en formato "YYYY-MM-DD"
 * @param {String} hora - Hora en formato "HH:MM"
 * @returns {Boolean} - true si está disponible, false si está ocupada
 */
function verificarDisponibilidad(fecha, hora) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    
    if (!calendar) {
      return true; // Si no hay calendario, asumir disponible
    }
    
    // Parsear fecha y hora
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [horaNum, minutoNum] = hora.split(':').map(Number);
    
    const fechaInicio = new Date(anio, mes - 1, dia, horaNum, minutoNum);
    const fechaFin = new Date(fechaInicio.getTime() + (DURACION_CITA_MINUTOS * 60 * 1000));
    
    // Verificar si hay eventos en ese rango
    const eventos = calendar.getEvents(fechaInicio, fechaFin);
    
    return eventos.length === 0;
    
  } catch (error) {
    Logger.log('Error al verificar disponibilidad: ' + error.toString());
    return true; // En caso de error, asumir disponible
  }
}

// ============================================
// FUNCIONES PRINCIPALES (doPost y doGet)
// ============================================

function doPost(e) {
  try {
    // Obtener la hoja de cálculo activa
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const data = JSON.parse(e.postData.contents);
    
    let sheet;
    let row;
    
    // Determinar qué hoja usar según el tipo
    if (data.tipo === 'agenda') {
      // Hoja de Citas
      sheet = spreadsheet.getSheetByName('Citas');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('Citas');
        // Agregar encabezados
        sheet.appendRow(['Fecha Registro', 'Nombre', 'Correo', 'Celular', 'Fecha Cita', 'Hora', 'Servicio', 'Mensaje', 'Evento Calendar ID', 'Evento Calendar URL']);
        // Formatear encabezados
        const headerRange = sheet.getRange(1, 1, 1, 10);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#B19CD9');
        headerRange.setFontColor('#FFFFFF');
      }
      
      // Validar que la cita no esté ya asignada (misma fecha y hora)
      const fechaCita = data.fecha || '';
      const horaCita = data.hora || '';
      
      if (fechaCita && horaCita) {
        // Verificar en Google Sheets
        const datos = sheet.getDataRange().getValues();
        for (let i = 1; i < datos.length; i++) {
          if (datos[i][4] === fechaCita && datos[i][5] === horaCita) {
            return ContentService.createTextOutput(JSON.stringify({
              'success': false,
              'error': 'Esta fecha y hora ya está reservada. Por favor selecciona otra fecha u hora.'
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        // Verificar en Google Calendar (si está configurado)
        if (CALENDAR_ID && CALENDAR_ID !== 'TU_CALENDAR_ID_AQUI@group.calendar.google.com') {
          const disponible = verificarDisponibilidad(fechaCita, horaCita);
          if (!disponible) {
            return ContentService.createTextOutput(JSON.stringify({
              'success': false,
              'error': 'Esta fecha y hora ya está reservada en el calendario. Por favor selecciona otra fecha u hora.'
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      // Crear evento en Google Calendar
      let eventoCalendar = { success: false };
      if (CALENDAR_ID && CALENDAR_ID !== 'TU_CALENDAR_ID_AQUI@group.calendar.google.com') {
        eventoCalendar = crearEventoEnCalendar(data);
        // Si falla la creación del evento, registrar pero continuar
        if (!eventoCalendar.success) {
          Logger.log('Advertencia: No se pudo crear el evento en Calendar, pero la cita se guardó en Sheets');
        }
      }
      
      // Preparar la fila con los datos de la cita
      row = [
        data.fechaRegistro || new Date().toLocaleString('es-ES'),
        data.nombre || '',
        data.correo || '',
        data.celular || '',
        data.fecha || '',
        data.hora || '',
        data.servicio || '',
        data.mensaje || '',
        eventoCalendar.eventId || '',
        eventoCalendar.eventUrl || ''
      ];
      
      // Agregar la fila a la hoja
      sheet.appendRow(row);
      
      // Enviar email de confirmación (opcional)
      if (data.correo) {
        try {
          const emailBody = `
            <h2>¡Cita Agendada Exitosamente!</h2>
            <p>Hola ${data.nombre},</p>
            <p>Hemos recibido tu solicitud de cita:</p>
            <ul>
              <li><strong>Fecha:</strong> ${data.fecha}</li>
              <li><strong>Hora:</strong> ${data.hora}</li>
              <li><strong>Servicio:</strong> ${data.servicio}</li>
            </ul>
            ${eventoCalendar.eventUrl ? `<p><a href="${eventoCalendar.eventUrl}">Ver evento en Google Calendar</a></p>` : ''}
            <p>Te contactaremos pronto para confirmar tu cita.</p>
            <p>¡Esperamos verte pronto!</p>
            <p>Saludos,<br>En Línea Spa</p>
          `;
          
          MailApp.sendEmail({
            to: data.correo,
            subject: 'Confirmación de Cita - En Línea Spa',
            htmlBody: emailBody
          });
        } catch (emailError) {
          Logger.log('Error al enviar email: ' + emailError.toString());
          // No fallar si el email no se envía
        }
      }
      
      // Retornar respuesta exitosa
      return ContentService.createTextOutput(JSON.stringify({
        'success': true,
        'message': 'Cita agendada correctamente',
        'calendarEvent': eventoCalendar.success ? {
          'id': eventoCalendar.eventId,
          'url': eventoCalendar.eventUrl
        } : null
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else {
      // Hoja de Registros (descuentos)
      sheet = spreadsheet.getSheetByName('Registros');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('Registros');
        // Agregar encabezados
        sheet.appendRow(['Fecha', 'Tipo', 'Nombre', 'Correo', 'Celular', 'Mensaje', 'Descuento']);
        // Formatear encabezados
        const headerRange = sheet.getRange(1, 1, 1, 7);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#90EE90');
        headerRange.setFontColor('#000000');
      }
      
      // Preparar la fila con los datos del registro
      row = [
        data.fecha || new Date().toLocaleString('es-ES'),
        data.tipo || '',
        data.nombre || '',
        data.correo || '',
        data.celular || '',
        data.mensaje || '',
        data.descuento || ''
      ];
      
      // Agregar la fila a la hoja
      sheet.appendRow(row);
      
      // Retornar respuesta exitosa
      return ContentService.createTextOutput(JSON.stringify({
        'success': true,
        'message': 'Datos guardados correctamente'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    // Retornar respuesta de error
    return ContentService.createTextOutput(JSON.stringify({
      'success': false,
      'error': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función para obtener citas reservadas (GET)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getCitas') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = spreadsheet.getSheetByName('Citas');
      
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          'success': true,
          'citas': []
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const datos = sheet.getDataRange().getValues();
      const citas = [];
      
      // Empezar desde la fila 2 (la fila 1 son encabezados)
      for (let i = 1; i < datos.length; i++) {
        if (datos[i][4] && datos[i][5]) { // Fecha y Hora
          citas.push({
            fecha: datos[i][4],
            hora: datos[i][5],
            servicio: datos[i][6] || '',
            nombre: datos[i][1] || ''
          });
        }
      }
      
      // También obtener eventos de Google Calendar si está configurado
      if (CALENDAR_ID && CALENDAR_ID !== 'TU_CALENDAR_ID_AQUI@group.calendar.google.com') {
        try {
          const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
          if (calendar) {
            // Obtener eventos de los próximos 90 días
            const ahora = new Date();
            const en90Dias = new Date();
            en90Dias.setDate(ahora.getDate() + 90);
            
            const eventos = calendar.getEvents(ahora, en90Dias);
            
            eventos.forEach(evento => {
              const fechaInicio = evento.getStartTime();
              const fecha = Utilities.formatDate(fechaInicio, TIMEZONE, 'yyyy-MM-dd');
              const hora = Utilities.formatDate(fechaInicio, TIMEZONE, 'HH:mm');
              
              // Solo agregar si no existe ya en las citas de Sheets
              const existe = citas.some(c => c.fecha === fecha && c.hora === hora);
              if (!existe) {
                citas.push({
                  fecha: fecha,
                  hora: hora,
                  servicio: evento.getTitle(),
                  nombre: 'Desde Calendar'
                });
              }
            });
          }
        } catch (calendarError) {
          Logger.log('Error al obtener eventos de Calendar: ' + calendarError.toString());
          // Continuar sin eventos de Calendar
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        'success': true,
        'citas': citas
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Respuesta por defecto
    return ContentService.createTextOutput('En Línea Spa - Google Apps Script funcionando correctamente')
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'success': false,
      'error': error.toString(),
      'citas': []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// FUNCIÓN DE PRUEBA (opcional)
// ============================================

/**
 * Función para probar la conexión con Google Calendar
 * Ejecuta esta función desde el editor de Apps Script para verificar que todo funciona
 */
function probarConexionCalendar() {
  try {
    if (CALENDAR_ID === 'TU_CALENDAR_ID_AQUI@group.calendar.google.com') {
      Logger.log('ERROR: Debes configurar el CALENDAR_ID primero');
      return;
    }
    
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    
    if (!calendar) {
      Logger.log('ERROR: No se encontró el calendario con ID: ' + CALENDAR_ID);
      return;
    }
    
    Logger.log('✓ Calendario encontrado: ' + calendar.getName());
    Logger.log('✓ Conexión exitosa con Google Calendar');
    
    // Probar obtención de eventos
    const ahora = new Date();
    const mañana = new Date();
    mañana.setDate(ahora.getDate() + 1);
    
    const eventos = calendar.getEvents(ahora, mañana);
    Logger.log('✓ Eventos encontrados para mañana: ' + eventos.length);
    
    return 'Conexión exitosa';
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    return 'Error: ' + error.toString();
  }
}

