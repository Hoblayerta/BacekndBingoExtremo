const express = require('express');
const router = express.Router();
const emailUtils = require('../utils/email');

// Simulación de una lista de partidas/sesiones
let rounds = [];

// Configuración de tableros predefinidos (10 tableros de 3x3)
const PREDEFINED_BOARDS = [
    // Tablero 1
    [[12, 6, 10], [5, 2, 18], [24, 16, 1]],
    // Tablero 2
    [[9, 8, 17], [23, 20, 7], [15, 4, 14]],
    // Tablero 3
    [[5, 22, 19], [13, 12, 11], [21, 3, 1]],
    // Tablero 4
    [[10, 7, 14], [1, 23, 16], [21, 8, 17]],
    // Tablero 5
    [[13, 20, 18], [15, 11, 2], [9, 5, 6]],
    // Tablero 6
    [[4, 13, 16], [3, 8, 12], [19, 21, 20]],
    // Tablero 7
    [[5, 18, 10], [11, 7, 22], [19, 14, 15]],
    // Tablero 8
    [[3, 17, 2], [9, 6, 12], [20, 21, 24]],
    // Tablero 9
    [[7, 5, 18], [16, 17, 15], [14, 13, 1]],
    // Tablero 10
    [[15, 8, 3], [19, 11, 6], [24, 4, 22]]
];

router.post('/create', async (req, res) => {
    try {
        const { code, hostEmail, hostPassword, maxPlayers = 10 } = req.body;
        
        // Validar que se proporcione un código
        if (!code) {
            return res.status(400).json({ error: 'Código de partida es requerido' });
        }
        
        // Validar formato del código (6 caracteres alfanuméricos)
        if (!/^[A-Z0-9]{6}$/.test(code)) {
            return res.status(400).json({ error: 'El código debe tener exactamente 6 caracteres alfanuméricos' });
        }
        
        // Verificar si el código ya existe
        if (rounds.some(r => r.code === code)) {
            return res.status(400).json({ error: 'El código de la partida ya existe' });
        }
        
        // Validar email del host
        if (!hostEmail) {
            return res.status(400).json({ error: 'Email del host es requerido' });
        }
        
        // Verificar si el host ya tiene una partida activa
        const existingRound = rounds.find(r => r.hostEmail === hostEmail && r.status !== 'finished');
        if (existingRound) {
            return res.status(400).json({ error: 'Ya tienes una partida activa' });
        }

        // Buscar el usuario para obtener su información de consentimiento
        const users = require('../data/users'); // Asegúrate de que la ruta y el archivo existen
        const user = users.find(u => u.email === hostEmail);
        const emailConsent = user ? user.emailConsent : false;
        const unsubscribeToken = user ? user.unsubscribeToken : '';

        // Crear nueva partida/sesión
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
            boards: PREDEFINED_BOARDS.slice(0, maxPlayers), // Asignar tableros según maxPlayers
            takenBoards: [], // Array para rastrear tableros ocupados
            calledNumbers: [],
            currentNumber: null,
            gameState: 'lobby' // lobby, playing, paused, ended
        };
        
        rounds.push(newRound);
        
        // Enviar código por email al host con información de consentimiento
        if (hostPassword) {
            emailUtils.sendRoundCodeEmail(hostEmail, code, hostPassword, emailConsent, unsubscribeToken);
        }
        
        console.log(`Partida creada con código: ${code} por ${hostEmail}`);
        res.json({ 
            success: true, 
            message: 'Partida creada correctamente',
            code: code,
            roundId: rounds.length - 1,
            maxPlayers: newRound.maxPlayers,
            boards: newRound.boards.length
        });
        
    } catch (error) {
        console.error('Error creating round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/list', (req, res) => {
    try {
        const safeRounds = rounds.map(r => ({
            code: r.code,
            createdAt: r.createdAt,
            status: r.status,
            playerCount: r.players.length,
            maxPlayers: r.maxPlayers,
            gameState: r.gameState,
            hostEmail: r.hostEmail
        }));
        res.json(safeRounds);
    } catch (error) {
        console.error('Error listing rounds:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:code', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
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
            takenBoards: round.takenBoards
        });
    } catch (error) {
        console.error('Error getting round:', error);
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
        
        const round = rounds.find(r => r.code === code);
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
        
        // Validar selección de tablero
        let boardIndex = selectedBoardIndex;
        
        // Si no se especificó tablero o el especificado está ocupado, asignar automáticamente
        if (boardIndex === undefined || boardIndex === null || round.takenBoards.includes(boardIndex)) {
            // Encontrar el primer tablero disponible
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
        
        // Validar que el índice del tablero sea válido
        if (boardIndex < 0 || boardIndex >= round.boards.length) {
            return res.status(400).json({ error: 'Índice de tablero inválido' });
        }
        
        // Verificar nuevamente que el tablero no esté ocupado
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
        round.takenBoards.push(boardIndex); // Marcar tablero como ocupado
        
        console.log(`Jugador ${playerName} se unió a la partida ${code} con tablero ${boardIndex}`);
        res.json({ 
            success: true, 
            message: 'Te has unido a la partida correctamente',
            playerCount: round.players.length,
            board: playerBoard,
            boardIndex: boardIndex
        });
        
    } catch (error) {
        console.error('Error joining round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:code/start', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail } = req.body;
        
        const round = rounds.find(r => r.code === code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede iniciar la partida' });
        }
        
        if (round.players.length < 3) {
            return res.status(400).json({ error: 'Se necesitan al menos 3 jugadores para comenzar' });
        }
        
        round.status = 'active';
        round.gameState = 'playing';
        round.startedAt = new Date();
        
        console.log(`Partida ${code} iniciada por ${hostEmail} con ${round.players.length} jugadores`);
        res.json({ 
            success: true, 
            message: 'Partida iniciada correctamente',
            playerCount: round.players.length
        });
        
    } catch (error) {
        console.error('Error starting round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:code/boards', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
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
        console.error('Error getting boards:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para que el host vea jugadores en tiempo real
router.get('/:code/players', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
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
        console.error('Error getting players:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para que el host envíe una carta
router.post('/:code/call-card', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail, calledCard } = req.body;
        
        const round = rounds.find(r => r.code === code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede llamar cartas' });
        }
        
        if (round.status !== 'active') {
            return res.status(400).json({ error: 'La partida no está activa' });
        }
        
        // Agregar carta llamada
        if (!round.calledNumbers.includes(calledCard)) {
            round.calledNumbers.push(calledCard);
            round.currentNumber = calledCard;
            round.lastCardTime = new Date();
        }
        
        console.log(`Carta ${calledCard} llamada en partida ${code}`);
        res.json({ 
            success: true, 
            calledCard: calledCard,
            totalCalled: round.calledNumbers.length,
            calledNumbers: round.calledNumbers
        });
        
    } catch (error) {
        console.error('Error calling card:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener estado del juego
router.get('/:code/status', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        res.json({
            code: round.code,
            status: round.status,
            gameState: round.gameState,
            calledNumbers: round.calledNumbers,
            currentNumber: round.currentNumber,
            totalCalled: round.calledNumbers.length,
            maxNumbers: 24,
            lastCardTime: round.lastCardTime,
            winner: round.winner || null
        });
        
    } catch (error) {
        console.error('Error getting game status:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar bingo
router.post('/:code/bingo', (req, res) => {
    try {
        const { code } = req.params;
        const { playerName, markedTiles, playerBoard } = req.body;
        
        const round = rounds.find(r => r.code === code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.status !== 'active') {
            return res.status(400).json({ error: 'La partida no está activa' });
        }
        
        if (round.winner) {
            return res.status(400).json({ error: 'Ya hay un ganador en esta partida' });
        }
        
        // Verificar si el bingo es válido
        const isValidBingo = verifyBingo(markedTiles, playerBoard, round.calledNumbers);
        
        if (isValidBingo) {
            // Marcar como ganador
            round.winner = playerName;
            round.winnerTime = new Date();
            round.status = 'finished';
            round.gameState = 'ended';
            
            console.log(`¡BINGO! Ganador: ${playerName} en partida ${code}`);
            res.json({ 
                success: true, 
                winner: playerName,
                message: '¡Felicidades! ¡Ganaste el BINGO!'
            });
        } else {
            console.log(`BINGO inválido de ${playerName} en partida ${code}`);
            res.json({ 
                success: false, 
                message: 'BINGO inválido. Verifica tu tablero.'
            });
        }
        
    } catch (error) {
        console.error('Error verifying bingo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para terminar partida
router.post('/:code/end', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail, reason } = req.body;
        
        const round = rounds.find(r => r.code === code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede terminar la partida' });
        }
        
        round.status = 'finished';
        round.gameState = 'ended';
        round.endReason = reason || 'host_ended';
        round.endTime = new Date();
        
        console.log(`Partida ${code} terminada por el host. Razón: ${reason}`);
        res.json({ 
            success: true, 
            message: 'Partida terminada correctamente'
        });
        
    } catch (error) {
        console.error('Error ending round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función auxiliar para verificar bingo - CORREGIDA
function verifyBingo(markedTiles, playerBoard, calledNumbers) {
    // Convertir tablero 3x3 a array plano para comparar con markedTiles
    const boardFlat = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            boardFlat.push(playerBoard[row][col]);
        }
    }
    
    // Verificar que todos los números marcados hayan sido llamados
    for (let i = 0; i < markedTiles.length; i++) {
        if (markedTiles[i]) {
            const number = boardFlat[i];
            if (!calledNumbers.includes(number)) {
                console.log(`Número ${number} marcado pero no llamado`);
                return false; // Número marcado pero no llamado
            }
        }
    }
    
    // Para ganar, el jugador debe tener TODAS las casillas marcadas
    for (let i = 0; i < markedTiles.length; i++) {
        if (!markedTiles[i]) {
            console.log(`Tablero no completo - casilla ${i} sin marcar`);
            return false; // El tablero no está completo
        }
    }
    
    // Verificar que todos los números del tablero hayan sido llamados
    for (let i = 0; i < boardFlat.length; i++) {
        const number = boardFlat[i];
        if (!calledNumbers.includes(number)) {
            console.log(`Número ${number} del tablero no ha sido llamado`);
            return false; // Hay números en el tablero que no han salido
        }
    }
    
    console.log("¡BINGO VÁLIDO! Tablero completo y todos los números llamados");
    return true; // BINGO válido - tablero completo y todos los números llamados
}

module.exports = router;
