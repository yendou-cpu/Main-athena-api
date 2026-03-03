const express = require('express');
const router = express.Router();

const logsController = require('../controllers/logs.controller.js');// Importe le contrôleur pour les logs

// Définit les routes pour les logs
router.get('/', logsController.getAllLogs); // Route pour obtenir tous les logs

module.exports = router; // Exporte le routeur pour l'utiliser dans d'autres parties de l'application