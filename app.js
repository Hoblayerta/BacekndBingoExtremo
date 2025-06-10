// Cargar variables de entorno al inicio
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sessionRoutes = require('./routes/sessions');
const authRoutes = require('./routes/auth');
const roundsRoutes = require('./routes/rounds');
const sharedData = require('./data/shared');

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

// Middleware para logging en desarrollo
if (process.env.NODE_ENV !== 'production') {
   app.use((req, res, next) => {
       console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
       next();
   });
}

// Ruta principal
app.get('/', (req, res) => {
   res.json({ 
       message: 'Bingo Backend API funcionando correctamente',
       version: process.env.API_VERSION || '1.0.0',
       environment: process.env.NODE_ENV || 'development',
       emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
       timestamp: new Date().toISOString(),
       endpoints: {
           auth: '/api/auth',
           rounds: '/api/rounds',
           sessions: '/api/sessions',
           stats: '/api/stats',
           health: '/health'
       }
   });
});

// Ruta de health check
app.get('/health', (req, res) => {
   res.json({ 
       status: 'OK', 
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       environment: process.env.NODE_ENV || 'development'
   });
});

// NUEVO: Endpoint de estadísticas del sistema
app.get('/api/stats', (req, res) => {
   try {
       const stats = sharedData.getStats();
       res.json({
           ...stats,
           serverInfo: {
               timestamp: new Date().toISOString(),
               uptime: process.uptime(),
               environment: process.env.NODE_ENV || 'development',
               emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
               version: process.env.API_VERSION || '1.0.0'
           }
       });
   } catch (error) {
       console.error('❌ Error getting stats:', error);
       res.status(500).json({ error: 'Error interno del servidor' });
   }
});

// NUEVO: Endpoint para limpiar todos los datos (solo desarrollo)
app.post('/api/admin/clear-data', (req, res) => {
   if (process.env.NODE_ENV === 'production') {
       return res.status(403).json({ error: 'No disponible en producción' });
   }
   
   try {
       sharedData.clearAllData();
       console.log('🧹 Todos los datos han sido limpiados');
       res.json({ 
           success: true, 
           message: 'Todos los datos han sido limpiados',
           timestamp: new Date().toISOString()
       });
   } catch (error) {
       console.error('❌ Error clearing data:', error);
       res.status(500).json({ error: 'Error interno del servidor' });
   }
});

// NUEVO: Endpoint para información del sistema
app.get('/api/info', (req, res) => {
   res.json({
       name: 'Bingo Game Backend',
       description: 'API backend para juego de Bingo multijugador',
       version: process.env.API_VERSION || '1.0.0',
       environment: process.env.NODE_ENV || 'development',
       author: 'Tu Nombre',
       repository: 'https://github.com/tu-usuario/bingo-backend',
       documentation: '/api/docs',
       supportEmail: process.env.SUPPORT_EMAIL || 'support@bingo-game.com',
       features: [
           'Autenticación de usuarios',
           'Sistema de consentimiento de emails',
           'Creación y gestión de partidas',
           'Tableros únicos de 3x3',
           'Verificación de BINGO en tiempo real',
           'Notificaciones por email'
       ],
       endpoints: {
           auth: {
               signup: 'POST /api/auth/signup',
               verify: 'POST /api/auth/verify',
               login: 'POST /api/auth/login',
               unsubscribe: 'GET /api/auth/unsubscribe/:token'
           },
           rounds: {
               create: 'POST /api/rounds/create',
               list: 'GET /api/rounds/list',
               join: 'POST /api/rounds/:code/join',
               start: 'POST /api/rounds/:code/start',
               status: 'GET /api/rounds/:code/status'
           },
           sessions: {
               create: 'POST /api/sessions/create',
               join: 'POST /api/sessions/join',
               list: 'GET /api/sessions/list'
           }
       }
   });
});

// NUEVO: Endpoint para documentación básica
app.get('/api/docs', (req, res) => {
   res.send(`
       <!DOCTYPE html>
       <html>
       <head>
           <title>Bingo Game API - Documentación</title>
           <meta charset="UTF-8">
           <style>
               body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
               .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
               .method { padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; }
               .get { background: #4CAF50; }
               .post { background: #2196F3; }
               .delete { background: #f44336; }
               code { background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
           </style>
       </head>
       <body>
           <h1>🎯 Bingo Game API - Documentación</h1>
           
           <h2>Autenticación</h2>
           <div class="endpoint">
               <span class="method post">POST</span> <code>/api/auth/signup</code>
               <p>Registrar nuevo usuario con consentimiento de email</p>
           </div>
           <div class="endpoint">
               <span class="method post">POST</span> <code>/api/auth/verify</code>
               <p>Verificar código de email</p>
           </div>
           <div class="endpoint">
               <span class="method post">POST</span> <code>/api/auth/login</code>
               <p>Iniciar sesión</p>
           </div>
           
           <h2>Partidas</h2>
           <div class="endpoint">
               <span class="method post">POST</span> <code>/api/rounds/create</code>
               <p>Crear nueva partida</p>
           </div>
           <div class="endpoint">
               <span class="method get">GET</span> <code>/api/rounds/list</code>
               <p>Listar todas las partidas</p>
           </div>
           <div class="endpoint">
               <span class="method post">POST</span> <code>/api/rounds/:code/join</code>
               <p>Unirse a una partida</p>
           </div>
           
           <h2>Sistema</h2>
           <div class="endpoint">
               <span class="method get">GET</span> <code>/api/stats</code>
               <p>Estadísticas del sistema</p>
           </div>
           <div class="endpoint">
               <span class="method get">GET</span> <code>/health</code>
               <p>Estado del servidor</p>
           </div>
           
           <footer style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; color: #666;">
               <p>Bingo Game API v${process.env.API_VERSION || '1.0.0'} - ${process.env.NODE_ENV || 'development'}</p>
           </footer>
       </body>
       </html>
   `);
});

// Rutas de la API
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rounds', roundsRoutes);

// Manejo de errores 404
app.use('*', (req, res) => {
   res.status(404).json({ 
       error: 'Endpoint no encontrado',
       path: req.originalUrl,
       method: req.method,
       timestamp: new Date().toISOString(),
       availableEndpoints: [
           'GET /',
           'GET /health',
           'GET /api/stats',
           'GET /api/info',
           'GET /api/docs',
           'POST /api/auth/signup',
           'POST /api/auth/login',
           'POST /api/rounds/create',
           'GET /api/rounds/list'
       ]
   });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
   console.error('❌ Error:', err);
   res.status(500).json({ 
       error: 'Error interno del servidor',
       timestamp: new Date().toISOString(),
       ...(process.env.NODE_ENV !== 'production' && { details: err.message })
   });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
   console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
   console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
   console.log(`📧 Email configurado: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
   console.log(`📊 Endpoints disponibles:`);
   console.log(`   - API Info: http://localhost:${PORT}/api/info`);
   console.log(`   - Documentación: http://localhost:${PORT}/api/docs`);
   console.log(`   - Estadísticas: http://localhost:${PORT}/api/stats`);
   console.log(`   - Salud: http://localhost:${PORT}/health`);
   
   if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
       console.log('⚠️  Recuerda configurar EMAIL_USER y EMAIL_PASS para el envío de correos');
   }
   
   // Mostrar estadísticas iniciales
   setTimeout(() => {
       try {
           const stats = sharedData.getStats();
           console.log('📈 Sistema inicializado:', stats);
       } catch (error) {
           console.log('⚠️  Error obteniendo estadísticas iniciales');
       }
   }, 1000);
});
