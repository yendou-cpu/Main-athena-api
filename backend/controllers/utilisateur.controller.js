    const pool = require('../config/db');
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');// Contrôleur pour les utilisateurs


    //  CREATE
    exports.createUtilisateur = async (req, res) => {
        const { nom, prenoms, nom_boutique, numerotel, email, password, role } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await pool.query(
        `INSERT INTO utilisateur 
        (nom, prenoms, nom_boutique, numerotel, email, password, role, actif) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING userid, nom, prenoms, email, role`,
        [nom, prenoms, nom_boutique, numerotel, email, hashedPassword, role || 'admin', true]
    );

            const newUser = result.rows[0];

            // L'admin est sa propre boutique → boutique_id = son propre userid
            if ((role || 'admin').toLowerCase() === 'admin') {
                await pool.query(
                    'UPDATE utilisateur SET boutique_id = $1 WHERE userid = $1',
                    [newUser.userid]
                );
                newUser.boutique_id = newUser.userid;
            }

            res.status(201).json(newUser);

        } catch (error) {
        console.error("ERREUR COMPLETE:", JSON.stringify(error, null, 2));
        res.status(500).json({ 
            message: error.message || "Erreur inconnue",
            detail: error.detail || "",   // Message PostgreSQL détaillé
            code: error.code || ""        // Code erreur PostgreSQL
        });
    }
    };


    exports.loginUtilisateur = async (req, res) => {
        const { email, password } = req.body;

        try {
            const result = await pool.query(
                'SELECT * FROM utilisateur WHERE email = $1 AND actif = true',
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Utilisateur non trouvé ou compte inactif" });
            }

            const user = result.rows[0];
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json({ message: "Mot de passe incorrect" });
            }

            const token = jwt.sign(
                { userid: user.userid, role: user.role, boutique_id: user.boutique_id },
                process.env.JWT_SECRET,
                { expiresIn: "744h" }
            );

            // Optionnel : Enregistrer le log AVANT la réponse
            try {
                const { createLog } = require('./logs.controller');
                await createLog(user.userid, "LOGIN", "Connexion réussie");
            } catch (logError) {
                console.error("Erreur log:", logError.message);
            }

            res.json({
                message: "Connexion réussie",
                token,
                user: {
                    id:           user.userid,
                    nom:          user.nom,
                    prenoms:      user.prenoms,
                    nom_boutique: user.nom_boutique,
                    email:        user.email,
                    numerotel:    user.numerotel,
                    role:         user.role,
                    boutique_id:  user.boutique_id
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    //  GET ALL (Admin seulement)
    exports.getAllUtilisateurs = async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT userid, nom, prenoms, email, numerotel, role, actif, date_creation
                FROM utilisateur
                WHERE boutique_id = $1
                AND userid != $2
                ORDER BY date_creation DESC`,
                [req.user.boutique_id, req.user.userid]
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };


    //  UPDATE
    exports.updateUtilisateur = async (req, res) => {
        const { userid } = req.params;
        const { nom, prenoms, nom_boutique, numerotel, email, role } = req.body;

        try {
            const result = await pool.query(
                `UPDATE utilisateur SET
                nom=$1, prenoms=$2, nom_boutique=$3, numerotel=$4, email=$5, role=$6
                WHERE userid=$7
                RETURNING userid, nom, prenoms, email, role`,
                [nom, prenoms, nom_boutique, numerotel, email, role, userid]
            );

            res.json(result.rows[0]);

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };


    //  DELETE (Admin seulement)
    exports.deleteUtilisateur = async (req, res) => {
        const { userid } = req.params;

        try {
            // Vérifier que l'utilisateur appartient à la boutique de l'admin
            const check = await pool.query(
                'SELECT userid FROM utilisateur WHERE userid=$1 AND boutique_id=$2',
                [userid, req.user.boutique_id]
            );
            if (check.rows.length === 0)
                return res.status(403).json({ message: "Action non autorisée." });

            const result = await pool.query(
                'DELETE FROM utilisateur WHERE userid=$1 RETURNING userid, nom',
                [userid]
            );

            res.json(result.rows[0]);

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    // Désactivation d'un compte
    exports.desactiverUtilisateur = async (req, res) => {
        const { userid } = req.params;
        try {
            await pool.query('UPDATE utilisateur SET actif = false WHERE userid = $1', [userid]);
            res.json({ message: "Compte désactivé" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    // Activation d'un compte
    exports.activerUtilisateur = async (req, res) => {
        const { userid } = req.params;
        try {
            await pool.query('UPDATE utilisateur SET actif = true WHERE userid = $1', [userid]);
            res.json({ message: "Compte activé" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    // Créer un caissier (admin connecté — boutique_id hérité du token)
    exports.createCaissier = async (req, res) => {
        const { nom, prenoms, numerotel, email, password } = req.body;

        if (!nom || !prenoms || !numerotel || !password)
            return res.status(400).json({ message: "Nom, prénoms, téléphone et mot de passe sont obligatoires." });

        try {
            // Récupérer le nom_boutique de l'admin depuis la DB
            const adminRes = await pool.query(
                'SELECT nom_boutique FROM utilisateur WHERE userid = $1',
                [req.user.userid]
            );
            const nom_boutique = adminRes.rows[0]?.nom_boutique || '';

            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await pool.query(
                `INSERT INTO utilisateur
                    (nom, prenoms, nom_boutique, numerotel, email, password, role, actif, boutique_id)
                VALUES ($1,$2,$3,$4,$5,$6,'caissier',true,$7)
                RETURNING userid, nom, prenoms, email, numerotel, role, boutique_id`,
                [nom, prenoms, nom_boutique, numerotel, email || null, hashedPassword, req.user.boutique_id]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            if (error.code === '23505')
                return res.status(409).json({ message: "Email ou téléphone déjà utilisé." });
            res.status(500).json({ message: error.message, detail: error.detail, code: error.code });
        }
    };

    // Déconnexion (Côté client, on supprime juste le token, mais on peut répondre ceci)
    exports.logout = async (req, res) => {
        try {
            const { createLog } = require('./logs.controller');
            // req.user provient de ton middleware verifyToken
            if (req.user) {
                await createLog(req.user.userid, 'LOGOUT', "L'utilisateur s'est déconnecté");
            }
            res.json({ message: "Déconnexion réussie" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };
    // Profil
    exports.getProfile = async (req, res) => {
        res.json({ user: req.user }); // req.user est rempli par ton middleware verifyToken
    };