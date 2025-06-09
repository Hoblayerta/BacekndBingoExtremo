const express = require('express');
const router = express.Router();
const emailUtils = require('../utils/email');
const bcrypt = require('bcryptjs');

// Simulación de una lista de usuarios registrados
let users = [];

router.post('/signup', async (req, res) => {
    try {
        const { email, password, emailConsent = false } = req.body;
        
        // Validar datos de entrada
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }
        
        // Verificar si el usuario ya existe
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        
        // Validar longitud de contraseña
        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const unsubscribeToken = generateUnsubscribeToken();
        
        const newUser = { 
            email, 
            password: hashedPassword, 
            verificationCode, 
            verified: false,
            emailConsent: emailConsent,
            unsubscribeToken: unsubscribeToken,
            consentDate: emailConsent ? new Date() : null,
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        // Enviar email de confirmación con información de consentimiento
        emailUtils.sendConfirmationEmail(email, verificationCode, {
            emailConsent: emailConsent,
            unsubscribeToken: unsubscribeToken
        });
        
        console.log(`Usuario registrado: ${email}, Código: ${verificationCode}, Consentimiento: ${emailConsent}`);
        res.json({ 
            success: true, 
            message: 'Usuario registrado correctamente',
            emailConsent: emailConsent
        });
        
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/verify', (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        
        // Validar datos de entrada
        if (!email || !verificationCode) {
            return res.status(400).json({ error: 'Email y código de verificación son requeridos' });
        }
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        if (user.verified) {
            return res.status(400).json({ error: 'Usuario ya verificado' });
        }
        
        if (user.verificationCode === verificationCode) {
            user.verified = true;
            user.verifiedAt = new Date();
            console.log(`Usuario verificado: ${email}`);
            res.json({ 
                success: true, 
                message: 'Usuario verificado correctamente',
                emailConsent: user.emailConsent
            });
        } else {
            res.status(400).json({ error: 'Código de verificación incorrecto' });
        }
        
    } catch (error) {
        console.error('Error in verify:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validar datos de entrada
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }
        
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
        }
        
        if (!user.verified) {
            return res.status(400).json({ error: 'Usuario no verificado. Revisa tu correo electrónico.' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            console.log(`Usuario autenticado: ${email}`);
            res.json({ 
                success: true, 
                message: 'Login exitoso',
                emailConsent: user.emailConsent
            });
        } else {
            res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
        }
        
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// NUEVO: Endpoint para darse de baja de emails
router.get('/unsubscribe/:token', (req, res) => {
    try {
        const { token } = req.params;
        
        const user = users.find(u => u.unsubscribeToken === token);
        if (!user) {
            return res.status(404).json({ error: 'Token de baja no válido' });
        }
        
        user.emailConsent = false;
        user.unsubscribeDate = new Date();
        
        console.log(`Usuario ${user.email} se dio de baja de emails`);
        
        // Enviar página HTML de confirmación
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Te has dado de baja exitosamente</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                    .success { color: #4CAF50; }
                    .info { color: #666; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1 class="success">✅ Te has dado de baja exitosamente</h1>
                <p>Tu email <strong>${user.email}</strong> ha sido eliminado de nuestra lista de actualizaciones.</p>
                <p class="info">Ya no recibirás emails promocionales, pero seguirás recibiendo emails esenciales relacionados con tu cuenta y partidas.</p>
                <p class="info">Si cambiaste de opinión, puedes volver a suscribirte en la configuración de tu cuenta.</p>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Error in unsubscribe:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// NUEVO: Endpoint para volver a suscribirse
router.post('/resubscribe', (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        user.emailConsent = true;
        user.consentDate = new Date();
        delete user.unsubscribeDate;
        
        console.log(`Usuario ${email} se volvió a suscribir a emails`);
        res.json({ 
            success: true, 
            message: 'Te has vuelto a suscribir exitosamente'
        });
        
    } catch (error) {
        console.error('Error in resubscribe:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para debug (eliminar en producción)
router.get('/users', (req, res) => {
    const safeUsers = users.map(u => ({
        email: u.email,
        verified: u.verified,
        emailConsent: u.emailConsent,
        consentDate: u.consentDate,
        createdAt: u.createdAt
    }));
    res.json(safeUsers);
});

// Función para generar token único de baja
function generateUnsubscribeToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

module.exports = router;
