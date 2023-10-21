const postgres = require('../utils/postgres');
const fs = require('fs');
const path = require('path');
const { getGroupsQuery, getMembersQuery, deleteGroupQuery, createGroupQuery, editGroupQuery, getGroupPostsQuery, getGroupInfoQuery, getGroupIdsQuery, getFriendsToInviteQuery, addUserToGroupQuery, removeUserFromGroupQuery, inviteUsertoGroupQuery, removeUserGroupInviteQuery } = require('../queries/group');
const { handleDelete, handleFiles } = require('../functions/group');
const { io } = require('../utils/server');

async function getGroups (req, res) {
    try { 
        const { user_id } = req.params;
        const { fetchType } = req.query;
        const result = await postgres.request({ query: getGroupsQuery(fetchType), values: [user_id] });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function getUserGroupIds(req, res) {
    try {
        const { user_id } = req.params;
        const result = await postgres.request({ query: getGroupIdsQuery, values: [user_id] })
        return res.status(200).json(result[0]);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getGroup(req, res) {
    try {
        const { group_id } = req.params;
        const { type, user_id } = req.query || {};
        const result = await postgres.request({ query: getGroupInfoQuery(type), values: [group_id, user_id] });
        return res.status(200).json(result[0]);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message })
    }
};

async function getGroupPosts (req, res) {
    try { 
        const { group_or_user_id } = req.params;
        const { type, user_id } = req.query;
        const result = await postgres.request({ query: getGroupPostsQuery(type), values: [group_or_user_id, user_id]})
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function getGroupMembers (req, res) {
    try {
        const { group_id, user_id } = req.params;
        const { type } = req.query;
        const result = await postgres.request({ query: getMembersQuery(type), values: [group_id, user_id] });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function getFriendsToInvite (req, res) {
    try {
        const { group_id } = req.params
        const { user_id } = req.query || {}
        const result = await postgres.request({ query: getFriendsToInviteQuery, values: [user_id, group_id] });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function createGroup (req, res) {
    try { 
        const { user_id, name, group_desc, tags, invites, picture, cover } = req.body
        const values = [user_id, name, group_desc, [user_id], tags || [], invites || [], picture, cover]
        await postgres.request({ query: createGroupQuery, values })
        return res.status(200).json({ message: 'Group Created' })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
    };

async function editGroup (req, res) {
    try {
        const { user_id, group_id, name, group_desc, tags, picture, prev_pic, cover, prev_cover } = req.body;
        const [new_picture, new_cover] = await handleFiles([[prev_pic, picture], [prev_cover, cover]]);
        const values = [group_id, user_id, name, group_desc, tags, new_picture, new_cover]
        await postgres.request({ query: editGroupQuery, values });
        return res.status(200).json({ message: 'Group Edited' })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function deleteGroup (req, res) {
    try { 
        const { group_id, user_id } = req.body;
        const [deleted_group] = await postgres.request({ query: deleteGroupQuery, values: [group_id, user_id] });
        if (deleted_group) await handleDelete(deleted_group);
        return res.status(200).json({ message: 'Group Deleted' })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function addOrRemoveInvite(req, res) {
    try {
        const { user_id, group_id, actionType } = req.body;
        const query = actionType === 'add' ? inviteUsertoGroupQuery : removeUserGroupInviteQuery;
        const result = await postgres.request({ query, values: [user_id, group_id] });
        const edittedGroup = result[0];
        if (!edittedGroup) throw new Error('Nothing happened');
        io.emit('group-event', edittedGroup);
        res.status(200).json({ message: 'successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function addOrRemoveUser(req, res) {
    try {
        const { user_id, group_id, actionType } = req.body;
        const query = actionType === 'add' ? addUserToGroupQuery : removeUserFromGroupQuery;
        const result = await postgres.request({ query, values: [user_id, group_id] });
        const edittedGroup = result[0];
        if (!edittedGroup) throw new Error('Nothing happened');
        io.emit('group-event', edittedGroup);
        res.status(200).json({ message: 'successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}


module.exports = {
    getGroups,
    getGroup,
    getGroupPosts,
    getGroupMembers,
    getFriendsToInvite,
    createGroup,
    editGroup,
    deleteGroup,
    addOrRemoveInvite,
    addOrRemoveUser,
    getUserGroupIds
}