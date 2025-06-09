// Cargar variables de entorno al inicio
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sessionRoutes = require('./routes/sessions');
const authRoutes = require('./routes/auth');
const roundsRoutes = require('./routes/rounds');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS === '*' ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Configurar body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'Bingo Backend API funcionando correctamente',
        version: process.env.API_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        endpoints: {
            auth: '/api/auth',
            rounds: '/api/rounds',
            sessions: '/api/sessions'
        }
    });
});

// Middleware para logging en desarrollo
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Rutas de la API
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rounds', roundsRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint no encontrado',
        path: req.originalUrl,
        method: req.method
    });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        ...(process.env.NODE_ENV !== 'production' && { details: err.message })
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📧 Email configurado: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Recuerda configurar EMAIL_USER y EMAIL_PASS para el envío de correos');
    }
});