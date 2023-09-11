const runQuery = require('../dbHandler');
const { getGroupsQuery, getMembersQuery, addOrRemoveMemberQuery, deleteGroupQuery, createGroupQuery, editGroupQuery, addOrRemoveInviteQuery, getGroupPostsQuery, getGroupInfoQuery, getGroupIdsQuery } = require('../queries/group');

async function getGroups (req, res) {
    const { user_id } = req.params;
    const { type } = req.query || {};
    runQuery.request({ res, query: getGroupsQuery(type), values: [user_id] });
};

async function getUserGroupIds(req, res) {
    const { user_id } = req.params;
    runQuery.request({ res, query: getGroupIdsQuery, values: [user_id] })
}

async function getGroup (req, res) {
    const { group_id } = req.params;
    const { type, user_id } = req.query || {};
    console.log(group_id, user_id);
    runQuery.request({ res, query: getGroupInfoQuery(type), values: [group_id, user_id], single: true })
};

async function getGroupPosts (req, res) {
    const { group_id } = req.params;
    const { type } = req.query || {};
    runQuery.request({ res, query: getGroupPostsQuery(type), values: [group_id]})
};

async function getGroupMembers (req, res) {
    const { group_id } = req.params
    const { type } = req.query || {}
    runQuery.request({ res, query: getMembersQuery(type), values: [group_id] })
};

async function createGroup (req, res) {
    const { user_id, group_name, group_desc, tags, invites } = req.body
    const group_tags = `{${tags.join(', ')}}`
    const group_invites = `{${invites.join(', ')}}`
    runQuery.request({ res, query: createGroupQuery, values: [user_id, group_name, group_desc, `{${user_id}}`, group_tags, group_invites],  noResult: true })
};

async function editGroup (req, res) {
    const { group_id, group_name, group_desc, tags } = req.body
    const group_tags = `${tags.map( tag => `"${tag}"`).join(', ')}`
    runQuery.request({ res, query: editGroupQuery, values: [group_id, group_name, group_desc, group_tags], noResult: true })
};

async function deleteGroup (req, res) {
    const { group_id } = req.body;
    runQuery.request({ res, query: deleteGroupQuery, values: [group_id], noResult: true })
};

async function memberActions({ socket, io, user_id, group_id, type }) {
    const query = type === 'add' || type === 'remove' ?
        addOrRemoveMemberQuery(type)  :
        addOrRemoveInviteQuery(type)
    runQuery.socket({ socket, io, query, values: [user_id, group_id], eventName: 'group-event', extras: { user_id, group_id, type }})
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