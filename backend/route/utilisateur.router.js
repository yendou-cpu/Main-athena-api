const express = require('express'); // Importe Express
const router = express.Router(); // Crée un routeur Express

const utilisateurController = require('../controllers/utilisateur.controller.js'); // Importe le contrôleur utilisateur
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Importe les middlewares JWT

// Routes publiques
router.post('/register', utilisateurController.createUtilisateur); // Créer un nouveau compte
router.post('/login', utilisateurController.loginUtilisateur); // Connexion utilisateur
router.post('/logout', verifyToken, utilisateurController.logout); // Déconnexion (nécessite token)

// Routes protégées (JWT)
router.get('/profile', verifyToken, utilisateurController.getProfile); // Profil de l'utilisateur connecté

// Routes administrateur (JWT + rôle admin)
router.get('/', verifyToken, isAdmin, utilisateurController.getAllUtilisateurs); // Tous les utilisateurs
router.post('/caissier', verifyToken, isAdmin, utilisateurController.createCaissier); // Créer un caissier (admin)

router.put('/:userid', verifyToken, utilisateurController.updateUtilisateur); // Mise à jour d'un utilisateur

router.delete('/:userid', verifyToken, isAdmin, utilisateurController.deleteUtilisateur); // Suppression d'un utilisateur

router.post('/desactiver/:userid', verifyToken, isAdmin, utilisateurController.desactiverUtilisateur); // Désactivation compte

router.post('/activer/:userid', verifyToken, isAdmin, utilisateurController.activerUtilisateur); // Activation compte

module.exports = router; // Exporte le routeur