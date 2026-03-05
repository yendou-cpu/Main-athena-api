const pool = require('../config/db');
const { createLog } = require('../controllers/logs.controller.js');

exports.createVente = async (req, res) => {
    const client = await pool.connect();

    try {
        const user_id = req.user.userid; // sécurisé via JWT
        const { produits } = req.body;

        if (!produits || produits.length === 0) {
            return res.status(400).json({ message: "Aucun produit fourni" });
        }

        await client.query("BEGIN");

        let total = 0;

        // Vérifier stock + calcul total
        for (const item of produits) {
            const produitResult = await client.query(
                "SELECT prix, quantite_stock FROM produits WHERE id = $1",
                [item.produit_id]
            );

            if (produitResult.rowCount === 0) {
                throw new Error("Produit non trouvé");
            }

            const produit = produitResult.rows[0];

            if (produit.quantite_stock < item.quantite) {
                throw new Error("Stock insuffisant");
            }

            total += produit.prix * item.quantite;
        }

        //  Insérer dans ventes
        const venteResult = await client.query(
            "INSERT INTO ventes (total, user_id) VALUES ($1, $2) RETURNING id",
            [total, user_id]
        );

        const venteId = venteResult.rows[0].id;

        //  Insérer détails + update stock
        for (const item of produits) {
            const produitResult = await client.query(
                "SELECT prix FROM produits WHERE id = $1",
                [item.produit_id]
            );

            const prix = produitResult.rows[0].prix;

            await client.query(
                `INSERT INTO details_vente 
                (vente_id, produit_id, quantite, prix_unitaire)
                VALUES ($1, $2, $3, $4)`,
                [venteId, item.produit_id, item.quantite, prix]
            );

            await client.query(
                `UPDATE produits
                SET quantite_stock = quantite_stock - $1
                WHERE id = $2`,
                [item.quantite, item.produit_id]
            );
        }

        await client.query("COMMIT");

        //  Log automatique
        await createLog(user_id, `VENTE ID ${venteId} - Total ${total}`);

        res.status(201).json({
            message: "Vente effectuée avec succès",
            vente_id: venteId,
            total
        });

    } catch (error) {
        await client.query("ROLLBACK");
        res.status(500).json({ message: error.message });
    } finally {
        client.release();
    }
};



exports.getAllVentes = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ventes ORDER BY date_vente DESC");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getVenteDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM details_vente WHERE vente_id = $1", [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteVente = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM ventes WHERE id = $1", [id]);
        res.json({ message: "Vente supprimée" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};