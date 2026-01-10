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
      // Asegurar que la fecha esté en formato correcto para Google Sheets
      let fechaCitaFormateada = data.fecha || '';
      if (fechaCitaFormateada) {
        // Si la fecha viene en formato YYYY-MM-DD, mantenerla así
        // Google Sheets la reconocerá automáticamente como fecha
        fechaCitaFormateada = fechaCitaFormateada.toString().trim();
      }
      
      row = [
        data.fechaRegistro || new Date().toLocaleString('es-ES'),
        data.nombre || '',
        data.correo || '',
        data.celular || '',
        fechaCitaFormateada,
        (data.hora || '').toString().trim(),
        data.servicio || '',
        data.mensaje || ''
      ];
      
      Logger.log('Agregando cita: ' + JSON.stringify(row));
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
    
    // Enviar email de confirmación ANTES de retornar respuesta
    try {
      if (data.tipo === 'registro' && data.correo && data.correo.trim() !== '' && data.correo.includes('@')) {
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
        
        Logger.log('Email de registro enviado exitosamente a: ' + data.correo);
      }
      
      if (data.tipo === 'agenda' && data.correo && data.correo.trim() !== '' && data.correo.includes('@')) {
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
        
        Logger.log('Email de cita enviado exitosamente a: ' + data.correo);
      }
    } catch (emailError) {
      Logger.log('Error al enviar email: ' + emailError.toString());
      Logger.log('Stack trace: ' + (emailError.stack || 'N/A'));
      // Continuar aunque haya error en el email, no fallar la operación completa
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
    
    if (action === 'getCitas') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = spreadsheet.getSheetByName('Citas');
      
      let citas = [];
      
      if (sheet) {
        const datos = sheet.getDataRange().getValues();
        
        Logger.log('Total de filas en la hoja: ' + datos.length);
        
        // Empezar desde la fila 2 (la fila 1 son encabezados)
        for (let i = 1; i < datos.length; i++) {
          const fechaCita = datos[i][4]; // Columna E (índice 4) = Fecha Cita
          const horaCita = datos[i][5]; // Columna F (índice 5) = Hora
          
          Logger.log('Fila ' + (i+1) + ' - Fecha: ' + fechaCita + ', Hora: ' + horaCita + ', Tipo hora: ' + typeof horaCita);
          
          if (fechaCita && horaCita) {
            // Convertir fecha a formato YYYY-MM-DD si es Date object
            let fechaFormateada;
            if (fechaCita instanceof Date) {
              const year = fechaCita.getFullYear();
              const month = String(fechaCita.getMonth() + 1).padStart(2, '0');
              const day = String(fechaCita.getDate()).padStart(2, '0');
              fechaFormateada = `${year}-${month}-${day}`;
            } else {
              // Si es string, intentar convertir
              try {
                const fechaStr = fechaCita.toString().trim();
                // Si ya está en formato YYYY-MM-DD, usarlo directamente
                if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
                  fechaFormateada = fechaStr;
                } else {
                  const fechaObj = new Date(fechaCita);
                  if (!isNaN(fechaObj.getTime())) {
                    const year = fechaObj.getFullYear();
                    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
                    const day = String(fechaObj.getDate()).padStart(2, '0');
                    fechaFormateada = `${year}-${month}-${day}`;
                  } else {
                    fechaFormateada = fechaStr;
                  }
                }
              } catch (e) {
                fechaFormateada = fechaCita.toString().trim();
              }
            }
            
            // Normalizar hora - extraer solo la hora en formato HH:MM
            let horaFormateada = '';
            
            try {
              // Primero, intentar usar el método getDisplayValue() si está disponible (mejor opción)
              // Pero como getDataRange().getValues() devuelve valores raw, necesitamos procesarlos
              
              let horaDate = null;
              let horaStr = '';
              
              // Si es Date object, usarlo directamente
              if (horaCita instanceof Date) {
                horaDate = horaCita;
              } 
              // Si es número (fracción del día en Google Sheets 0.0 a 1.0)
              else if (typeof horaCita === 'number') {
                // Google Sheets almacena horas como fracción del día desde 1899-12-30
                // Ejemplo: 0.75 = 18:00 (6 PM), 0.5 = 12:00 (medio día)
                const totalMinutes = Math.round(horaCita * 24 * 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                horaFormateada = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
                Logger.log('Hora extraída de número (fracción): ' + horaFormateada + ' (valor: ' + horaCita + ')');
              }
              // Si es string (puede venir como "Sat Dec 30 1899 18:00:00 GMT-0456")
              else {
                horaStr = horaCita.toString().trim();
                
                // Intentar parsear como fecha completa primero
                try {
                  horaDate = new Date(horaStr);
                  // Si la fecha es 1899 o 1900, significa que es solo hora en Google Sheets
                  if (!isNaN(horaDate.getTime())) {
                    // Extraer hora y minutos directamente, sin importar el año
                    const hours = horaDate.getHours();
                    const minutes = horaDate.getMinutes();
                    horaFormateada = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
                    Logger.log('Hora extraída de string Date: ' + horaFormateada + ' (original: ' + horaStr + ')');
                  } else {
                    throw new Error('No se pudo parsear como Date');
                  }
                } catch (e) {
                  // Si falla parsear como Date, extraer con regex
                  const match = horaStr.match(/(\d{1,2}):(\d{2})/);
                  if (match) {
                    const h = parseInt(match[1]);
                    const m = parseInt(match[2]);
                    horaFormateada = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                    Logger.log('Hora extraída con regex: ' + horaFormateada + ' (original: ' + horaStr + ')');
                  } else {
                    // Último intento: buscar cualquier patrón de hora
                    const allNumbers = horaStr.match(/\d+/g);
                    if (allNumbers && allNumbers.length >= 2) {
                      const h = parseInt(allNumbers[0]);
                      const m = parseInt(allNumbers[1]);
                      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                        horaFormateada = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                        Logger.log('Hora extraída de números sueltos: ' + horaFormateada);
                      }
                    }
                  }
                }
              }
              
              // Si todavía no tenemos la hora formateada pero tenemos un Date object
              if (!horaFormateada && horaDate && horaDate instanceof Date && !isNaN(horaDate.getTime())) {
                const hours = horaDate.getHours();
                const minutes = horaDate.getMinutes();
                horaFormateada = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
                Logger.log('Hora extraída de Date object: ' + horaFormateada);
              }
              
            } catch (error) {
              Logger.log('Error al normalizar hora: ' + error.toString() + ' (valor original: ' + horaCita + ')');
            }
            
            // Solo agregar si la hora está en formato válido (HH:MM)
            if (/^\d{2}:\d{2}$/.test(horaFormateada)) {
              citas.push({
                fecha: fechaFormateada,
                hora: horaFormateada,
                servicio: datos[i][6] || '',
                nombre: datos[i][1] || ''
              });
              Logger.log('✅ Cita agregada: ' + fechaFormateada + ' a las ' + horaFormateada);
            } else {
              Logger.log('⚠️ Hora no válida, omitiendo cita. Original: ' + horaCita + ', Formateada: ' + horaFormateada);
            }
          }
        }
        
        Logger.log('Citas obtenidas: ' + citas.length);
        if (citas.length > 0) {
          Logger.log('Primera cita: ' + JSON.stringify(citas[0]));
        }
      } else {
        Logger.log('La hoja "Citas" no existe todavía');
      }
      
      const responseData = {
        'success': true,
        'citas': citas
      };
      
      const responseJson = JSON.stringify(responseData);
      Logger.log('Respuesta preparada, tamaño: ' + responseJson.length + ' caracteres');
      Logger.log('Total de citas en respuesta: ' + citas.length);
      if (citas.length > 0) {
        Logger.log('Primera cita en respuesta: ' + JSON.stringify(citas[0]));
      }
      
      // Retornar JSON usando ContentService (maneja CORS automáticamente)
      // ContentService ya incluye los headers CORS necesarios
      return ContentService.createTextOutput(responseJson)
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Respuesta por defecto
    return ContentService.createTextOutput('En Línea Spa - Google Apps Script funcionando correctamente')
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    Logger.log('Error en doGet: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    
    const errorResponse = {
      'success': false,
      'error': error.toString(),
      'citas': []
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
