const pool = require("express");


exports.getVenteDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                v.id AS vente_id,
                v.date_vente,
                v.total,
                u.nom AS vendeur,
                d.produit_id,
                p.nom AS produit_nom,
                d.quantite,
                d.prix_unitaire
            FROM ventes v
            LEFT JOIN utilisateur u ON v.user_id = u.userid
            LEFT JOIN details_vente d ON v.id = d.vente_id
            LEFT JOIN produits p ON d.produit_id = p.id
            WHERE v.id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Vente non trouvée" });
        }

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};