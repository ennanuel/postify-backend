const express = require('express')
const router = express.Router();

const { 
    getFriends, 
    getFriendGroups, 
    getFriendGroup,
    getFriendGroupFriends,
    getRequests,
    getUserFriendIds
} = require('../controllers/friend')

router.get('/:user_id', getFriends);
router.get('/id/:user_id', getUserFriendIds)
router.get('/requests/:user_id', getRequests)
router.get('/groups/:user_id', getFriendGroups);
router.get('/group/:group_id', getFriendGroup);
router.get('/group/friends/:group_id', getFriendGroupFriends);

module.exports = router;