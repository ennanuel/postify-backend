const runQuery = require('../dbHandler');
const { getGroupsQuery, getMembersQuery, addOrRemoveMemberQuery, deleteGroupQuery, createGroupQuery, editGroupQuery, addOrRemoveInviteQuery, getGroupPostsQuery, getGroupInfoQuery } = require('../queries/group');

async function getJoinedGroups (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getGroupsQuery('joined'), values: [user_id] });
};

async function getCreatedGroups (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getGroupsQuery('created'), values: [user_id] });
};

async function getInvitedGroups (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getGroupsQuery('invites'), values: [user_id] });
}

async function getGroups (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getGroupsQuery(), values: [user_id] });
};

async function getGroup (req, res) {
    const { group_id } = req.params;
    const { type } = req.query;
    runQuery({ res, query: getGroupInfoQuery(type), values: [group_id], single: true })
};

async function getGroupsPosts (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getGroupPostsQuery('all'), values: [user_id] })
}

async function getGroupPosts (req, res) {
    const { group_id } = req.params;
    const { type } = req.query
    runQuery({ res, query: getGroupPostsQuery(type), values: [group_id]})
};

async function getGroupMembers (req, res) {
    const { group_id } = req.params
    runQuery({ res, query: getMembersQuery(), values: [group_id] })
};

async function getGroupInvitedMembers (req, res) {
    const { group_id } = req.params
    runQuery({ res, query: getMembersQuery('invites'), values: [group_id] })
};

async function createGroup (req, res) {
    const { user_id, group_name, group_desc, tags, invites } = req.body
    const group_tags = `{${tags.join(', ')}}`
    const group_invites = `{${invites.join(', ')}}`
    runQuery({ res, query: createGroupQuery, values: [user_id, group_name, group_desc, `{${user_id}}`, group_tags, group_invites],  noResult: true })
};

async function editGroup (req, res) {
    const { group_id, group_name, group_desc, tags } = req.body
    const group_tags = `${tags.map( tag => `"${tag}"`).join(', ')}`
    runQuery({ res, query: editGroupQuery, values: [group_id, group_name, group_desc, group_tags], noResult: true })
};

async function deleteGroup (req, res) {
    const { group_id } = req.body;
    runQuery({ res, query: deleteGroupQuery, values: [group_id], noResult: true })
};

async function addMember (req, res) {
    const { group_id, user_id } = req.body;
    runQuery({ res, query: addOrRemoveMemberQuery('add'), values: [group_id, user_id], noResult: true })
};

async function inviteMember (req, res) {
    const { group_id, user_id } = req.body;
    runQuery({ res, query: addOrRemoveInviteQuery('add'), values: [group_id, user_id], noResult: true })
}

async function removeInvite (req, res) {
    const { group_id, user_id } = req.body;
    runQuery({ res, query: addOrRemoveInviteQuery(), values: [group_id, user_id], noResult: true })
}

async function removeMember (req, res) {
    const { group_id, user_id } = req.body;
    runQuery({ res, query: addOrRemoveMemberQuery(), values: [group_id, user_id], noResult: true });
};


module.exports = {
    getGroups,
    getJoinedGroups,
    getInvitedGroups,
    getCreatedGroups,
    getGroup,
    getGroupsPosts,
    getGroupPosts,
    getGroupMembers,
    getGroupInvitedMembers,
    createGroup,
    editGroup,
    deleteGroup,
    addMember,
    inviteMember,
    removeInvite,
    removeMember,
}