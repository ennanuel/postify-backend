const express = require('express');
const { getComment, editComment, deleteComment, getComments } = require('../controllers/comment');

const router = express.Router();

router.get('/single/:comment_id', getComment);
router.get('/:post_id', getComments)
router.put('/edit/:id', editComment);
router.delete('/delete/:id', deleteComment);

module.exports = router