const express = require('express');
const { getPost, getFeed, uploadPost, editPost, deletePost, watchPost } = require('../controllers/post');
const uploadMiddleware = require('../functions/post');
const { multerConfig, bucket } = require('../functions/post')

const router = express.Router();

router.get('/feed/:user_id', getFeed);
router.get('/:post_id', getPost);
router.post('/create', uploadMiddleware, uploadPost);
router.put('/edit', uploadMiddleware, editPost);
router.put('/watch', watchPost);
router.delete('/delete', deletePost);

module.exports = router