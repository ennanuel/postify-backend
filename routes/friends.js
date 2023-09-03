const express = require('express')
const router = express.Router();

const { 
    getFriends, 
    getReceivedRequests, 
    getSentRequests, 
    getSuggestions, 
    getFriendGroups, 
    getFriendGroup,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendRequest,
    unFriend,
    getFriendGroupFriends
} = require('../controllers/friend')

router.get('/:user_id', getFriends);
router.get('/received/:user_id', getReceivedRequests);
router.get('/sent/:user_id', getSentRequests);
router.get('/suggestions/:user_id', getSuggestions);
router.get('/groups/:user_id', getFriendGroups);
router.get('/group/:group_id', getFriendGroup);
router.get('/group/friends/:group_id', getFriendGroupFriends);
router.put('/send', sendFriendRequest);
router.put('/accept', acceptFriendRequest);
router.delete('/remove', removeFriendRequest);
router.delete('/unfriend', unFriend)

module.exports = router;