const express = require('express');
const { getUser, getFullUser, editUserInfo, deleteUser, getUserPosts, getUserFriends, getUserValues } = require('../controllers/user');
const uploadMiddleware = require('../functions/channel');

const router = express.Router();

router.get('/:user_id', getUser);
router.get('/full/:user_id',getFullUser)
router.get('/friends/:user_id', getUserFriends)
router.get('/posts/:user_id', getUserPosts)
router.get('/edit/:user_id', getUserValues);
router.put('/edit',  uploadMiddleware, editUserInfo);
router.delete('/delete', deleteUser);

module.exports = router