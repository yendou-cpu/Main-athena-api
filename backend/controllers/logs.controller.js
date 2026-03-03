const pool = require('../config/db.js');

// 1. Fonction pour récupérer tous les logs (Celle qui manque !)
const getAllLogs = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM logs ORDER BY date DESC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// fonction pour créer ou enregistrer un log 
const createLog = async (userId, action,  details) => {
    try {
        await pool.query(
            `INSERT INTO logs (user_id, action , details) VALUES ($1, $2, $3)`,
            [userId, action, details]
        );
    } catch (error) {
        console.error("Erreur log:", error.message);
    }
};

// 3. On exporte les DEUX fonctions
module.exports = {
    createLog,
    getAllLogs
};