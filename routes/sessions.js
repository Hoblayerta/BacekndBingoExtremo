const express = require('express');
const router = express.Router();

// Simulación de una lista de sesiones activas
let sessions = [];

router.post('/create', (req, res) => {
    const sessionCode = generateSessionCode();
    sessions.push({ code: sessionCode, players: [] });
    res.json({ sessionCode });
});

router.post('/join', (req, res) => {
    const { sessionCode, playerName } = req.body;
    const session = sessions.find(s => s.code === sessionCode);
    if (session) {
        session.players.push(playerName);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Sesión no encontrada' });
    }
});

function generateSessionCode() {
    // Generar un código de sesión único de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = router;