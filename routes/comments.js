const express = require('express');
const { getComment, editComment, deleteComment, getComments, likeComment, unlikeComment, postComment, postReply } = require('../controllers/comment');

const router = express.Router();

router.get('/single/:comment_id', getComment);
router.get('/:post_id', getComments);
router.post('/', postComment);
router.post('/reply', postReply);
router.post('/like', likeComment);
router.post('/unlike', unlikeComment);
router.put('/edit', editComment);
router.delete('/delete', deleteComment);

module.exports = router