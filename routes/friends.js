const express = require('express')
const router = express.Router();

const { 
    getFriends, 
    getFriendGroups, 
    getFriendGroup,
    getRequests,
    getUserFriendIds,
    createCustomGroup,
    editCustomGroup,
    deleteCustomGroup
} = require('../controllers/friend')

router.get('/:user_id', getFriends);
router.get('/id/:user_id', getUserFriendIds)
router.get('/requests/:user_id', getRequests)
router.get('/groups/:user_id', getFriendGroups);
router.get('/group/:group_id', getFriendGroup);
router.post('/group/create', createCustomGroup);
router.put('/group/edit', editCustomGroup);
router.delete('/group/delete', deleteCustomGroup);

module.exports = router;