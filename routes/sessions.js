const express = require('express');
const router = express.Router();
const sharedData = require('../data/shared');

router.post('/create', (req, res) => {
    try {
        const sessionCode = generateSessionCode();
        const newSession = { 
            code: sessionCode, 
            players: [],
            createdAt: new Date(),
            status: 'active'
        };
        
        sharedData.addSession(newSession);
        
        console.log(`🎮 Sesión creada: ${sessionCode}`);
        res.json({ 
            sessionCode: sessionCode,
            success: true,
            message: 'Sesión creada correctamente'
        });
        
    } catch (error) {
        console.error('❌ Error creating session:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/join', (req, res) => {
    try {
        const { sessionCode, playerName } = req.body;
        
        if (!sessionCode || !playerName) {
            return res.status(400).json({ error: 'Código de sesión y nombre de jugador son requeridos' });
        }
        
        const session = sharedData.getSessionByCode(sessionCode);
        
        if (session) {
            // Verificar si el jugador ya está en la sesión
            if (session.players.some(p => p.name === playerName)) {
                return res.status(400).json({ error: 'El nombre de jugador ya está en uso en esta sesión' });
            }
            
            session.players.push({
                name: playerName,
                joinedAt: new Date()
            });
            
            console.log(`👤 Jugador ${playerName} se unió a sesión ${sessionCode}`);
            res.json({ 
                success: true,
                message: 'Te has unido a la sesión correctamente',
                playerCount: session.players.length
            });
        } else {
            res.status(404).json({ error: 'Sesión no encontrada' });
        }
        
    } catch (error) {
        console.error('❌ Error joining session:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/list', (req, res) => {
    try {
        const sessions = sharedData.getAllSessions();
        const safeSessions = sessions.map(s => ({
            code: s.code,
            playerCount: s.players.length,
            createdAt: s.createdAt,
            status: s.status
        }));
        
        res.json(safeSessions);
    } catch (error) {
        console.error('❌ Error listing sessions:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:code', (req, res) => {
    try {
        const { code } = req.params;
        const session = sharedData.getSessionByCode(code);
        
        if (!session) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }
        
        res.json({
            code: session.code,
            playerCount: session.players.length,
            players: session.players.map(p => ({
                name: p.name,
                joinedAt: p.joinedAt
            })),
            createdAt: session.createdAt,
            status: session.status
        });
        
    } catch (error) {
        console.error('❌ Error getting session:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/:code', (req, res) => {
    try {
        const { code } = req.params;
        const sessions = sharedData.getAllSessions();
        const sessionIndex = sessions.findIndex(s => s.code === code);
        
        if (sessionIndex === -1) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }
        
        sessions.splice(sessionIndex, 1);
        
        console.log(`🗑️  Sesión ${code} eliminada`);
        res.json({ 
            success: true,
            message: 'Sesión eliminada correctamente'
        });
        
    } catch (error) {
        console.error('❌ Error deleting session:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

function generateSessionCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = router;
