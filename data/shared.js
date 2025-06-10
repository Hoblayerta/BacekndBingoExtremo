// data/shared.js - Sistema de datos compartidos entre módulos

// Arrays para almacenar datos en memoria
let users = [];
let rounds = [];
let sessions = [];

// Funciones para usuarios
function addUser(user) {
    users.push(user);
    return user;
}

function getUserByEmail(email) {
    return users.find(u => u.email === email);
}

function getUserIndex(email) {
    return users.findIndex(u => u.email === email);
}

function updateUser(email, updates) {
    const userIndex = getUserIndex(email);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        return users[userIndex];
    }
    return null;
}

function getAllUsers() {
    return users;
}

// Funciones para partidas/rounds
function addRound(round) {
    rounds.push(round);
    return round;
}

function getRoundByCode(code) {
    return rounds.find(r => r.code === code);
}

function getRoundIndex(code) {
    return rounds.findIndex(r => r.code === code);
}

function updateRound(code, updates) {
    const roundIndex = getRoundIndex(code);
    if (roundIndex !== -1) {
        rounds[roundIndex] = { ...rounds[roundIndex], ...updates };
        return rounds[roundIndex];
    }
    return null;
}

function getAllRounds() {
    return rounds;
}

function getRoundsByHost(hostEmail) {
    return rounds.filter(r => r.hostEmail === hostEmail);
}

// Funciones para sesiones
function addSession(session) {
    sessions.push(session);
    return session;
}

function getSessionByCode(code) {
    return sessions.find(s => s.code === code);
}

function getAllSessions() {
    return sessions;
}

// Funciones de utilidad
function clearAllData() {
    users.length = 0;
    rounds.length = 0;
    sessions.length = 0;
    console.log('📧 Todos los datos han sido limpiados');
}

function getStats() {
    return {
        totalUsers: users.length,
        verifiedUsers: users.filter(u => u.verified).length,
        usersWithConsent: users.filter(u => u.emailConsent).length,
        totalRounds: rounds.length,
        activeRounds: rounds.filter(r => r.status === 'active').length,
        finishedRounds: rounds.filter(r => r.status === 'finished').length,
        totalSessions: sessions.length
    };
}

// Exportar todas las funciones y datos
module.exports = {
    // Datos directos (para compatibilidad)
    users,
    rounds,
    sessions,
    
    // Funciones para usuarios
    addUser,
    getUserByEmail,
    getUserIndex,
    updateUser,
    getAllUsers,
    
    // Funciones para rounds
    addRound,
    getRoundByCode,
    getRoundIndex,
    updateRound,
    getAllRounds,
    getRoundsByHost,
    
    // Funciones para sesiones
    addSession,
    getSessionByCode,
    getAllSessions,
    
    // Utilidades
    clearAllData,
    getStats
};
