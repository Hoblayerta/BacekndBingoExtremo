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
        
        console.log(`🎯 Creando partida: ${code} para ${hostEmail}`);
        
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
            
            // NUEVOS CAMPOS para mejor tracking
            lastCardTime: null,
            cardHistory: [],
            totalCardsAvailable: 24,
            gameStartTime: null,
            
            gameState: 'lobby' // lobby, playing, paused, ended
        };
        
        rounds.push(newRound);
        
        // Enviar código por email al host junto con su contraseña
        if (hostPassword) {
            try {
                emailUtils.sendRoundCodeEmail(hostEmail, code, hostPassword);
            } catch (emailError) {
                console.log(`⚠️  Error enviando email (no crítico): ${emailError.message}`);
            }
        }
        
        console.log(`✅ Partida creada con código: ${code} por ${hostEmail}`);
        res.json({ 
            success: true, 
            message: 'Partida creada correctamente',
            code: code,
            roundId: rounds.length - 1,
            maxPlayers: newRound.maxPlayers,
            boards: newRound.boards.length
        });
        
    } catch (error) {
        console.error('❌ Error creating round:', error);
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
            hostEmail: r.hostEmail,
            // NUEVOS CAMPOS para CardDisplayScene
            totalCalled: r.calledNumbers ? r.calledNumbers.length : 0,
            currentNumber: r.currentNumber || null
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
            takenBoards: round.takenBoards,
            // NUEVOS CAMPOS para CardDisplayScene
            totalCalled: round.calledNumbers ? round.calledNumbers.length : 0,
            currentNumber: round.currentNumber || null
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
        
        console.log(`👤 Jugador ${playerName} se unió a la partida ${code} con tablero ${boardIndex}`);
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
        round.gameStartTime = new Date(); // NUEVO campo
        
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
        console.error('❌ Error getting boards:', error);
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
        console.error('❌ Error getting players:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// MEJORADO: Endpoint para que el host envíe una carta
router.post('/:code/call-card', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail, calledCard } = req.body;
        
        console.log(`🎴 Carta ${calledCard} solicitada para partida ${code} por ${hostEmail}`);
        
        const round = rounds.find(r => r.code === code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede llamar cartas' });
        }
        
        // MEJORADO: Permitir llamar cartas incluso si no está en 'active' para flexibilidad
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
        
        // NUEVO: Agregar al historial detallado
        if (!round.cardHistory) round.cardHistory = [];
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
        
        // NUEVO: Verificar si se han llamado todas las cartas
        const allCardsCalled = round.calledNumbers.length >= (round.totalCardsAvailable || 24);
        if (allCardsCalled) {
            round.gameState = 'completed';
            console.log(`🏁 Todas las cartas han sido llamadas en partida ${code}`);
        }
        
        console.log(`✅ Carta ${calledCard} llamada en partida ${code} (${round.calledNumbers.length}/${round.totalCardsAvailable || 24})`);
        
        res.json({ 
            success: true, 
            calledCard: calledCard,
            totalCalled: round.calledNumbers.length,
            calledNumbers: round.calledNumbers,
            currentNumber: round.currentNumber,
            maxCards: round.totalCardsAvailable || 24,
            gameState: round.gameState,
            lastCardTime: round.lastCardTime,
            allCardsCalled: allCardsCalled
        });
        
    } catch (error) {
        console.error('❌ Error calling card:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// MEJORADO: Endpoint para obtener estado del juego
router.get('/:code/status', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        // MEJORADO: Respuesta más detallada del estado
        const gameStatus = {
            code: round.code,
            status: round.status,
            gameState: round.gameState,
            
            // Información de cartas
            calledNumbers: round.calledNumbers || [],
            currentNumber: round.currentNumber || null,
            totalCalled: round.calledNumbers ? round.calledNumbers.length : 0,
            maxNumbers: round.totalCardsAvailable || 24,
            remainingCards: (round.totalCardsAvailable || 24) - (round.calledNumbers ? round.calledNumbers.length : 0),
            lastCardTime: round.lastCardTime || null,
            
            // Información de tiempo
            createdAt: round.createdAt,
            gameStartTime: round.gameStartTime || null,
            
            // Información de jugadores
            playerCount: round.players.length,
            maxPlayers: round.maxPlayers,
            
            // NUEVO: Estado del ganador
            winner: round.winner || null,
            winnerTime: round.winnerTime || null,
            winnerData: round.winner ? (round.winnerData || null) : null,
            
            // Estado del juego
            allCardsCalled: (round.calledNumbers ? round.calledNumbers.length : 0) >= (round.totalCardsAvailable || 24),
            canCallMoreCards: (round.calledNumbers ? round.calledNumbers.length : 0) < (round.totalCardsAvailable || 24) && round.status !== 'finished',
            gameFinished: round.status === 'finished' || !!round.winner
        };
        
        // NUEVO: Agregar historial de cartas si se solicita
        if (req.query.includeHistory === 'true') {
            gameStatus.cardHistory = round.cardHistory || [];
        }
        
        res.json(gameStatus);
        
    } catch (error) {
        console.error('❌ Error getting game status:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// MEJORADO: Endpoint para verificar bingo con nueva función
router.post('/:code/bingo', (req, res) => {
    try {
        const { code } = req.params;
        const { 
            playerName, 
            markedTiles, 
            playerBoard, 
            boardId = null,
            calledCardsWhenClaimed = null 
        } = req.body;
        
        console.log(`🎯 Verificación de BINGO de ${playerName} en partida ${code}`);
        
        const round = rounds.find(r => r.code === code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.status !== 'active') {
            return res.status(400).json({ 
                error: 'La partida no está activa',
                currentStatus: round.status
            });
        }
        
        if (round.winner) {
            return res.status(400).json({ 
                error: 'Ya hay un ganador en esta partida',
                winner: round.winner
            });
        }
        
        // Verificar si el jugador existe en la partida
        const player = round.players.find(p => p.name === playerName);
        if (!player) {
            return res.status(400).json({ 
                error: 'Jugador no encontrado en esta partida'
            });
        }
        
        // NUEVA VERIFICACIÓN MEJORADA
        const verification = verifyBingo(markedTiles, playerBoard, round.calledNumbers, {
            playerName: playerName,
            boardId: boardId,
            calledCardsWhenClaimed: calledCardsWhenClaimed
        });
        
        if (verification.valid) {
            // ¡BINGO VÁLIDO! - Marcar como ganador
            round.winner = playerName;
            round.winnerTime = new Date();
            round.winnerData = {
                playerName: playerName,
                boardId: boardId,
                winningBoard: playerBoard,
                markedTiles: markedTiles,
                calledCardsAtWin: round.calledNumbers.slice(), // Copia del estado actual
                totalCardsAtWin: round.calledNumbers.length,
                verificationDetails: verification
            };
            round.status = 'finished';
            round.gameState = 'ended';
            
            console.log(`🏆 ¡BINGO VÁLIDO! Ganador: ${playerName} en partida ${code}`);
            console.log(`🎯 Tablero ganador:`, playerBoard);
            console.log(`📊 Total cartas llamadas: ${round.calledNumbers.length}`);
            
            // RESPUESTA DE ÉXITO
            res.json({ 
                success: true, 
                winner: playerName,
                message: verification.message,
                winDetails: {
                    winnerTime: round.winnerTime,
                    totalCardsAtWin: round.calledNumbers.length,
                    winningBoard: playerBoard,
                    gameCode: code
                }
            });
            
            // Log detallado para el servidor
            console.log(`✅ PARTIDA ${code} FINALIZADA - Ganador: ${playerName}`);
            
        } else {
            // BINGO INVÁLIDO - Enviar detalles del error
            console.log(`❌ BINGO INVÁLIDO de ${playerName} en partida ${code}`);
            console.log(`📋 Razón: ${verification.reason}`);
            console.log(`💬 Mensaje: ${verification.message}`);
            
            // RESPUESTA DE ERROR CON DETALLES
            res.json({ 
                success: false, 
                message: verification.message,
                reason: verification.reason,
                details: {
                    missingCards: verification.missingCards || [],
                    unmarkedTiles: verification.unmarkedTiles || [],
                    invalidMarks: verification.invalidMarks || [],
                    currentCalledCards: round.calledNumbers,
                    totalCalled: round.calledNumbers.length
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error verifying bingo:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
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
        const round = rounds.find(r => r.code === code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        res.json({
            code: round.code,
            totalCalled: round.calledNumbers ? round.calledNumbers.length : 0,
            calledNumbers: round.calledNumbers || [],
            cardHistory: round.cardHistory || [],
            gameStartTime: round.gameStartTime || null,
            lastCardTime: round.lastCardTime || null
        });
        
    } catch (error) {
        console.error('❌ Error getting card history:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// NUEVO: Endpoint para obtener estado detallado del ganador
router.get('/:code/winner', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (!round.winner) {
            return res.status(404).json({ 
                error: 'No hay ganador aún',
                gameState: round.gameState,
                status: round.status
            });
        }
        
        res.json({
            winner: round.winner,
            winnerTime: round.winnerTime,
            winnerData: round.winnerData || null,
            gameCode: code,
            totalPlayers: round.players.length,
            gameDuration: round.winnerTime && round.gameStartTime ? 
                round.winnerTime - round.gameStartTime : null
        });
        
    } catch (error) {
        console.error('❌ Error getting winner info:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función auxiliar para verificar bingo - MEJORADA
function verifyBingo(markedTiles, playerBoard, calledNumbers, playerData = {}) {
    console.log("=== VERIFICANDO BINGO ===");
    console.log("Jugador:", playerData.playerName || "Desconocido");
    console.log("Tablero del jugador:", playerBoard);
    console.log("Tiles marcados:", markedTiles);
    console.log("Cartas llamadas:", calledNumbers);
    
    // Convertir tablero 3x3 a array plano para comparar con markedTiles
    const boardFlat = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            boardFlat.push(playerBoard[row][col]);
        }
    }
    
    console.log("Tablero plano:", boardFlat);
    
    // PASO 1: Verificar que todas las cartas del tablero hayan sido llamadas
    const missingCards = [];
    for (let i = 0; i < boardFlat.length; i++) {
        const number = boardFlat[i];
        if (!calledNumbers.includes(number)) {
            missingCards.push(number);
        }
    }
    
    if (missingCards.length > 0) {
        console.log(`❌ BINGO INVÁLIDO: Faltan cartas por salir: ${missingCards.join(', ')}`);
        return {
            valid: false,
            reason: 'missing_cards',
            message: `Faltan cartas por salir: ${missingCards.join(', ')}`,
            missingCards: missingCards
        };
    }
    
    // PASO 2: Verificar que el jugador haya marcado TODAS las casillas
    const unmarkedTiles = [];
    for (let i = 0; i < markedTiles.length; i++) {
        if (!markedTiles[i]) {
            unmarkedTiles.push({
                index: i,
                number: boardFlat[i]
            });
        }
    }
    
    if (unmarkedTiles.length > 0) {
        console.log(`❌ BINGO INVÁLIDO: Casillas sin marcar:`, unmarkedTiles);
        return {
            valid: false,
            reason: 'unmarked_tiles',
            message: `Debes marcar todas las casillas de tu tablero`,
            unmarkedTiles: unmarkedTiles
        };
    }
    
    // PASO 3: Verificar que solo se hayan marcado números que realmente salieron
    const invalidMarks = [];
    for (let i = 0; i < markedTiles.length; i++) {
        if (markedTiles[i]) {
            const number = boardFlat[i];
            if (!calledNumbers.includes(number)) {
                invalidMarks.push({
                    index: i,
                    number: number
                });
            }
        }
    }
    
    if (invalidMarks.length > 0) {
        console.log(`❌ BINGO INVÁLIDO: Números marcados incorrectamente:`, invalidMarks);
        return {
            valid: false,
            reason: 'invalid_marks',
            message: `Tienes números marcados que no han salido`,
            invalidMarks: invalidMarks
        };
    }
    
    // PASO 4: ¡BINGO VÁLIDO!
    console.log("✅ ¡BINGO VÁLIDO! Todas las verificaciones pasaron");
    return {
        valid: true,
        reason: 'complete_board',
        message: '¡Felicidades! ¡Ganaste el BINGO!',
        completedAt: new Date(),
        boardNumbers: boardFlat,
        totalCardsInBoard: boardFlat.length
    };
}

module.exports = router;
