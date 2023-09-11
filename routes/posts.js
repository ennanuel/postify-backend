const express = require('express');
const { getPost, getFeed, uploadPost, editPost, deletePost } = require('../controllers/post');

const router = express.Router();

router.get('/feed/:user_id', getFeed);
router.get('/:post_id', getPost);
router.post('/create', uploadPost);
router.put('/edit/:post_id', editPost);
router.delete('/delete/:post_id', deletePost);

module.exports = router