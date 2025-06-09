const express = require('express');
const router = express.Router();
const emailUtils = require('../utils/email');
const bcrypt = require('bcryptjs');

// Simulación de una lista de usuarios registrados
let users = [];

router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        
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
        
        users.push({ 
            email, 
            password: hashedPassword, 
            verificationCode, 
            verified: false,
            createdAt: new Date()
        });
        
        // Enviar email de confirmación
        emailUtils.sendConfirmationEmail(email, verificationCode);
        
        console.log(`Usuario registrado: ${email}, Código: ${verificationCode}`);
        res.json({ success: true, message: 'Usuario registrado correctamente' });
        
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
            res.json({ success: true, message: 'Usuario verificado correctamente' });
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
            res.json({ success: true, message: 'Login exitoso' });
        } else {
            res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
        }
        
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para debug (eliminar en producción)
router.get('/users', (req, res) => {
    const safeUsers = users.map(u => ({
        email: u.email,
        verified: u.verified,
        verificationCode: u.verificationCode,
        createdAt: u.createdAt
    }));
    res.json(safeUsers);
});

module.exports = router;
