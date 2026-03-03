const express = require('express');// Importe le framework Express

const cors = require('cors'); // Importe le middleware CORS

require('dotenv').config(); // Charge les variables d'environnement à partir du fichier .env

const produitRoutes = require('./route/produit.routes.js'); // Importe les routes pour les produits
const utilisateurRoutes = require('./route/utilisateur.router.js'); // Importe les routes pour les utilisateurs

const logsRoutes = require('./route/logs.router.js'); // Importe les routes pour les logs

const app = express(); // Crée une instance de l'application Express

app.use(cors()); // Utilise le middleware CORS pour permettre les requêtes cross-origin

app.use(express.json()); // Middleware pour parser les requêtes JSON

app.use('/api/produits', produitRoutes); // Utilise les routes pour les produits sous le chemin /api/produits
app.use('/api/utilisateurs', utilisateurRoutes); // Utilise les routes pour les utilisateurs sous le chemin /api/utilisateurs
app.use('/api/logs', logsRoutes); // Utilise les routes pour les logs sous le chemin /api/logs

const PORT = process.env.PORT || 5000; // Définit le port à partir des variables d'environnement ou utilise 5000 par défaut

const pool = require('./config/db');

pool.connect()
    .then(() => console.log(" Connecté à Supabase"))
    .catch(err => console.error("Erreur connexion:", err));

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`); // Démarre le serveur et affiche un message dans la console
});