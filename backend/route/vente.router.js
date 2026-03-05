const express = require('express');

const router = express.Router();
const venteController = require('../controllers/vente.controller.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Route création vente
router.post('/enregistre', verifyToken, venteController.createVente); // <-- espace supprimé

// Route GET toutes ventes (admin)
router.get('/', verifyToken, isAdmin, venteController.getAllVentes);

// Route GET détails vente
router.get('/:id', verifyToken, venteController.getVenteDetails);

// Route DELETE vente (admin)
router.delete('/:id', verifyToken, isAdmin, venteController.deleteVente);

module.exports = router;