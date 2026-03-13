    const pool = require('../config/db');

    
    function getBoutiqueId(req) {
        return req.user.boutique_id ?? req.user.userid;
    }

    // ─── CREATE ─────────────────────────────────────────────────────────────────
    exports.createProduit = async (req, res) => {
        const { nom, prix, quantite_stock, seuil_alerte } = req.body;
        const boutique_id = getBoutiqueId(req);

        try {
            const result = await pool.query(
                `INSERT INTO produits (nom, prix, quantite_stock, seuil_alerte, boutique_id)
                VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [nom, prix, quantite_stock, seuil_alerte, boutique_id]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error("ERREUR SQL :", error.message);
            res.status(500).json({ error: error.message, detail: error.detail, code: error.code });
        }
    };

    // ─── GET ALL (filtrés par boutique) ─────────────────────────────────────────
    exports.getAllProduits = async (req, res) => {
        const boutique_id = getBoutiqueId(req);
        try {
            const result = await pool.query(
                'SELECT * FROM produits WHERE boutique_id = $1 ORDER BY nom',
                [boutique_id]
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    // ─── TOP PRODUITS (filtrés par boutique) ────────────────────────────────────
    exports.getTopProduits = async (req, res) => {
        const boutique_id = getBoutiqueId(req);
        try {
            const result = await pool.query(`
                SELECT
                    p.id,
                    p.nom,
                    COALESCE(SUM(dv.quantite), 0) AS ventes
                FROM produits p
                LEFT JOIN details_vente dv ON p.id = dv.produit_id
                WHERE p.boutique_id = $1
                GROUP BY p.id, p.nom
                ORDER BY ventes DESC
                LIMIT 5
            `, [boutique_id]);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    };

    // ─── UPDATE (vérification boutique) ─────────────────────────────────────────
    exports.updateProduit = async (req, res) => {
        const { id } = req.params;
        const { nom, prix, quantite_stock, seuil_alerte } = req.body;
        const boutique_id = getBoutiqueId(req);

        try {
            const result = await pool.query(
                `UPDATE produits
                SET nom=$1, prix=$2, quantite_stock=$3, seuil_alerte=$4
                WHERE id=$5 AND boutique_id=$6
                RETURNING *`,
                [nom, prix, quantite_stock, seuil_alerte, id, boutique_id]
            );
            if (result.rowCount === 0)
                return res.status(403).json({ message: "Produit introuvable ou accès refusé." });
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    // ─── DELETE (vérification boutique) ─────────────────────────────────────────
    exports.deleteProduit = async (req, res) => {
        const { id } = req.params;
        const boutique_id = getBoutiqueId(req);

        try {
            const result = await pool.query(
                'DELETE FROM produits WHERE id=$1 AND boutique_id=$2 RETURNING id',
                [id, boutique_id]
            );
            if (result.rowCount === 0)
                return res.status(403).json({ message: "Produit introuvable ou accès refusé." });
            res.json({ message: 'Produit supprimé avec succès' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };