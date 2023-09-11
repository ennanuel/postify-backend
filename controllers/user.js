const runQuery = require("../dbHandler");
const { getUserQuery, getFullUserQuery, getUserPostsQuery, getUserFriendsQuery } = require('../queries/user')

async function getUser(req, res) {
    const { user_id } = req.params;
    const { other_user } = req.query;
    runQuery.request({ res, query: getUserQuery, values: [user_id, other_user], single: true })
};

async function getFullUser (req, res) {
    const { user_id } = req.params;
    const { other_user } = req.query;
    runQuery.request({ res, query: getFullUserQuery, values: [user_id, other_user], single: true })
}

async function getUserFriends (req, res) {
    const { user_id } = req.params;
    const { other_user } = req.query;
    runQuery.request({ res, query: getUserFriendsQuery, values: [user_id, other_user] })
}

async function getUserPosts (req, res) {
    const { user_id } = req.params;
    const { other_user, type } = req.query;
    runQuery.request({ res, query: getUserPostsQuery(type), values: [user_id, other_user] })
}

async function editUserInfo () {};

async function deleteUser () {};

module.exports = {
    getUser,
    getFullUser,
    getUserFriends,
    getUserPosts,
    editUserInfo,
    deleteUser
}