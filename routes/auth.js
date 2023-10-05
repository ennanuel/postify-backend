const express = require('express');
const { authMiddleware } = require('../functions/auth');
const { login, register, logout, getUser } = require('../controllers/auth');

const router = express.Router();

router.get('/', authMiddleware, getUser);
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

module.exports = router