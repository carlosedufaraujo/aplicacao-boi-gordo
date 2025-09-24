/**
 * Roteador principal para /api/v1/*
 * Redireciona todas as requisições para o handler principal
 */

const handler = require('./index.js');

module.exports = handler;