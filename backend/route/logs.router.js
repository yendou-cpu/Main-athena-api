const express = require('express');
const router  = express.Router();

const logsController           = require('../controllers/logs.controller.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', verifyToken, isAdmin, logsController.getAllLogs);

module.exports = router;