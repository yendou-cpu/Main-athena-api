const express = require('express');
const router  = express.Router();

const produitController       = require('../controllers/produits.controller.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

//  top-produits DOIT être avant /:id pour ne pas être capturé comme un id
router.get('/top-produits', verifyToken, produitController.getTopProduits);

// Lecture — accessible au propriétaire ET aux caissiers (verifyToken suffit)
router.get('/',    verifyToken, produitController.getAllProduits);

// Écriture — réservée au propriétaire/admin
router.post('/EnregistreProduit', verifyToken, isAdmin, produitController.createProduit);
router.put('/:id',               verifyToken, isAdmin, produitController.updateProduit);
router.delete('/:id',            verifyToken, isAdmin, produitController.deleteProduit);

module.exports = router;