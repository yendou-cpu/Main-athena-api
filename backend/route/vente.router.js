const express = require('express');

const router = express.Router();

const venteController =require ('../controller/vente.controller');

router.post('/enregistre', venteController.createVente);// router pour enregistrer une vente

router.get('/liste', venteController.listVentes);// router pour lister les ventes

router.put('/modifier/:id', venteController.updateVente);// router pour modifier une vente

router.delete('/supprimer/:id', venteController.deleteVente);// router pour supprimer une vente

module.exports = router;