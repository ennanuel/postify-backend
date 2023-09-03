const express = require('express');
const { getUser, getFullUser, editUserInfo, deleteUser, getUserPosts, getUserFriends } = require('../controllers/user');

const router = express.Router();

router.get('/:user_id', getUser);
router.get('/full/:user_id', getFullUser)
router.get('/friends/:user_id', getUserFriends)
router.get('/posts/:user_id', getUserPosts)
router.put('/edit/:id', editUserInfo);
router.delete('/delete/:id', deleteUser);

module.exports = router