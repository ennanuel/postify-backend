const {
    getFriendsQuery, 
    getCustomGroupsQuery,
    getCustomGroupInfoQuery,
    getCustomGroupFriendsQuery,
    getUsersQuery,
    getFriendIdsQuery,
    createCustomGroupQuery,
    editCustomGroupQuery,
    deleteCustomGroupQuery,
    unFriendQuery,
    addFriendQuery,
    sendRequestQuery,
    removeRequestQuery
} = require('../queries/friend');
const postgres = require('../utils/postgres');
const { io } = require('../utils/server');

// GET FRIENDS
async function getFriends(req, res) {
    try {
        const { user_id } = req.params;
        const { type } = req.query;
        const query = type === 'custom' ? getCustomGroupFriendsQuery : getFriendsQuery;
        const result = await postgres.request({ query, values: [user_id] });
        return res.status(200).json(result);
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message });
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
        await postgres.request({ query: editCustomGroupQuery, values: [group_id, user_id, group_name, users, color] });
        return res.status(200).json({ message: 'Custom group edited' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function deleteCustomGroup(req, res) {
    try {
        const { user_id, group_id } = req.body;
        await postgres.request({ query: deleteCustomGroupQuery, values: [group_id, user_id] });
        return res.status(200).json({ message: 'Custom group deleted' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function addOrRemoveFriend(req, res) {
    try {
        const { user_id, other_user_id, actionType } = req.body;
        const query = actionType === 'add' ? unFriendQuery : addFriendQuery;
        const result = await postgres.request({ query, values: [user_id, other_user_id] });
        const users = result[0];
        if (!users) throw Error('Nothing happened');
        io.emit('friend-event', { ...users, actionType });
        res.status(200).json({ message: 'successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

async function addOrRemoveFriendRequest(req, res) {
    try {
        const { user_id, other_user_id, actionType } = req.body;
        const query = actionType === 'add' ? sendRequestQuery : removeRequestQuery;
        const result = await postgres.request({ query, values: [user_id, other_user_id] });
        const users = result[0];
        if (!users) throw Error('Nothing happened');
        io.emit('friend-event', { ...users, actionType });
        res.status(200).json({ message: 'successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = { 
    getFriends, 
    getUserFriendIds,
    getRequests,
    getFriendGroups, 
    getFriendGroup,
    addOrRemoveFriend,
    addOrRemoveFriendRequest,
    createCustomGroup,
    editCustomGroup,
    deleteCustomGroup
}