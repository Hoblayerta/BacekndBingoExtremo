const nodemailer = require('nodemailer');

// Configurar transporter con variables de entorno
function createTransporter() {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Variables de entorno EMAIL_USER y EMAIL_PASS no configuradas');
        console.warn('📧 Los correos no se enviarán hasta que configures estas variables');
        return null;
    }

    return nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

function sendConfirmationEmail(email, verificationCode) {
    const transporter = createTransporter();
    
    // Si no hay transporter configurado, solo log el código
    if (!transporter) {
        console.log('📧 MODO DEBUG - Código de verificación para', email, ':', verificationCode);
        return;
    }

    let mailOptions = {
        from: `"Bingo Onboarding" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Código de Verificación para Bingo Onboarding',
        text: `Tu código de verificación es: ${verificationCode}`,
        html: `
            <h2>Bingo Onboarding - Verificación de Cuenta</h2>
            <p>Tu código de verificación es: <strong style="font-size: 24px; color: #4CAF50;">${verificationCode}</strong></p>
            <p>Ingresa este código en la aplicación para completar tu registro.</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('❌ Error al enviar el correo:', error);
        } else {
            console.log('✅ Correo de verificación enviado:', info.response);
        }
    });
}

function sendRoundCodeEmail(email, roundCode, password) {
    const transporter = createTransporter();
    
    // Si no hay transporter configurado, solo log la información
    if (!transporter) {
        console.log('📧 MODO DEBUG - Código de partida para', email);
        console.log('🎯 Código:', roundCode);
        console.log('🔑 Contraseña:', password);
        return;
    }

    let mailOptions = {
        from: `"Bingo Game" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Código de Partida de Bingo Creado',
        text: `Tu partida de Bingo ha sido creada exitosamente.\n\nCódigo de Partida: ${roundCode}\nTu Contraseña: ${password}\n\nComparte el código ${roundCode} con los jugadores para que se unan a tu partida.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2196F3;">🎯 Partida de Bingo Creada</h2>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Detalles de tu Partida:</h3>
                    <p><strong>Código de Partida:</strong> 
                        <span style="font-size: 28px; color: #4CAF50; font-weight: bold; letter-spacing: 3px;">${roundCode}</span>
                    </p>
                    <p><strong>Tu Contraseña:</strong> <code style="background: #e0e0e0; padding: 4px 8px;">${password}</code></p>
                </div>
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px;">
                    <h4>📋 Información Importante:</h4>
                    <ul>
                        <li>Comparte el código <strong>${roundCode}</strong> con los jugadores</li>
                        <li>Máximo 10 jugadores por partida</li>
                        <li>Cada jugador tendrá un tablero de 3x3 único</li>
                        <li>Como host, podrás controlar el juego</li>
                    </ul>
                </div>
                <p style="margin-top: 20px; color: #666;">
                    ¡Que disfrutes tu partida de Bingo!
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('❌ Error al enviar el correo del código de partida:', error);
        } else {
            console.log(`✅ Correo de código de partida enviado a ${email}:`, info.response);
        }
    });
}

module.exports = {
    sendConfirmationEmail,
    sendRoundCodeEmail
};