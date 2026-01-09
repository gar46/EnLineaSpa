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
          if (datos[i][4] === fechaCita && datos[i][5] === horaCita) {
            return ContentService.createTextOutput(JSON.stringify({
              'success': false,
              'error': 'Esta fecha y hora ya está reservada. Por favor selecciona otra fecha u hora.'
            })).setMimeType(ContentService.MimeType.JSON);
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
    
    // Opcional: Enviar email de confirmación
    // Descomenta y configura si deseas enviar emails automáticos
    
    // if (data.tipo === 'registro') {
    //   MailApp.sendEmail({
    //     to: data.correo,
    //     subject: '¡Bienvenido a En Línea Spa!',
    //     htmlBody: `
    //       <h2>¡Gracias por registrarte!</h2>
    //       <p>Hola ${data.nombre},</p>
    //       <p>Tu código de descuento del 20% es: <strong>SPA20</strong></p>
    //       <p>Presenta este código al momento de tu cita.</p>
    //       <p>¡Esperamos verte pronto!</p>
    //     `
    //   });
    // }
    
    // if (data.tipo === 'agenda') {
    //   MailApp.sendEmail({
    //     to: data.correo,
    //     subject: 'Confirmación de Cita - En Línea Spa',
    //     htmlBody: `
    //       <h2>¡Cita Agendada!</h2>
    //       <p>Hola ${data.nombre},</p>
    //       <p>Hemos recibido tu solicitud de cita:</p>
    //       <ul>
    //         <li><strong>Fecha:</strong> ${data.fecha}</li>
    //         <li><strong>Hora:</strong> ${data.hora}</li>
    //         <li><strong>Servicio:</strong> ${data.servicio}</li>
    //       </ul>
    //       <p>Te contactaremos pronto para confirmar tu cita.</p>
    //       <p>¡Esperamos verte pronto!</p>
    //     `
    //   });
    // }
    
    // Retornar respuesta exitosa
    return ContentService.createTextOutput(JSON.stringify({
      'success': true,
      'message': 'Datos guardados correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
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
