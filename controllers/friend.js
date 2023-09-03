const { Client } = require('pg');
const { 
    getFriendRequestsQuery,
    getFriendSuggestionQuery, 
    sendFriendRequestQuery, 
    addFriendQuery, 
    removeFriendRequestQuery, 
    getFriendsQuery, 
    getSentRequestsQuery, 
    unfriendQuery,
    getCustomGroupsQuery,
    getCustomGroupInfoQuery,
    getCustomGroupFriendsQuery
} = require('../queries/friend');
const runQuery = require('../dbHandler');

// GET FRIENDS

async function getFriends (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getFriendsQuery, values: [user_id] })
};

// FRIEND REQUESTS

async function getReceivedRequests (req, res) {
    const { user_id } = req.params
    runQuery({ res, query: getFriendRequestsQuery, values: [user_id] })
};

// SENT REQUESTS

async function getSentRequests (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getSentRequestsQuery, values: [user_id] })
};

async function getSuggestions (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getFriendSuggestionQuery, values: [user_id] })
};

async function unFriend (req, res) {
    const { user_id, other_user_id } = req.body;
    runQuery({ res, query: unfriendQuery, values: [user_id, other_user_id], noResult: true })
};

async function getFriendGroups (req, res) {
    const { user_id } = req.params;
    runQuery({ res, query: getCustomGroupsQuery, values: [user_id] })
};

async function getFriendGroup (req, res) {
    const { group_id } = req.params;
    runQuery({ res, query: getCustomGroupInfoQuery, values: [group_id], single: true })
};

async function getFriendGroupFriends (req, res) {
    const { group_id } = req.params;
    runQuery({ res, query: getCustomGroupFriendsQuery, values: [group_id] })
};

async function sendFriendRequest (req, res) {
    const { user_id, other_user_id } = req.body
    runQuery({ res, query: sendFriendRequestQuery, values: [user_id, other_user_id], noResult: true })
};

async function acceptFriendRequest (req, res) {
    const { user_id, other_user_id } = req.body
    runQuery({ res, query: addFriendQuery, values: [user_id, other_user_id], noResult: true })
};

async function removeFriendRequest (req, res) {
    const { user_id, other_user_id } = req.body
    runQuery({ res, query: removeFriendRequestQuery, values: [user_id, other_user_id], noResult: true })
};

module.exports = { 
    getFriends, 
    getReceivedRequests, 
    getSentRequests, 
    getSuggestions, 
    getFriendGroups, 
    getFriendGroup,
    getFriendGroupFriends,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendRequest,
    unFriend
}