const express = require('express');
const {
    getGroups, 
    getGroup, 
    getGroupMembers, 
    createGroup, 
    editGroup, 
    deleteGroup, 
    getGroupPosts,
    getUserGroupIds,
    getFriendsToInvite,
    addOrRemoveInvite,
    addOrRemoveUser, 
} = require('../controllers/group');
const uploadMiddleware = require('../functions/channel');

const router = express.Router();

router.get('/:user_id', getGroups);
router.get('/id/:user_id', getUserGroupIds);
router.get('/info/:group_id', getGroup);
router.get('/posts/:group_or_user_id', getGroupPosts);
router.get('/members/:group_id/:user_id', getGroupMembers);
router.get('/friends/:group_id', getFriendsToInvite);
router.put('/invite', addOrRemoveInvite);
router.put('/member', addOrRemoveUser);
router.post('/create', uploadMiddleware, createGroup);
router.put('/edit', uploadMiddleware, editGroup);
router.delete('/delete', deleteGroup);

module.exports = router;