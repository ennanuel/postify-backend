const express = require('express');
const { removeReaction, addReaction } = require('../controllers/reaction');

const router = express.Router();

router.post('/:id', addReaction);
router.delete('/:id', removeReaction);

module.exports = router