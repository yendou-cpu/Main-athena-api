    const pool = require('../config/db');
    const { createLog } = require('../controllers/logs.controller.js');

    function getBoutiqueId(req) {
        return req.user.boutique_id ?? req.user.userid;
    }

    // ─── CREATE VENTE ────────────────────────────────────────────────────────────
    exports.createVente = async (req, res) => {
        const client = await pool.connect();
        try {
            const user_id     = req.user.userid;
            const boutique_id = getBoutiqueId(req);
            const { produits } = req.body;

            if (!produits || produits.length === 0)
                return res.status(400).json({ message: "Aucun produit fourni" });

            await client.query("BEGIN");

            let total = 0;

            // Vérifier stock + appartenance boutique + calcul total
            for (const item of produits) {
                const produitResult = await client.query(
                    "SELECT prix, quantite_stock FROM produits WHERE id=$1 AND boutique_id=$2",
                    [item.produit_id, boutique_id]
                );
                if (produitResult.rowCount === 0)
                    throw new Error(`Produit ${item.produit_id} introuvable dans votre boutique`);

                const produit = produitResult.rows[0];
                if (produit.quantite_stock < item.quantite)
                    throw new Error("Stock insuffisant");

                total += produit.prix * item.quantite;
            }

            // Insérer dans ventes (avec boutique_id)
            const venteResult = await client.query(
                "INSERT INTO ventes (total, user_id, boutique_id) VALUES ($1,$2,$3) RETURNING id",
                [total, user_id, boutique_id]
            );
            const venteId = venteResult.rows[0].id;

            // Insérer détails + update stock
            for (const item of produits) {
                const produitResult = await client.query(
                    "SELECT prix FROM produits WHERE id=$1",
                    [item.produit_id]
                );
                const prix = produitResult.rows[0].prix;

                await client.query(
                    `INSERT INTO details_vente (vente_id, produit_id, quantite, prix_unitaire)
                    VALUES ($1,$2,$3,$4)`,
                    [venteId, item.produit_id, item.quantite, prix]
                );

                await client.query(
                    `UPDATE produits SET quantite_stock = quantite_stock - $1
                    WHERE id=$2 AND boutique_id=$3`,
                    [item.quantite, item.produit_id, boutique_id]
                );
            }

            await client.query("COMMIT");
            await createLog(user_id, `VENTE ID ${venteId} - Total ${total}`);

            res.status(201).json({ message: "Vente effectuée avec succès", vente_id: venteId, total });

        } catch (error) {
            await client.query("ROLLBACK");
            res.status(500).json({ message: error.message });
        } finally {
            client.release();
        }
    };

    // ─── GET ALL VENTES (filtrées par boutique + nom du caissier) ────────────────
    exports.getAllVentes = async (req, res) => {
        const boutique_id = getBoutiqueId(req);
        try {
            const result = await pool.query(`
                SELECT
                    v.id,
                    v.date_vente,
                    v.total,
                    v.user_id,
                    v.boutique_id,
                    COALESCE(u.prenoms || ' ' || u.nom, u.nom, 'Inconnu') AS caissier_nom
                FROM ventes v
                LEFT JOIN utilisateur u ON v.user_id = u.userid
                WHERE v.boutique_id = $1
                ORDER BY v.date_vente DESC
            `, [boutique_id]);
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    // ─── GET VENTE DETAILS (vérification boutique) ───────────────────────────────
    exports.getVenteDetails = async (req, res) => {
        const { id } = req.params;
        const boutique_id = getBoutiqueId(req);
        try {
            // Vérifier que la vente appartient à la boutique
            const check = await pool.query(
                "SELECT id FROM ventes WHERE id=$1 AND boutique_id=$2",
                [id, boutique_id]
            );
            if (check.rowCount === 0)
                return res.status(403).json({ message: "Vente introuvable ou accès refusé." });

            const result = await pool.query(
                "SELECT * FROM details_vente WHERE vente_id=$1",
                [id]
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    // ─── DELETE VENTE (vérification boutique) ────────────────────────────────────
    exports.deleteVente = async (req, res) => {
        const { id } = req.params;
        const boutique_id = getBoutiqueId(req);
        try {
            const result = await pool.query(
                "DELETE FROM ventes WHERE id=$1 AND boutique_id=$2 RETURNING id",
                [id, boutique_id]
            );
            if (result.rowCount === 0)
                return res.status(403).json({ message: "Vente introuvable ou accès refusé." });
            res.json({ message: "Vente supprimée" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };