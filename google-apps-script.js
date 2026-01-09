/**
 * Google Apps Script para En Línea Spa
 * 
 * INSTRUCCIONES:
 * 1. Ve a tu hoja de cálculo de Google Sheets
 * 2. Extensiones > Apps Script
 * 3. Pega este código
 * 4. Guarda el proyecto
 * 5. Despliega como aplicación web
 * 6. Copia la URL y úsala en script.js
 */

function doPost(e) {
  // Configurar headers CORS para permitir peticiones desde cualquier origen
  const output = ContentService.createTextOutput();
  
  try {
    // Obtener la hoja de cálculo activa
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Manejar datos enviados como formulario HTML o JSON
    let data;
    if (e.parameter && e.parameter.data) {
      // Datos enviados como formulario HTML (campo 'data')
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      // Datos enviados como JSON directo
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No se recibieron datos válidos');
    }
    
    let sheet;
    let row;
    
    // Determinar qué hoja usar según el tipo
    if (data.tipo === 'agenda') {
      // Hoja de Citas
      sheet = spreadsheet.getSheetByName('Citas');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('Citas');
        // Agregar encabezados
        sheet.appendRow(['Fecha Registro', 'Nombre', 'Correo', 'Celular', 'Fecha Cita', 'Hora', 'Servicio', 'Mensaje']);
        // Formatear encabezados
        const headerRange = sheet.getRange(1, 1, 1, 8);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#B19CD9');
        headerRange.setFontColor('#FFFFFF');
      }
      
      // Validar que la cita no esté ya asignada (misma fecha y hora)
      const fechaCita = data.fecha || '';
      const horaCita = data.hora || '';
      
      if (fechaCita && horaCita) {
        const datos = sheet.getDataRange().getValues();
        // Buscar duplicados (empezar desde la fila 2 porque la fila 1 son encabezados)
        for (let i = 1; i < datos.length; i++) {
          // Columna 4 = Fecha Cita, Columna 5 = Hora
          const fechaExistente = datos[i][4];
          const horaExistente = datos[i][5];
          
          // Normalizar formatos de fecha y hora para comparación
          const fechaCitaNormalizada = fechaCita.toString().trim();
          const horaCitaNormalizada = horaCita.toString().trim();
          const fechaExistenteNormalizada = fechaExistente ? fechaExistente.toString().trim() : '';
          const horaExistenteNormalizada = horaExistente ? horaExistente.toString().trim() : '';
          
          if (fechaExistenteNormalizada === fechaCitaNormalizada && 
              horaExistenteNormalizada === horaCitaNormalizada) {
            const errorResponse = JSON.stringify({
              'success': false,
              'error': 'Esta fecha y hora ya está reservada. Por favor selecciona otra fecha u hora.'
            });
            output.setContent(errorResponse);
            output.setMimeType(ContentService.MimeType.JSON);
            return output;
          }
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
        data.mensaje || ''
      ];
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
    }
    
    // Agregar la fila a la hoja
    sheet.appendRow(row);
    
    // Enviar email de confirmación
    try {
      if (data.tipo === 'registro' && data.correo && data.correo.trim() !== '') {
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #B19CD9; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #FFFFFF; margin: 0;">¡Gracias por registrarte!</h1>
            </div>
            <div style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px;">Hola <strong>${data.nombre || 'Cliente'}</strong>,</p>
              <p style="color: #333; font-size: 16px;">¡Bienvenido a En Línea Spa!</p>
              <p style="color: #333; font-size: 16px;">Tu código de descuento del 10% es:</p>
              <div style="background-color: #90EE90; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <p style="color: #000; font-size: 24px; font-weight: bold; margin: 0;">SPA10</p>
              </div>
              <p style="color: #333; font-size: 16px;">Presenta este código al momento de tu cita para obtener tu descuento.</p>
              <p style="color: #333; font-size: 16px;">¡Esperamos verte pronto!</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">Saludos,<br>Equipo En Línea Spa</p>
            </div>
          </div>
        `;
        
        MailApp.sendEmail({
          to: data.correo.trim(),
          subject: '¡Bienvenido a En Línea Spa!',
          htmlBody: emailBody
        });
        
        Logger.log('Email de registro enviado a: ' + data.correo);
      }
      
      if (data.tipo === 'agenda' && data.correo && data.correo.trim() !== '') {
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #B19CD9; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #FFFFFF; margin: 0;">¡Cita Agendada!</h1>
            </div>
            <div style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px;">Hola <strong>${data.nombre || 'Cliente'}</strong>,</p>
              <p style="color: #333; font-size: 16px;">Hemos recibido tu solicitud de cita:</p>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <ul style="color: #333; font-size: 16px; list-style: none; padding: 0;">
                  <li style="margin-bottom: 10px;"><strong>Fecha:</strong> ${data.fecha || 'No especificada'}</li>
                  <li style="margin-bottom: 10px;"><strong>Hora:</strong> ${data.hora || 'No especificada'}</li>
                  <li style="margin-bottom: 10px;"><strong>Servicio:</strong> ${data.servicio || 'No especificado'}</li>
                </ul>
              </div>
              <p style="color: #333; font-size: 16px;">Te contactaremos pronto para confirmar tu cita.</p>
              <p style="color: #333; font-size: 16px;">¡Esperamos verte pronto!</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">Saludos,<br>Equipo En Línea Spa</p>
            </div>
          </div>
        `;
        
        MailApp.sendEmail({
          to: data.correo.trim(),
          subject: 'Confirmación de Cita - En Línea Spa',
          htmlBody: emailBody
        });
        
        Logger.log('Email de cita enviado a: ' + data.correo);
      }
    } catch (emailError) {
      Logger.log('Error al enviar email: ' + emailError.toString());
      Logger.log('Stack trace: ' + emailError.stack);
      // No fallar si el email no se envía, pero registrar el error
    }
    
    // Retornar respuesta exitosa
    const successResponse = JSON.stringify({
      'success': true,
      'message': 'Datos guardados correctamente'
    });
    output.setContent(successResponse);
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
    
  } catch (error) {
    // Retornar respuesta de error
    const errorResponse = JSON.stringify({
      'success': false,
      'error': error.toString()
    });
    output.setContent(errorResponse);
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

/**
 * Función para obtener citas reservadas (GET)
 * Incluye headers CORS para permitir peticiones desde cualquier origen
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // Crear respuesta con headers CORS
    const output = ContentService.createTextOutput();
    
    if (action === 'getCitas') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = spreadsheet.getSheetByName('Citas');
      
      let citas = [];
      
      if (sheet) {
        const datos = sheet.getDataRange().getValues();
        
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
      }
      
      const response = JSON.stringify({
        'success': true,
        'citas': citas
      });
      
      output.setContent(response);
      output.setMimeType(ContentService.MimeType.JSON);
      return output;
    }
    
    // Respuesta por defecto
    output.setContent('En Línea Spa - Google Apps Script funcionando correctamente');
    output.setMimeType(ContentService.MimeType.TEXT);
    return output;
      
  } catch (error) {
    const response = JSON.stringify({
      'success': false,
      'error': error.toString(),
      'citas': []
    });
    const output = ContentService.createTextOutput(response);
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}
