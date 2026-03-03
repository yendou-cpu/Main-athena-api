const express = require('express');// Importe le framework Express
const router = express.Router(); // Crée un routeur Express

const produitController = require('../controllers/produits.controller.js'); // Importe le contrôleur pour les produits

// Définit les routes pour les produits
router.post('/EnregistreProduit', produitController.createProduit); // Route pour créer un nouveau produit

router.get('/', produitController.getAllProduits); // Route pour obtenir tous les produits

router.put('/:id', produitController.updateProduit); // Route pour mettre à jour un produit existant

router.delete('/:id', produitController.deleteProduit); // Route pour supprimer un produit



module.exports =router; // Exporte le routeur pour l'utiliser dans d'autres parties de l'application