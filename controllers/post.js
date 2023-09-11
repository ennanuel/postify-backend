const { getFeedQuery, createPostQuery, getPostQuery, likePostQuery, unlikePostQuery } = require('../queries/post');
const runQuery = require('../dbHandler');

async function getPost (req, res) {
    const { post_id } = req.params
    const { user_id } = req.query || {}
    runQuery.request({ res, query: getPostQuery, values: [post_id, user_id], user_id, single: true })
};

async function getFeed (req, res) {
    const { user_id } = req.params;
    runQuery.request({res, query: getFeedQuery, values: [user_id]});
};

async function uploadPost (req, res) {
    const { user_id, post_desc, group_id } = req.body
    const { type } = req.query || { type: '' }
    const values = type === 'group' ? [user_id, post_desc, group_id] : [user_id, post_desc]
    
    runQuery.request({res, query: createPostQuery(type), values, noResult: true })
};

async function editPost (req, res) {};

async function deletePost(req, res) { };

async function likePostSocket({ user_id, post_id, socket, io, type }) { 
    const query = type === 'add' ? likePostQuery : unlikePostQuery
    runQuery.socket({ socket, io, query: query, values: [user_id, post_id], eventName: 'someone-liked', extras: { type }})
};

module.exports = {
    getPost,
    getFeed,
    uploadPost,
    editPost,
    deletePost,
    likePostSocket
}