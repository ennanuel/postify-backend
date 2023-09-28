const postgres = require('../utils/postgres');
const fs = require('fs');
const path = require('path');
const { getGroupsQuery, getMembersQuery, addOrRemoveMemberQuery, deleteGroupQuery, createGroupQuery, editGroupQuery, addOrRemoveInviteQuery, getGroupPostsQuery, getGroupInfoQuery, getGroupIdsQuery } = require('../queries/group');
const { handleDelete, handleFiles } = require('../functions/group');

async function getGroups (req, res) {
    try { 
        const { user_id } = req.params;
        const { type } = req.query || {};
        const result = await postgres.request({ query: getGroupsQuery(type), values: [user_id] });
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
        const { group_id } = req.params;
        const { type, user_id } = req.query || {};
        const result = await postgres.request({ query: getGroupPostsQuery(type), values: [group_id, user_id]})
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function getGroupMembers (req, res) {
    try {
        const { group_id } = req.params
        const { type } = req.query || {}
        const result = await postgres.request({ query: getMembersQuery(type), values: [group_id] });
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
        const deleted_group = await postgres.request({ query: deleteGroupQuery, values: [group_id, user_id] });
        if (deleted_group?.length > 0) await handleDelete(deleted_group[0]);
        return res.status(200).json({ message: 'Group Deleted' })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function memberActions({ socket, io, user_id, group_id, type }) {
    const query = type === 'add' || type === 'remove' ?
        addOrRemoveMemberQuery(type)  :
        addOrRemoveInviteQuery(type)
    postgres.socket({ socket, io, query, values: [user_id, group_id], eventName: 'group-event', extras: { user_id, group_id, type }})
}


module.exports = {
    getGroups,
    getGroup,
    getGroupPosts,
    getGroupMembers,
    createGroup,
    editGroup,
    deleteGroup,
    memberActions,
    getUserGroupIds
}