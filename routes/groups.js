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
} = require('../controllers/group');
const uploadMiddleware = require('../functions/channel');

const router = express.Router();

router.get('/:user_id', getGroups);
router.get('/id/:user_id', getUserGroupIds);
router.get('/info/:group_id', getGroup);
router.get('/posts/:group_id', getGroupPosts);
router.get('/members/:group_id', getGroupMembers);
router.post('/create', uploadMiddleware, createGroup);
router.put('/edit', uploadMiddleware, editGroup);
router.delete('/delete', deleteGroup);

module.exports = router;