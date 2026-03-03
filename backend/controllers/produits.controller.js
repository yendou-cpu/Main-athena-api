const pool = require('../config/db');// Importe la configuration de la base de données

// Fonction pour créer un nouveau produit

exports.createProduit = async (req, res) => {
    const {nom, prix, quantite_stock, seuil_alerte} = req.body; // Récupère les données du produit à partir de la requête

    try{
        const result = await pool.query(
            'INSERT INTO produits (nom, prix, quantite_stock, seuil_alerte) VALUES ($1, $2, $3, $4) RETURNING *',
            [nom, prix, quantite_stock, seuil_alerte] // Utilise des paramètres pour éviter les injections SQL
        );
        res.status(201).json(result.rows[0]); // Envoie une réponse avec le produit créé
    } catch(error) {
    console.error("ERREUR SQL :", error.message);  
    res.status(500).json({ error: error.message }); // Renvoie l'erreur réelle au lieu d'un message générique
}
    };
        
// Fonction pour obtenir tous les produits

exports.getAllProduits = async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM produits'); // Exécute une requête pour obtenir tous les produits
        res.json(result.rows); // Envoie une réponse avec la liste des produits
    } catch(error){
        res.status(500).json({ message: error.message }); // Envoie une réponse d'erreur en cas de problème
    }

    }

// Fonction pour mettre à jour un produit existant
exports.updateProduit = async (req, res) => {
    const { id } = req.params; // Récupère l'ID du produit à partir des paramètres de la route
    const { nom, prix, quantite_stock, seuil_alerte } = req.body; // Récupère les données mises à jour du produit à partir de la requête

    try {
        const result = await pool.query(
            'UPDATE produits SET nom = $1, prix = $2, quantite_stock = $3, seuil_alerte = $4 WHERE id = $5 RETURNING *',
            [nom, prix, quantite_stock, seuil_alerte, id] // Utilise des paramètres pour éviter les injections SQL
        );
        res.json(result.rows[0]); // Envoie une réponse avec le produit mis à jour
    } catch(error) {
        res.status(500).json({ message: error.message }); // Envoie une réponse d'erreur en cas de problème
    }


    }

// Fonction pour supprimer un produit
exports.deleteProduit = async (req, res) => {
    const { id } = req.params; // Récupère l'ID du produit à partir des paramètres de la route 
    try {
        await pool.query('DELETE FROM produits WHERE id = $1', [id]); // Exécute une requête pour supprimer le produit avec l'ID spécifié
        res.json({ message: 'Produit supprimé avec succès' }); // Envoie une réponse de succès
    } catch(error) {
        res.status(500).json({ message: error.message }); // Envoie une réponse d'erreur en cas de problème
    }
}

