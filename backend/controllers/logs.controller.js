const pool = require('../config/db.js');

// Récupérer tous les logs de la boutique (filtrés par boutique_id)
const getAllLogs = async (req, res) => {
    const boutique_id = req.user.boutique_id ?? req.user.userid;
    try {
        const result = await pool.query(`
            SELECT
                l.id,
                l.action,
                l.details,
                l.date,
                l.user_id,
                COALESCE(u.prenoms || ' ' || u.nom, u.nom, 'Système') AS utilisateur_nom,
                u.role AS utilisateur_role
            FROM logs l
            LEFT JOIN utilisateur u ON l.user_id = u.userid
            WHERE l.boutique_id = $1
            ORDER BY l.date DESC
            LIMIT 500
        `, [boutique_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Créer un log (usage interne — injecte boutique_id automatiquement)
const createLog = async (userId, action, details) => {
    try {
        // Récupérer le boutique_id de l'utilisateur
        const userRes = await pool.query(
            'SELECT boutique_id FROM utilisateur WHERE userid = $1',
            [userId]
        );
        const boutique_id = userRes.rows[0]?.boutique_id ?? null;

        await pool.query(
            `INSERT INTO logs (user_id, action, details, boutique_id) VALUES ($1, $2, $3, $4)`,
            [userId, action, details, boutique_id]
        );
    } catch (error) {
        console.error("Erreur log:", error.message);
    }
};

module.exports = { createLog, getAllLogs };