const {
    getFriendsQuery, 
    getCustomGroupsQuery,
    getCustomGroupInfoQuery,
    getCustomGroupFriendsQuery,
    getUsersQuery,
    requestQuery,
    friendActionQuery,
    getFriendIdsQuery
} = require('../queries/friend');
const runQuery = require('../dbHandler');

// GET FRIENDS

async function getFriends (req, res) {
    const { user_id } = req.params;
    runQuery.request({ res, query: getFriendsQuery, values: [user_id] })
};

// FRIEND REQUESTS SENT AND RECEIVED

async function getRequests (req, res) {
    const { user_id } = req.params
    const { type } = req.query || {};
    runQuery.request({ res, query: getUsersQuery(type), values: [user_id] })
};

async function getUserFriendIds(req, res) {
    const { user_id } = req.params
    runQuery.request({ res, query: getFriendIdsQuery, values: [user_id], single: true })
}

async function getFriendGroups (req, res) {
    const { user_id } = req.params;
    runQuery.request({ res, query: getCustomGroupsQuery, values: [user_id] })
};

async function getFriendGroup (req, res) {
    const { group_id } = req.params;
    runQuery.request({ res, query: getCustomGroupInfoQuery, values: [group_id], single: true })
};

async function getFriendGroupFriends (req, res) {
    const { group_id } = req.params;
    runQuery.request({ res, query: getCustomGroupFriendsQuery, values: [group_id] })
};

async function friendsAction({ type, socket, io, user_id, other_user_id }) {
    const query = type === 'accept' || type === 'unfriend' ?
            friendActionQuery(type) :
            requestQuery(type)
    runQuery.socket({ socket, io, query: query, values: [user_id, other_user_id], eventName: 'friend-event', extras: { type } })
};

module.exports = { 
    getFriends, 
    getUserFriendIds,
    getRequests,
    getFriendGroups, 
    getFriendGroup,
    getFriendGroupFriends,
    friendsAction,
}