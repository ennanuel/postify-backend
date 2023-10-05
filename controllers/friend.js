const {
    getFriendsQuery, 
    getCustomGroupsQuery,
    getCustomGroupInfoQuery,
    getCustomGroupFriendsQuery,
    getUsersQuery,
    requestQuery,
    friendActionQuery,
    getFriendIdsQuery,
    createCustomGroupQuery,
    editCustomGroupQuery,
    deleteCustomGroupQuery
} = require('../queries/friend');
const postgres = require('../utils/postgres');

// GET FRIENDS
async function getFriends (req, res) {
    try { 
        const { user_id } = req.params;
        const { type } = req.query;
        const result = await postgres.request({ query: getFriendsQuery(type), values: [user_id] });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

// FRIEND REQUESTS SENT AND RECEIVED
async function getRequests (req, res) {
    try {
        const { user_id } = req.params;
        const { type } = req.query;
        const result = await postgres.request({ query: getUsersQuery(type), values: [user_id] });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

// GETS THE IDS OF THE USER'S FRIENDS
async function getUserFriendIds(req, res) {
    try {
        const { user_id } = req.params
        const result = await postgres.request({ query: getFriendIdsQuery, values: [user_id] })
        return res.status(200).json(result[0])
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getFriendGroups(req, res) {
    try {
        const { user_id } = req.params;
        const result = await postgres.request({ query: getCustomGroupsQuery, values: [user_id] })
        return res.status(200).json(result)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function getFriendGroup (req, res) {
    try { 
        const { group_id } = req.params;
        const { type } = req.query;
        const result = await postgres.request({ query: getCustomGroupInfoQuery(type), values: [group_id] });
        return res.status(200).json(result[0]);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function createCustomGroup(req, res) {
    try {
        const { user_id, group_name, users, color } = req.body;
        await postgres.request({ query: createCustomGroupQuery, values: [user_id, group_name, users, color] });
        return res.status(200).json({ message: 'Custom group created' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function editCustomGroup(req, res) {
    try {
        const { group_id, user_id, group_name, users, color } = req.body;
        await postgres.request({ query: editCustomGroupQuery, values: [user_id, group_id, group_name, users, color] });
        return res.status(200).json({ message: 'Custom group edited' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function deleteCustomGroup(req, res) {
    try {
        const { user_id, group_id } = req.body;
        await postgres.request({ query: deleteCustomGroupQuery, values: [user_id, group_id] });
        return res.status(200).json({ message: 'Custom group deleted' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function friendsAction({ type, socket, io, user_id, other_user_id }) {
    const query = type === 'accept' || type === 'unfriend' ?
            friendActionQuery(type) :
            requestQuery(type)
    postgres.socket({ socket, io, query: query, values: [user_id, other_user_id], eventName: 'friend-event', extras: { type } })
};

module.exports = { 
    getFriends, 
    getUserFriendIds,
    getRequests,
    getFriendGroups, 
    getFriendGroup,
    friendsAction,
    createCustomGroup,
    editCustomGroup,
    deleteCustomGroup
}