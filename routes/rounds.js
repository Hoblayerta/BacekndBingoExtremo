// routes/rounds.js - COMPLETO con todos los endpoints
const express = require('express');
const router = express.Router();
const emailUtils = require('../utils/email');
const sharedData = require('../data/shared');

// Configuración de tableros predefinidos (10 tableros de 3x3)
const PREDEFINED_BOARDS = [
    [[12, 6, 10], [5, 2, 18], [24, 16, 1]],
    [[9, 8, 17], [23, 20, 7], [15, 4, 14]],
    [[5, 22, 19], [13, 12, 11], [21, 3, 1]],
    [[10, 7, 14], [1, 23, 16], [21, 8, 17]],
    [[13, 20, 18], [15, 11, 2], [9, 5, 6]],
    [[4, 13, 16], [3, 8, 12], [19, 21, 20]],
    [[5, 18, 10], [11, 7, 22], [19, 14, 15]],
    [[3, 17, 2], [9, 6, 12], [20, 21, 24]],
    [[7, 5, 18], [16, 17, 15], [14, 13, 1]],
    [[15, 8, 3], [19, 11, 6], [24, 4, 22]]
];

router.post('/create', async (req, res) => {
    try {
        const { code, hostEmail, hostPassword, maxPlayers = 10 } = req.body;
        
        console.log(`🎯 Creando partida: ${code} para ${hostEmail}`);
        
        if (!code) {
            return res.status(400).json({ error: 'Código de partida es requerido' });
        }
        
        if (!/^[A-Z0-9]{6}$/.test(code)) {
            return res.status(400).json({ error: 'El código debe tener exactamente 6 caracteres alfanuméricos' });
        }
        
        if (sharedData.getRoundByCode(code)) {
            return res.status(400).json({ error: 'El código de la partida ya existe' });
        }
        
        if (!hostEmail) {
            return res.status(400).json({ error: 'Email del host es requerido' });
        }
        
        const existingRounds = sharedData.getRoundsByHost(hostEmail);
        const activeRound = existingRounds.find(r => r.status !== 'finished');
        if (activeRound) {
            return res.status(400).json({ error: 'Ya tienes una partida activa' });
        }

        const user = sharedData.getUserByEmail(hostEmail);
        const emailConsent = user ? user.emailConsent : false;
        const unsubscribeToken = user ? user.unsubscribeToken : '';

        // MEJORADO: Estructura más detallada para el seguimiento de cartas
        const newRound = {
            code: code,
            hostEmail: hostEmail,
            createdAt: new Date(),
            status: 'waiting', // waiting, active, finished
            maxPlayers: Math.min(maxPlayers, 10),
            players: [],
            host: {
                email: hostEmail,
                joinedAt: new Date()
            },
            boards: PREDEFINED_BOARDS.slice(0, maxPlayers),
            takenBoards: [],
            
            // MEJORADO: Mejor tracking de cartas
            calledNumbers: [],        // Array ordenado de cartas llamadas
            currentNumber: null,      // Último número llamado
            lastCardTime: null,       // Timestamp de la última carta
            cardHistory: [],          // Historial detallado con timestamps
            totalCardsAvailable: 24,  // Total de cartas disponibles
            gameStartTime: null,      // Cuando empezó el juego
            
            gameState: 'lobby' // lobby, playing, paused, ended
        };
        
        sharedData.addRound(newRound);
        
        try {
            if (hostPassword) {
                console.log(`📧 Enviando email de partida a: ${hostEmail}`);
                emailUtils.sendRoundCodeEmail(hostEmail, code, hostPassword, emailConsent, unsubscribeToken);
            }
        } catch (emailError) {
            console.log(`⚠️  Error enviando email (no crítico): ${emailError.message}`);
        }
        
        console.log(`✅ Partida creada: ${code} por ${hostEmail}`);
        res.json({ 
            success: true, 
            message: 'Partida creada correctamente',
            code: code,
            roundId: sharedData.getAllRounds().length - 1,
            maxPlayers: newRound.maxPlayers,
            boards: newRound.boards.length,
            gameState: newRound.gameState
        });
        
    } catch (error) {
        console.error('❌ Error creating round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/list', (req, res) => {
    try {
        const rounds = sharedData.getAllRounds();
        const safeRounds = rounds.map(r => ({
            code: r.code,
            createdAt: r.createdAt,
            status: r.status,
            playerCount: r.players.length,
            maxPlayers: r.maxPlayers,
            gameState: r.gameState,
            hostEmail: r.hostEmail,
            totalCalled: r.calledNumbers.length,
            currentNumber: r.currentNumber
        }));
        res.json(safeRounds);
    } catch (error) {
        console.error('❌ Error listing rounds:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:code', (req, res) => {
    try {
        const { code } = req.params;
        const round = sharedData.getRoundByCode(code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        res.json({
            code: round.code,
            status: round.status,
            gameState: round.gameState,
            createdAt: round.createdAt,
            playerCount: round.players.length,
            maxPlayers: round.maxPlayers,
            players: round.players.map(p => ({ 
                name: p.name, 
                joinedAt: p.joinedAt, 
                boardIndex: p.boardIndex 
            })),
            hostEmail: round.hostEmail,
            takenBoards: round.takenBoards,
            totalCalled: r.calledNumbers.length,
            currentNumber: r.currentNumber
        });
    } catch (error) {
        console.error('❌ Error getting round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:code/join', (req, res) => {
    try {
        const { code } = req.params;
        const { playerName, playerEmail, selectedBoardIndex } = req.body;
        
        if (!playerName) {
            return res.status(400).json({ error: 'Nombre del jugador es requerido' });
        }
        
        const round = sharedData.getRoundByCode(code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.status === 'finished') {
            return res.status(400).json({ error: 'La partida ya ha terminado' });
        }
        
        if (round.players.length >= round.maxPlayers) {
            return res.status(400).json({ error: 'La partida está llena' });
        }
        
        if (round.players.some(p => p.name === playerName)) {
            return res.status(400).json({ error: 'El nombre del jugador ya está en uso' });
        }
        
        let boardIndex = selectedBoardIndex;
        
        if (boardIndex === undefined || boardIndex === null || round.takenBoards.includes(boardIndex)) {
            boardIndex = -1;
            for (let i = 0; i < round.maxPlayers; i++) {
                if (!round.takenBoards.includes(i)) {
                    boardIndex = i;
                    break;
                }
            }
            
            if (boardIndex === -1) {
                return res.status(400).json({ error: 'No hay tableros disponibles' });
            }
        }
        
        if (boardIndex < 0 || boardIndex >= round.boards.length) {
            return res.status(400).json({ error: 'Índice de tablero inválido' });
        }
        
        if (round.takenBoards.includes(boardIndex)) {
            return res.status(400).json({ error: 'El tablero seleccionado ya está ocupado' });
        }
        
        const playerBoard = round.boards[boardIndex];
        
        const newPlayer = {
            name: playerName,
            email: playerEmail || null,
            joinedAt: new Date(),
            board: playerBoard,
            markedNumbers: [],
            boardIndex: boardIndex
        };
        
        round.players.push(newPlayer);
        round.takenBoards.push(boardIndex);
        
        console.log(`👤 Jugador ${playerName} se unió a ${code} con tablero ${boardIndex}`);
        res.json({ 
            success: true, 
            message: 'Te has unido a la partida correctamente',
            playerCount: round.players.length,
            board: playerBoard,
            boardIndex: boardIndex
        });
        
    } catch (error) {
        console.error('❌ Error joining round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:code/start', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail } = req.body;
        
        const round = sharedData.getRoundByCode(code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede iniciar la partida' });
        }
        
        if (round.players.length < 3) {
            return res.status(400).json({ error: 'Se necesitan al menos 3 jugadores para comenzar' });
        }
        
        // Actualizar estado de la partida
        sharedData.updateRound(code, {
            status: 'active',
            gameState: 'playing',
            startedAt: new Date()
        });
        
        console.log(`🚀 Partida ${code} iniciada por ${hostEmail} con ${round.players.length} jugadores`);
        res.json({ 
            success: true, 
            message: 'Partida iniciada correctamente',
            playerCount: round.players.length
        });
        
    } catch (error) {
        console.error('❌ Error starting round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:code/boards', (req, res) => {
    try {
        const { code } = req.params;
        const round = sharedData.getRoundByCode(code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        res.json({
            code: round.code,
            boards: round.boards,
            takenBoards: round.takenBoards,
            players: round.players.map(p => ({
                name: p.name,
                boardIndex: p.boardIndex,
                board: p.board
            })),
            availableBoards: round.boards.map((board, index) => ({
                index: index,
                board: board,
                available: !round.takenBoards.includes(index)
            }))
        });
    } catch (error) {
        console.error('❌ Error getting boards:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:code/players', (req, res) => {
    try {
        const { code } = req.params;
        const round = sharedData.getRoundByCode(code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        res.json({
            code: round.code,
            status: round.status,
            gameState: round.gameState,
            playerCount: round.players.length,
            maxPlayers: round.maxPlayers,
            players: round.players.map(p => ({
                name: p.name,
                joinedAt: p.joinedAt,
                boardIndex: p.boardIndex
            })),
            canStart: round.players.length >= 3
        });
    } catch (error) {
        console.error('❌ Error getting players:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:code/call-card', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail, calledCard } = req.body;
        
        console.log(`🎴 Carta ${calledCard} solicitada para partida ${code} por ${hostEmail}`);
        
        const round = sharedData.getRoundByCode(code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede llamar cartas' });
        }
        
        // MEJORADO: Permitir llamar cartas incluso si el estado no es 'active'
        if (round.status === 'finished') {
            return res.status(400).json({ error: 'La partida ya ha terminado' });
        }
        
        // Validar número de carta
        if (!calledCard || calledCard < 1 || calledCard > 24) {
            return res.status(400).json({ error: 'Número de carta inválido (debe ser 1-24)' });
        }
        
        // MEJORADO: Prevenir cartas duplicadas
        if (round.calledNumbers.includes(calledCard)) {
            console.log(`⚠️  Carta ${calledCard} ya fue llamada en partida ${code}`);
            return res.status(400).json({ 
                error: 'Esta carta ya fue llamada',
                calledCard: calledCard,
                totalCalled: round.calledNumbers.length,
                calledNumbers: round.calledNumbers
            });
        }
        
        // MEJORADO: Agregar carta con información detallada
        const now = new Date();
        round.calledNumbers.push(calledCard);
        round.currentNumber = calledCard;
        round.lastCardTime = now;
        
        // Agregar al historial detallado
        round.cardHistory.push({
            cardNumber: calledCard,
            timestamp: now,
            hostEmail: hostEmail,
            order: round.calledNumbers.length
        });
        
        // NUEVO: Cambiar estado a 'active' automáticamente al llamar primera carta
        if (round.status === 'waiting' && round.calledNumbers.length === 1) {
            round.status = 'active';
            round.gameState = 'playing';
            round.gameStartTime = now;
            console.log(`🚀 Partida ${code} iniciada automáticamente al llamar primera carta`);
        }
        
        // MEJORADO: Verificar si se han llamado todas las cartas
        const allCardsCalled = round.calledNumbers.length >= round.totalCardsAvailable;
        if (allCardsCalled) {
            round.gameState = 'completed';
            console.log(`🏁 Todas las cartas han sido llamadas en partida ${code}`);
        }
        
        console.log(`✅ Carta ${calledCard} llamada en partida ${code} (${round.calledNumbers.length}/${round.totalCardsAvailable})`);
        
        res.json({ 
            success: true, 
            calledCard: calledCard,
            totalCalled: round.calledNumbers.length,
            calledNumbers: round.calledNumbers,
            currentNumber: round.currentNumber,
            maxCards: round.totalCardsAvailable,
            gameState: round.gameState,
            lastCardTime: round.lastCardTime,
            allCardsCalled: allCardsCalled
        });
        
    } catch (error) {
        console.error('❌ Error calling card:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:code/status', (req, res) => {
    try {
        const { code } = req.params;
        const round = sharedData.getRoundByCode(code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        // MEJORADO: Respuesta más detallada del estado
        const gameStatus = {
            code: round.code,
            status: round.status,
            gameState: round.gameState,
            
            // Información de cartas
            calledNumbers: round.calledNumbers,
            currentNumber: round.currentNumber,
            totalCalled: round.calledNumbers.length,
            maxNumbers: round.totalCardsAvailable,
            remainingCards: round.totalCardsAvailable - round.calledNumbers.length,
            lastCardTime: round.lastCardTime,
            
            // Información de tiempo
            createdAt: round.createdAt,
            gameStartTime: round.gameStartTime,
            
            // Información de jugadores
            playerCount: round.players.length,
            maxPlayers: round.maxPlayers,
            
            // Estado del juego
            winner: round.winner || null,
            allCardsCalled: round.calledNumbers.length >= round.totalCardsAvailable,
            canCallMoreCards: round.calledNumbers.length < round.totalCardsAvailable && round.status !== 'finished'
        };
        
        // NUEVO: Agregar historial de cartas si se solicita
        if (req.query.includeHistory === 'true') {
            gameStatus.cardHistory = round.cardHistory;
        }
        
        res.json(gameStatus);
        
    } catch (error) {
        console.error('❌ Error getting game status:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:code/bingo', (req, res) => {
    try {
        const { code } = req.params;
        const { playerName, markedTiles, playerBoard } = req.body;
        
        const round = sharedData.getRoundByCode(code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.status !== 'active') {
            return res.status(400).json({ error: 'La partida no está activa' });
        }
        
        if (round.winner) {
            return res.status(400).json({ error: 'Ya hay un ganador en esta partida' });
        }
        
        const isValidBingo = verifyBingo(markedTiles, playerBoard, round.calledNumbers);
        
        if (isValidBingo) {
            // Actualizar partida con el ganador
            sharedData.updateRound(code, {
                winner: playerName,
                winnerTime: new Date(),
                status: 'finished',
                gameState: 'ended'
            });
            
            console.log(`🏆 ¡BINGO! Ganador: ${playerName} en partida ${code}`);
            res.json({ 
                success: true, 
                winner: playerName,
                message: '¡Felicidades! ¡Ganaste el BINGO!'
            });
        } else {
            console.log(`❌ BINGO inválido de ${playerName} en partida ${code}`);
            res.json({ 
                success: false, 
                message: 'BINGO inválido. Verifica tu tablero.'
            });
        }
        
    } catch (error) {
        console.error('❌ Error verifying bingo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:code/end', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail, reason } = req.body;
        
        const round = sharedData.getRoundByCode(code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede terminar la partida' });
        }
        
        // Actualizar partida como terminada
        sharedData.updateRound(code, {
            status: 'finished',
            gameState: 'ended',
            endReason: reason || 'host_ended',
            endTime: new Date()
        });
        
        console.log(`🛑 Partida ${code} terminada por el host. Razón: ${reason}`);
        res.json({ 
            success: true, 
            message: 'Partida terminada correctamente'
        });
        
    } catch (error) {
        console.error('❌ Error ending round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// NUEVO: Endpoint para obtener historial detallado de cartas
router.get('/:code/card-history', (req, res) => {
    try {
        const { code } = req.params;
        const round = sharedData.getRoundByCode(code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        res.json({
            code: round.code,
            totalCalled: round.calledNumbers.length,
            calledNumbers: round.calledNumbers,
            cardHistory: round.cardHistory || [],
            gameStartTime: round.gameStartTime,
            lastCardTime: round.lastCardTime
        });
        
    } catch (error) {
        console.error('❌ Error getting card history:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// NUEVO: Endpoint para resetear cartas (solo para desarrollo/debugging)
router.post('/:code/reset-cards', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail, confirmReset } = req.body;
        
        // Solo permitir en desarrollo
        if (process.env.NODE_ENV === 'production' && !confirmReset) {
            return res.status(403).json({ error: 'No disponible en producción sin confirmación' });
        }
        
        const round = sharedData.getRoundByCode(code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede resetear cartas' });
        }
        
        // Resetear estado de cartas
        const previousCount = round.calledNumbers.length;
        round.calledNumbers = [];
        round.currentNumber = null;
        round.lastCardTime = null;
        round.cardHistory = [];
        round.gameState = 'lobby';
        round.status = 'waiting';
        round.gameStartTime = null;
        
        console.log(`🔄 Cartas reseteadas en partida ${code} (${previousCount} cartas eliminadas)`);
        
        res.json({
            success: true,
            message: 'Cartas reseteadas correctamente',
            previousCardCount: previousCount,
            currentCardCount: 0
        });
        
    } catch (error) {
        console.error('❌ Error resetting cards:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función auxiliar para verificar bingo
function verifyBingo(markedTiles, playerBoard, calledNumbers) {
    const boardFlat = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            boardFlat.push(playerBoard[row][col]);
        }
    }
    
    for (let i = 0; i < markedTiles.length; i++) {
        if (markedTiles[i]) {
            const number = boardFlat[i];
            if (!calledNumbers.includes(number)) {
                console.log(`Número ${number} marcado pero no llamado`);
                return false;
            }
        }
    }
    
    for (let i = 0; i < markedTiles.length; i++) {
        if (!markedTiles[i]) {
            console.log(`Tablero no completo - casilla ${i} sin marcar`);
            return false;
        }
    }
    
    for (let i = 0; i < boardFlat.length; i++) {
        const number = boardFlat[i];
        if (!calledNumbers.includes(number)) {
            console.log(`Número ${number} del tablero no ha sido llamado`);
            return false;
        }
    }
    
    console.log("✅ ¡BINGO VÁLIDO! Tablero completo y todos los números llamados");
    return true;
}

module.exports = router;
