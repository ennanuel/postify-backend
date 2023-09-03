const express = require('express');
const {
    getGroups, 
    getGroup, 
    getGroupMembers, 
    createGroup, 
    editGroup, 
    deleteGroup, 
    getGroupsPosts,
    getGroupPosts, 
    addMember, 
    removeMember, 
    getJoinedGroups,
    getCreatedGroups,
    inviteMember,
    getGroupInvitedMembers,
    removeInvite,
    getInvitedGroups
} = require('../controllers/group');

const router = express.Router();

router.get('/:user_id', getGroups);
router.get('/joined/:user_id', getJoinedGroups);
router.get('/created/:user_id', getCreatedGroups);
router.get('/info/:group_id', getGroup);
router.get('/feed/:user_id', getGroupsPosts);
router.get('/posts/:group_id', getGroupPosts);
router.get('/members/:group_id', getGroupMembers);
router.get('/members/invites/:group_id', getGroupInvitedMembers)
router.get('/invites/:user_id', getInvitedGroups)
router.post('/create', createGroup);
router.put('/join', addMember);
router.put('/invite/add', inviteMember);
router.put('/edit', editGroup);
router.delete('/invite/remove', removeInvite);
router.delete('/leave', removeMember);
router.delete('/delete', deleteGroup);

module.exports = router;