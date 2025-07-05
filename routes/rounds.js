const express = require('express');
const router = express.Router();
const emailUtils = require('../utils/email');

// Simulación de una lista de partidas/sesiones
let rounds = [];

// ACTUALIZADO: 100 tableros predefinidos de 4x4 con cartas 1-54
const PREDEFINED_BOARDS_4X4 = [
    // Tablero 1
    [
        [23, 41, 7, 52],
        [15, 8, 34, 29],
        [46, 12, 19, 3],
        [37, 50, 26, 14]
    ],
    // Tablero 2
    [
        [9, 48, 21, 35],
        [54, 17, 6, 42],
        [30, 11, 45, 18],
        [4, 39, 25, 51]
    ],
    // Tablero 3
    [
        [16, 32, 44, 5],
        [40, 13, 27, 49],
        [22, 53, 10, 36],
        [1, 28, 47, 20]
    ],
    // Tablero 4
    [
        [33, 2, 38, 24],
        [50, 19, 43, 8],
        [15, 52, 31, 46],
        [7, 41, 12, 54]
    ],
    // Tablero 5
    [
        [45, 18, 6, 29],
        [34, 51, 14, 37],
        [9, 26, 48, 21],
        [53, 4, 39, 11]
    ],
    // Tablero 6
    [
        [25, 47, 16, 3],
        [42, 10, 35, 54],
        [17, 44, 22, 30],
        [5, 40, 13, 38]
    ],
    // Tablero 7
    [
        [31, 6, 49, 24],
        [12, 45, 19, 33],
        [52, 28, 4, 41],
        [8, 36, 50, 15]
    ],
    // Tablero 8
    [
        [43, 20, 7, 46],
        [29, 53, 11, 32],
        [18, 2, 37, 48],
        [51, 26, 9, 14]
    ],
    // Tablero 9
    [
        [39, 16, 54, 23],
        [6, 44, 27, 35],
        [50, 13, 21, 3],
        [42, 17, 45, 30]
    ],
    // Tablero 10
    [
        [1, 34, 19, 47],
        [25, 8, 52, 12],
        [40, 49, 5, 38],
        [22, 31, 46, 4]
    ],
    // Tablero 11
    [
        [36, 15, 28, 53],
        [7, 41, 24, 18],
        [48, 32, 10, 43],
        [14, 51, 37, 26]
    ],
    // Tablero 12
    [
        [20, 9, 45, 33],
        [54, 29, 6, 39],
        [11, 47, 23, 16],
        [35, 2, 50, 44]
    ],
    // Tablero 13
    [
        [27, 52, 13, 42],
        [17, 4, 46, 21],
        [38, 25, 8, 49],
        [3, 36, 19, 31]
    ],
    // Tablero 14
    [
        [48, 12, 37, 5],
        [22, 53, 30, 14],
        [41, 18, 51, 28],
        [7, 43, 15, 40]
    ],
    // Tablero 15
    [
        [34, 26, 1, 45],
        [50, 9, 32, 24],
        [16, 54, 39, 6],
        [29, 11, 47, 35]
    ],
    // Tablero 16
    [
        [52, 21, 44, 13],
        [3, 38, 15, 49],
        [27, 4, 33, 54],
        [10, 46, 8, 19]
    ],
    // Tablero 17
    [
        [41, 17, 2, 36],
        [25, 51, 28, 5],
        [12, 39, 23, 48],
        [54, 7, 42, 31]
    ],
    // Tablero 18
    [
        [14, 50, 35, 22],
        [47, 6, 53, 18],
        [32, 45, 1, 40],
        [9, 26, 37, 11]
    ],
    // Tablero 19
    [
        [38, 3, 24, 51],
        [16, 43, 34, 8],
        [49, 20, 15, 52],
        [4, 33, 46, 27]
    ],
    // Tablero 20
    [
        [30, 44, 7, 19],
        [53, 12, 41, 25],
        [6, 48, 29, 54],
        [21, 35, 13, 2]
    ],
    // Tablero 21
    [
        [17, 39, 50, 5],
        [42, 28, 9, 45],
        [1, 36, 18, 47],
        [26, 14, 52, 37]
    ],
    // Tablero 22
    [
        [46, 23, 8, 34],
        [11, 49, 32, 3],
        [54, 15, 43, 20],
        [38, 4, 51, 16]
    ],
    // Tablero 23
    [
        [22, 6, 40, 48],
        [35, 53, 24, 12],
        [19, 31, 7, 44],
        [50, 25, 1, 33]
    ],
    // Tablero 24
    [
        [13, 47, 27, 41],
        [18, 2, 46, 30],
        [52, 39, 14, 5],
        [36, 21, 54, 9]
    ],
    // Tablero 25
    [
        [45, 32, 16, 51],
        [8, 26, 49, 37],
        [3, 42, 23, 15],
        [53, 10, 38, 28]
    ],
    // Tablero 26
    [
        [29, 17, 43, 6],
        [44, 11, 1, 52],
        [25, 48, 35, 4],
        [19, 54, 12, 40]
    ],
    // Tablero 27
    [
        [31, 50, 18, 24],
        [7, 36, 45, 22],
        [47, 9, 32, 51],
        [14, 41, 2, 34]
    ],
    // Tablero 28
    [
        [5, 23, 54, 39],
        [46, 13, 27, 16],
        [33, 52, 8, 42],
        [20, 3, 49, 26]
    ],
    // Tablero 29
    [
        [44, 30, 15, 1],
        [53, 21, 38, 47],
        [6, 35, 50, 17],
        [28, 43, 11, 25]
    ],
    // Tablero 30
    [
        [12, 48, 37, 4],
        [19, 40, 54, 29],
        [45, 7, 24, 33],
        [51, 18, 2, 46]
    ],
    // Tablero 31
    [
        [36, 14, 22, 52],
        [9, 31, 16, 41],
        [49, 26, 5, 39],
        [3, 44, 53, 20]
    ],
    // Tablero 32
    [
        [47, 8, 35, 13],
        [27, 50, 42, 6],
        [15, 1, 48, 32],
        [54, 23, 34, 17]
    ],
    // Tablero 33
    [
        [21, 43, 10, 45],
        [38, 4, 51, 25],
        [18, 37, 29, 53],
        [7, 33, 46, 12]
    ],
    // Tablero 34
    [
        [40, 19, 2, 28],
        [52, 24, 14, 49],
        [36, 6, 41, 16],
        [30, 54, 9, 44]
    ],
    // Tablero 35
    [
        [26, 51, 39, 11],
        [3, 47, 20, 35],
        [45, 22, 54, 8],
        [15, 42, 31, 1]
    ],
    // Tablero 36
    [
        [48, 5, 17, 33],
        [13, 38, 46, 27],
        [50, 12, 25, 43],
        [4, 29, 53, 37]
    ],
    // Tablero 37
    [
        [34, 41, 18, 7],
        [52, 16, 2, 48],
        [23, 49, 36, 14],
        [44, 30, 6, 51]
    ],
    // Tablero 38
    [
        [9, 24, 47, 40],
        [35, 54, 19, 3],
        [21, 32, 45, 28],
        [1, 39, 15, 50]
    ],
    // Tablero 39
    [
        [46, 11, 31, 22],
        [8, 42, 53, 26],
        [37, 4, 17, 41],
        [33, 20, 52, 6]
    ],
    // Tablero 40
    [
        [25, 48, 12, 38],
        [49, 18, 43, 5],
        [54, 29, 9, 16],
        [2, 36, 47, 23]
    ],
    // Tablero 41
    [
        [13, 35, 51, 19],
        [44, 7, 30, 45],
        [27, 53, 3, 34],
        [40, 14, 24, 1]
    ],
    // Tablero 42
    [
        [32, 21, 6, 50],
        [17, 39, 54, 11],
        [46, 8, 28, 42],
        [4, 48, 15, 37]
    ],
    // Tablero 43
    [
        [52, 26, 41, 10],
        [22, 3, 49, 36],
        [18, 45, 31, 5],
        [47, 33, 9, 25]
    ],
    // Tablero 44
    [
        [7, 43, 20, 54],
        [38, 51, 12, 16],
        [2, 24, 53, 35],
        [29, 19, 46, 8]
    ],
    // Tablero 45
    [
        [44, 14, 39, 27],
        [6, 48, 21, 1],
        [50, 34, 4, 40],
        [17, 52, 23, 30]
    ],
    // Tablero 46
    [
        [15, 37, 47, 13],
        [54, 5, 32, 42],
        [26, 49, 11, 18],
        [3, 41, 28, 45]
    ],
    // Tablero 47
    [
        [31, 9, 25, 52],
        [43, 20, 38, 7],
        [12, 51, 46, 33],
        [48, 2, 16, 35]
    ],
    // Tablero 48
    [
        [24, 50, 4, 19],
        [36, 14, 53, 29],
        [8, 40, 22, 47],
        [54, 17, 39, 6]
    ],
    // Tablero 49
    [
        [41, 26, 15, 44],
        [1, 45, 37, 23],
        [49, 11, 34, 52],
        [21, 5, 48, 30]
    ],
    // Tablero 50
    [
        [18, 32, 53, 3],
        [46, 27, 9, 51],
        [38, 6, 19, 42],
        [13, 35, 50, 28]
    ],
    // Tablero 51
    [
        [33, 47, 12, 40],
        [54, 22, 4, 16],
        [7, 43, 31, 25],
        [39, 1, 45, 20]
    ],
    // Tablero 52
    [
        [29, 8, 36, 49],
        [15, 52, 24, 37],
        [44, 17, 2, 53],
        [26, 41, 14, 6]
    ],
    // Tablero 53
    [
        [48, 21, 46, 11],
        [3, 34, 50, 19],
        [35, 51, 27, 9],
        [5, 30, 42, 18]
    ],
    // Tablero 54
    [
        [23, 54, 38, 32],
        [40, 13, 1, 45],
        [16, 28, 52, 4],
        [47, 7, 33, 25]
    ],
    // Tablero 55
    [
        [10, 39, 17, 49],
        [51, 24, 43, 8],
        [29, 2, 44, 36],
        [20, 46, 12, 53]
    ],
    // Tablero 56
    [
        [37, 6, 31, 14],
        [48, 35, 18, 50],
        [5, 41, 26, 1],
        [54, 22, 38, 15]
    ],
    // Tablero 57
    [
        [42, 19, 9, 27],
        [13, 47, 52, 34],
        [3, 30, 16, 45],
        [23, 11, 49, 40]
    ],
    // Tablero 58
    [
        [25, 44, 53, 4],
        [32, 8, 21, 39],
        [54, 18, 7, 28],
        [12, 51, 36, 46]
    ],
    // Tablero 59
    [
        [20, 2, 43, 35],
        [47, 29, 15, 5],
        [41, 33, 50, 17],
        [6, 38, 24, 52]
    ],
    // Tablero 60
    [
        [31, 53, 26, 10],
        [14, 42, 48, 22],
        [37, 1, 39, 49],
        [45, 16, 4, 34]
    ],
    // Tablero 61
    [
        [48, 3, 19, 45],
        [25, 51, 9, 36],
        [13, 40, 54, 21],
        [32, 7, 43, 18]
    ],
    // Tablero 62
    [
        [29, 46, 6, 52],
        [17, 2, 35, 41],
        [50, 23, 12, 38],
        [4, 31, 47, 26]
    ],
    // Tablero 63
    [
        [15, 42, 30, 1],
        [53, 28, 44, 11],
        [8, 37, 49, 24],
        [39, 54, 5, 33]
    ],
    // Tablero 64
    [
        [22, 14, 48, 34],
        [40, 16, 27, 52],
        [6, 45, 20, 3],
        [51, 9, 35, 19]
    ],
    // Tablero 65
    [
        [41, 25, 7, 47],
        [32, 50, 21, 13],
        [18, 4, 46, 53],
        [36, 43, 1, 29]
    ],
    // Tablero 66
    [
        [49, 17, 33, 8],
        [24, 39, 54, 15],
        [2, 26, 42, 44],
        [51, 12, 30, 38]
    ],
    // Tablero 67
    [
        [35, 5, 52, 23],
        [45, 31, 10, 48],
        [19, 53, 37, 6],
        [14, 27, 41, 3]
    ],
    // Tablero 68
    [
        [11, 43, 28, 50],
        [54, 18, 4, 32],
        [40, 9, 25, 47],
        [20, 36, 15, 1]
    ],
    // Tablero 69
    [
        [26, 38, 13, 44],
        [7, 49, 35, 21],
        [51, 16, 2, 30],
        [42, 24, 53, 8]
    ],
    // Tablero 70
    [
        [33, 46, 22, 6],
        [29, 12, 48, 39],
        [17, 54, 31, 45],
        [5, 19, 37, 52]
    ],
    // Tablero 71
    [
        [14, 1, 41, 27],
        [50, 34, 18, 4],
        [23, 47, 10, 36],
        [53, 25, 43, 16]
    ],
    // Tablero 72
    [
        [40, 51, 15, 32],
        [8, 24, 46, 2],
        [35, 49, 6, 28],
        [19, 42, 54, 11]
    ],
    // Tablero 73
    [
        [37, 20, 9, 48],
        [13, 44, 52, 26],
        [3, 33, 21, 50],
        [45, 7, 38, 30]
    ],
    // Tablero 74
    [
        [22, 39, 47, 5],
        [54, 17, 31, 43],
        [12, 41, 18, 1],
        [29, 4, 49, 34]
    ],
    // Tablero 75
    [
        [46, 8, 25, 53],
        [35, 51, 14, 19],
        [42, 28, 36, 6],
        [2, 48, 23, 40]
    ],
    // Tablero 76
    [
        [16, 32, 50, 24],
        [41, 3, 45, 37],
        [54, 15, 27, 9],
        [21, 38, 11, 47]
    ],
    // Tablero 77
    [
        [30, 44, 4, 18],
        [52, 26, 39, 13],
        [7, 49, 33, 51],
        [43, 20, 1, 35]
    ],
    // Tablero 78
    [
        [25, 12, 46, 31],
        [6, 48, 22, 42],
        [38, 5, 50, 17],
        [53, 34, 8, 28]
    ],
    // Tablero 79
    [
        [41, 29, 54, 14],
        [19, 37, 2, 45],
        [32, 24, 47, 10],
        [9, 44, 16, 52]
    ],
    // Tablero 80
    [
        [36, 15, 3, 49],
        [27, 53, 40, 21],
        [1, 43, 30, 39],
        [51, 11, 26, 4]
    ],
    // Tablero 81
    [
        [23, 48, 35, 7],
        [45, 18, 52, 33],
        [6, 38, 13, 46],
        [20, 2, 41, 25]
    ],
    // Tablero 82
    [
        [50, 31, 17, 42],
        [8, 34, 47, 54],
        [26, 12, 40, 5],
        [37, 49, 21, 15]
    ],
    // Tablero 83
    [
        [44, 9, 28, 36],
        [53, 22, 1, 39],
        [14, 51, 24, 48],
        [4, 32, 45, 19]
    ],
    // Tablero 84
    [
        [16, 41, 52, 30],
        [43, 6, 25, 11],
        [35, 47, 3, 54],
        [27, 18, 38, 7]
    ],
    // Tablero 85
    [
        [20, 33, 46, 2],
        [49, 15, 37, 29],
        [51, 39, 8, 23],
        [12, 44, 50, 34]
    ],
    // Tablero 86
    [
        [5, 26, 42, 48],
        [17, 52, 31, 40],
        [45, 1, 19, 53],
        [36, 13, 4, 24]
    ],
    // Tablero 87
    [
        [32, 47, 21, 9],
        [54, 14, 43, 6],
        [28, 38, 16, 50],
        [3, 41, 35, 22]
    ],
    // Tablero 88
    [
        [39, 11, 49, 25],
        [7, 30, 18, 51],
        [44, 52, 37, 12],
        [15, 2, 46, 33]
    ],
    // Tablero 89
    [
        [23, 54, 8, 40],
        [36, 19, 42, 27],
        [4, 45, 29, 1],
        [48, 17, 53, 31]
    ],
    // Tablero 90
    [
        [13, 35, 50, 24],
        [47, 5, 20, 44],
        [32, 41, 14, 6],
        [51, 26, 38, 9]
    ],
    // Tablero 91
    [
        [30, 2, 43, 52],
        [21, 49, 16, 34],
        [54, 7, 25, 39],
        [18, 46, 10, 37]
    ],
    // Tablero 92
    [
        [45, 28, 1, 15],
        [12, 53, 33, 48],
        [40, 22, 51, 8],
        [6, 35, 41, 19]
    ],
    // Tablero 93
    [
        [27, 42, 17, 4],
        [50, 24, 9, 38],
        [3, 31, 47, 44],
        [52, 14, 23, 36]
    ],
    // Tablero 94
    [
        [11, 39, 54, 29],
        [46, 20, 5, 32],
        [18, 49, 26, 2],
        [41, 7, 43, 16]
    ],
    // Tablero 95
    [
        [34, 48, 13, 51],
        [8, 37, 45, 22],
        [53, 15, 35, 1],
        [25, 30, 6, 40]
    ],
    // Tablero 96
    [
        [19, 4, 47, 33],
        [52, 28, 14, 41],
        [21, 50, 9, 36],
        [44, 12, 54, 27]
    ],
    // Tablero 97
    [
        [38, 17, 31, 5],
        [24, 46, 53, 16],
        [49, 3, 42, 35],
        [10, 39, 18, 48]
    ],
    // Tablero 98
    [
        [45, 23, 26, 54],
        [1, 37, 50, 7],
        [32, 43, 20, 11],
        [52, 29, 15, 2]
    ],
    // Tablero 99
    [
        [6, 44, 34, 41],
        [49, 13, 4, 30],
        [25, 51, 47, 19],
        [38, 8, 22, 53]
    ],
    // Tablero 100
    [
        [33, 8, 51, 19],
        [45, 27, 4, 38],
        [12, 49, 22, 54],
        [6, 41, 15, 30]
    ]
];

// ACTUALIZADO: Constantes para 54 cartas y 100 tableros
const MAX_CARDS = 54;
const MAX_BOARDS = 100;
const BOARD_SIZE = 16; // 4x4
const TRIGGER_CARD = 55; // Carta especial para trigger (fuera del rango normal)

router.post('/create', async (req, res) => {
    try {
        const { code, hostEmail, hostPassword, maxPlayers = 10, maxWinners = 999 } = req.body;
        
        console.log(`🎯 Creando partida: ${code} para ${hostEmail} (54 cartas, 100 tableros)`);
        
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
        
        // ACTUALIZADO: Crear nueva partida para 54 cartas y 100 tableros
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
            // ACTUALIZADO: Usar tableros 4x4 con 100 opciones
            boards: PREDEFINED_BOARDS_4X4.slice(0, MAX_BOARDS),
            takenBoards: [],
            calledNumbers: [],
            currentNumber: null,
            
            // Sistema de ganadores
            winners: [],
            maxWinners: 999,
            winnerCount: 0,
            allowMultipleWinners: true,
            gameFinishedTime: null,
            autoEndOnWinners: false,
            
            // ACTUALIZADO: Campos para 54 cartas
            lastCardTime: null,
            cardHistory: [],
            totalCardsAvailable: MAX_CARDS,
            maxCards: MAX_CARDS,
            gameStartTime: null,
            
            gameState: 'lobby' // lobby, playing, paused, ended
        };
        
        rounds.push(newRound);
        
        // Enviar código por email al host
        if (hostPassword) {
            try {
                emailUtils.sendRoundCodeEmail(hostEmail, code, hostPassword);
            } catch (emailError) {
                console.log(`⚠️  Error enviando email (no crítico): ${emailError.message}`);
            }
        }
        
        console.log(`✅ Partida creada con código: ${code} por ${hostEmail} (54 cartas, 100 tableros 4x4)`);
        res.json({ 
            success: true, 
            message: 'Partida creada correctamente',
            code: code,
            roundId: rounds.length - 1,
            maxPlayers: newRound.maxPlayers,
            maxWinners: newRound.maxWinners,
            maxCards: MAX_CARDS,
            maxBoards: MAX_BOARDS,
            boardSize: BOARD_SIZE,
            autoEndOnWinners: newRound.autoEndOnWinners,
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
            winners: r.winners || [],
            winnerCount: r.winners ? r.winners.length : 0,
            maxWinners: r.maxWinners || 999,
            autoEndOnWinners: r.autoEndOnWinners || false,
            totalCalled: r.calledNumbers ? r.calledNumbers.length : 0,
            currentNumber: r.currentNumber || null,
            maxCards: MAX_CARDS
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
            winners: round.winners || [],
            winnerCount: round.winners ? round.winners.length : 0,
            maxWinners: round.maxWinners || 999,
            autoEndOnWinners: round.autoEndOnWinners || false,
            totalCalled: round.calledNumbers ? round.calledNumbers.length : 0,
            currentNumber: round.currentNumber || null,
            maxCards: MAX_CARDS
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
        round.gameStartTime = new Date();
        
        console.log(`🚀 Partida ${code} iniciada por ${hostEmail} con ${round.players.length} jugadores (Control manual)`);
        res.json({ 
            success: true, 
            message: 'Partida iniciada correctamente',
            playerCount: round.players.length,
            autoEndOnWinners: round.autoEndOnWinners || false
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

// ACTUALIZADO: Endpoint para enviar cartas (1-54) con soporte para trigger
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
        
        if (round.status === 'finished') {
            return res.status(400).json({ error: 'La partida ya ha terminado' });
        }
        
        // ACTUALIZADO: Manejar carta trigger especial (55) para CardDisplayScene
        if (calledCard === TRIGGER_CARD) {
            console.log(`🎯 CARTA TRIGGER (${TRIGGER_CARD}) recibida - Para que CardDisplayScene muestre carta ${MAX_CARDS}`);
            
            round.currentNumber = TRIGGER_CARD; // Trigger especial
            round.lastCardTime = new Date();
            
            if (!round.cardHistory) round.cardHistory = [];
            round.cardHistory.push({
                cardNumber: TRIGGER_CARD,
                timestamp: new Date(),
                hostEmail: hostEmail,
                order: round.calledNumbers.length + 1,
                isTrigger: true,
                description: `Trigger para mostrar carta ${MAX_CARDS} en CardDisplayScene`
            });
            
            console.log(`✅ Trigger ${TRIGGER_CARD} procesado - CardDisplayScene debería mostrar carta ${MAX_CARDS}`);
            
            res.json({ 
                success: true, 
                calledCard: TRIGGER_CARD,
                isTrigger: true,
                triggerFor: MAX_CARDS,
                totalCalled: round.calledNumbers.length,
                calledNumbers: round.calledNumbers,
                currentNumber: TRIGGER_CARD,
                maxCards: MAX_CARDS,
                gameState: round.gameState,
                lastCardTime: round.lastCardTime,
                allCardsCalled: round.calledNumbers.length >= MAX_CARDS,
                winners: round.winners || [],
                winnerCount: round.winners ? round.winners.length : 0
            });
            return;
        }
        
        // ACTUALIZADO: Validar número de carta normal (1-54)
        if (!calledCard || calledCard < 1 || calledCard > MAX_CARDS) {
            return res.status(400).json({ 
                error: `Número de carta inválido (debe ser 1-${MAX_CARDS})` 
            });
        }
        
        // Prevenir cartas duplicadas
        if (round.calledNumbers.includes(calledCard)) {
            console.log(`⚠️  Carta ${calledCard} ya fue llamada en partida ${code}`);
            return res.status(400).json({ 
                error: 'Esta carta ya fue llamada',
                calledCard: calledCard,
                totalCalled: round.calledNumbers.length,
                calledNumbers: round.calledNumbers
            });
        }
        
        // Agregar carta normal
        const now = new Date();
        round.calledNumbers.push(calledCard);
        round.currentNumber = calledCard;
        round.lastCardTime = now;
        
        if (!round.cardHistory) round.cardHistory = [];
        round.cardHistory.push({
            cardNumber: calledCard,
            timestamp: now,
            hostEmail: hostEmail,
            order: round.calledNumbers.length,
            isTrigger: false
        });
        
        // Iniciar automáticamente al llamar primera carta
        if (round.status === 'waiting' && round.calledNumbers.length === 1) {
            round.status = 'active';
            round.gameState = 'playing';
            round.gameStartTime = now;
            console.log(`🚀 Partida ${code} iniciada automáticamente al llamar primera carta`);
        }
        
        // ACTUALIZADO: Marcar como completado cuando se llegue a 54 cartas
        const allCardsCalled = round.calledNumbers.length >= MAX_CARDS;
        if (allCardsCalled && round.gameState !== 'completed') {
            round.gameState = 'completed';
            console.log(`📋 Todas las ${MAX_CARDS} cartas han sido llamadas en partida ${code} - Esperando que el host termine la partida`);
        }
        
        console.log(`✅ Carta ${calledCard} llamada en partida ${code} (${round.calledNumbers.length}/${MAX_CARDS})`);
        
        res.json({ 
            success: true, 
            calledCard: calledCard,
            totalCalled: round.calledNumbers.length,
            calledNumbers: round.calledNumbers,
            currentNumber: round.currentNumber,
            maxCards: MAX_CARDS,
            gameState: round.gameState,
            lastCardTime: round.lastCardTime,
            allCardsCalled: allCardsCalled,
            winners: round.winners || [],
            winnerCount: round.winners ? round.winners.length : 0,
            maxWinners: round.maxWinners || 999,
            autoEndOnWinners: round.autoEndOnWinners || false
        });
        
    } catch (error) {
        console.error('❌ Error calling card:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ACTUALIZADO: Estado del juego con soporte para 54 cartas
router.get('/:code/status', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        const gameStatus = {
            code: round.code,
            status: round.status,
            gameState: round.gameState,
            
            // ACTUALIZADO: Información de cartas para 54 cartas
            calledNumbers: round.calledNumbers || [],
            currentNumber: round.currentNumber || null,
            totalCalled: round.calledNumbers ? round.calledNumbers.length : 0,
            maxNumbers: MAX_CARDS,
            remainingCards: MAX_CARDS - (round.calledNumbers ? round.calledNumbers.length : 0),
            lastCardTime: round.lastCardTime || null,
            
            // Información del trigger
            triggerSent: round.currentNumber === TRIGGER_CARD,
            triggerFor: round.currentNumber === TRIGGER_CARD ? MAX_CARDS : null,
            
            // Información de tiempo
            createdAt: round.createdAt,
            gameStartTime: round.gameStartTime || null,
            gameFinishedTime: round.gameFinishedTime || null,
            
            // Información de jugadores
            playerCount: round.players.length,
            maxPlayers: round.maxPlayers,
            
            // Sistema de ganadores
            winners: round.winners || [],
            winnerCount: round.winners ? round.winners.length : 0,
            maxWinners: round.maxWinners || 999,
            allowMultipleWinners: round.allowMultipleWinners !== false,
            autoEndOnWinners: round.autoEndOnWinners || false,
            
            // Compatibilidad
            winner: round.winners && round.winners.length > 0 ? round.winners[0].playerName : null,
            winnerTime: round.winners && round.winners.length > 0 ? round.winners[0].winnerTime : null,
            winnerData: round.winners && round.winners.length > 0 ? round.winners[0] : null,
            
            // ACTUALIZADO: Estado del juego para 54 cartas
            allCardsCalled: (round.calledNumbers ? round.calledNumbers.length : 0) >= MAX_CARDS,
            canCallMoreCards: (round.calledNumbers ? round.calledNumbers.length : 0) < MAX_CARDS && round.status !== 'finished',
            gameFinished: round.status === 'finished',
            waitingForHostToEnd: round.status === 'active' && round.winners && round.winners.length > 0
        };
        
        // Agregar historial si se solicita
        if (req.query.includeHistory === 'true') {
            gameStatus.cardHistory = round.cardHistory || [];
        }
        
        res.json(gameStatus);
        
    } catch (error) {
        console.error('❌ Error getting game status:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ACTUALIZADO: Verificación de bingo para tableros 4x4
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
        
        console.log(`🎯 Verificación de BINGO de ${playerName} en partida ${code} (tablero 4x4)`);
        
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
        
        // Verificar si este jugador ya ganó
        if (round.winners && round.winners.some(w => w.playerName === playerName)) {
            const existingWinner = round.winners.find(w => w.playerName === playerName);
            return res.status(400).json({ 
                error: 'Ya ganaste en esta partida',
                position: existingWinner.position,
                positionText: getPositionText(existingWinner.position)
            });
        }
        
        // Verificar si el jugador existe en la partida
        const player = round.players.find(p => p.name === playerName);
        if (!player) {
            return res.status(400).json({ 
                error: 'Jugador no encontrado en esta partida'
            });
        }
        
        // ACTUALIZADO: Verificación de bingo para tablero 4x4
        const verification = verifyBingo4x4(markedTiles, playerBoard, round.calledNumbers, {
            playerName: playerName,
            boardId: boardId,
            calledCardsWhenClaimed: calledCardsWhenClaimed
        });
        
        if (verification.valid) {
            // ¡BINGO VÁLIDO! - Agregar como ganador
            
            if (!round.winners) {
                round.winners = [];
            }
            
            const position = round.winners.length + 1;
            const winnerTime = new Date();
            
            const winnerData = {
                playerName: playerName,
                position: position,
                winnerTime: winnerTime,
                boardId: boardId,
                winningBoard: playerBoard,
                markedTiles: markedTiles,
                calledCardsAtWin: round.calledNumbers.slice(),
                totalCardsAtWin: round.calledNumbers.length,
                verificationDetails: verification
            };
            
            round.winners.push(winnerData);
            round.winnerCount = round.winners.length;
            
            console.log(`🏆 Ganador ${position}° lugar: ${playerName} - Partida continúa hasta que el host la termine`);
            
            res.json({ 
                success: true, 
                playerName: playerName,
                position: position,
                positionText: getPositionText(position),
                message: `¡Felicidades! Eres el ${getPositionText(position)} lugar`,
                winners: round.winners.map(w => ({
                    name: w.playerName,
                    position: w.position,
                    positionText: getPositionText(w.position),
                    time: w.winnerTime
                })),
                gameFinished: false,
                waitingForHostToEnd: true,
                totalWinners: round.winners.length,
                gameStillActive: true
            });
            
        } else {
            // BINGO INVÁLIDO
            console.log(`❌ BINGO INVÁLIDO de ${playerName} en partida ${code}: ${verification.reason}`);
            
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

// Endpoint para terminar partida (SOLO el host puede terminar)
router.post('/:code/end', (req, res) => {
    try {
        const { code } = req.params;
        const { hostEmail, reason } = req.body;
        
        console.log(`🛑 Host ${hostEmail} solicitando terminar partida ${code}`);
        
        const round = rounds.find(r => r.code === code);
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (round.hostEmail !== hostEmail) {
            return res.status(403).json({ error: 'Solo el host puede terminar la partida' });
        }
        
        if (round.status === 'finished') {
            return res.status(400).json({ error: 'La partida ya está terminada' });
        }
        
        // TERMINAR PARTIDA
        round.status = 'finished';
        round.gameState = 'ended';
        round.endReason = reason || 'host_ended';
        round.endTime = new Date();
        round.gameFinishedTime = round.endTime;
        
        console.log(`✅ Partida ${code} terminada por el host ${hostEmail}`);
        console.log(`📊 Ganadores finales: ${round.winners ? round.winners.length : 0} jugadores`);
        
        res.json({ 
            success: true, 
            message: 'Partida terminada correctamente por el host',
            endReason: round.endReason,
            endTime: round.endTime,
            winners: round.winners || [],
            totalWinners: round.winners ? round.winners.length : 0,
            gameStats: {
                totalPlayers: round.players.length,
                totalCardsCalled: round.calledNumbers ? round.calledNumbers.length : 0,
                gameDuration: round.gameStartTime ? round.endTime - round.gameStartTime : null
            }
        });
        
    } catch (error) {
        console.error('❌ Error ending round:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener historial detallado de cartas
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
            lastCardTime: round.lastCardTime || null,
            winners: round.winners || [],
            winnerCount: round.winners ? round.winners.length : 0,
            maxCards: MAX_CARDS
        });
        
    } catch (error) {
        console.error('❌ Error getting card history:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener ganadores
router.get('/:code/winners', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        const winners = round.winners || [];
        
        res.json({
            code: round.code,
            winners: winners.map(w => ({
                ...w,
                positionText: getPositionText(w.position)
            })),
            winnerCount: winners.length,
            maxWinners: round.maxWinners || 999,
            gameFinished: round.status === 'finished',
            waitingForHostToEnd: round.status === 'active' && winners.length > 0,
            autoEndOnWinners: round.autoEndOnWinners || false,
            leaderboard: winners.sort((a, b) => a.position - b.position).map(w => ({
                position: w.position,
                positionText: getPositionText(w.position),
                playerName: w.playerName,
                winnerTime: w.winnerTime,
                totalCardsAtWin: w.totalCardsAtWin
            }))
        });
        
    } catch (error) {
        console.error('❌ Error getting winners:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener estado detallado del ganador (compatibilidad)
router.get('/:code/winner', (req, res) => {
    try {
        const { code } = req.params;
        const round = rounds.find(r => r.code === code);
        
        if (!round) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }
        
        if (!round.winners || round.winners.length === 0) {
            return res.status(404).json({ 
                error: 'No hay ganadores aún',
                gameState: round.gameState,
                status: round.status,
                maxWinners: round.maxWinners || 999
            });
        }
        
        const firstWinner = round.winners[0];
        
        res.json({
            winner: firstWinner.playerName,
            winnerTime: firstWinner.winnerTime,
            winnerData: firstWinner,
            gameCode: code,
            totalPlayers: round.players.length,
            gameDuration: firstWinner.winnerTime && round.gameStartTime ? 
                firstWinner.winnerTime - round.gameStartTime : null,
            allWinners: round.winners,
            winnerCount: round.winners.length,
            maxWinners: round.maxWinners || 999,
            isFirstWinner: true,
            position: firstWinner.position,
            positionText: getPositionText(firstWinner.position),
            autoEndOnWinners: round.autoEndOnWinners || false
        });
        
    } catch (error) {
        console.error('❌ Error getting winner info:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// NUEVA FUNCIÓN: Verificar bingo para tableros 4x4
function verifyBingo4x4(markedTiles, playerBoard, calledNumbers, playerData = {}) {
    console.log("=== VERIFICANDO BINGO 4x4 ===");
    console.log("Jugador:", playerData.playerName || "Desconocido");
    console.log("Tablero del jugador:", playerBoard);
    console.log("Tiles marcados:", markedTiles);
    console.log("Cartas llamadas:", calledNumbers);
    
    // ACTUALIZADO: Convertir tablero 4x4 a array plano para comparar con markedTiles
    const boardFlat = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
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
    
    // PASO 2: Verificar que el jugador haya marcado TODAS las casillas (16 para 4x4)
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
    console.log("✅ ¡BINGO VÁLIDO! Todas las verificaciones pasaron (tablero 4x4)");
    return {
        valid: true,
        reason: 'complete_board_4x4',
        message: '¡Felicidades! ¡Ganaste el BINGO!',
        completedAt: new Date(),
        boardNumbers: boardFlat,
        totalCardsInBoard: BOARD_SIZE
    };
}

// Función para obtener texto de posición
function getPositionText(position) {
    switch(position) {
        case 1: return "primer";
        case 2: return "segundo"; 
        case 3: return "tercer";
        case 4: return "cuarto";
        case 5: return "quinto";
        default: return position + "°";
    }
}

module.exports = router;