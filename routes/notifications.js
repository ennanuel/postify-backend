const express = require('express');
const { getNotifications, removeNotification, editNotification } = require('../controllers/notification');

const router = express.Router();

router.get('/', getNotifications);
router.put('/edit/:id', editNotification);
router.delete('/delete/:id', removeNotification);

module.exports = router