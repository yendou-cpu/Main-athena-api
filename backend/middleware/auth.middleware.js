const jwt = require('jsonwebtoken');// importe le module jsonwebtoken pour gérer les tokens JWT

// Middleware pour vérifier le token JWT
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;// Récupère le token depuis les en-têtes de la requête

    if (!authHeader) {
        return res.status(403).json({ message: "Token manquant" });
    }

    const token = authHeader.split(" ")[1];// Extrait le token de la chaîne "Bearer <token>"

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);// Vérifie le token et décode les informations qu'il contient
        req.user = decoded;
        next();// Passe au middleware suivant ou à la route
    } catch (error) {
        res.status(401).json({ message: "Token invalide" });
    }
};

// Middleware pour vérifier si l'utilisateur est admin
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Accès refusé (Admin seulement)" });// Vérifie si le rôle de l'utilisateur est "admin"
    }
    next();
};