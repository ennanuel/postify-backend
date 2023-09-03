const { getFeedQuery, createPostQuery, getPostQuery, likePostQuery, unlikePostQuery } = require('../queries/post');
const runQuery = require('../dbHandler');

async function getPost (req, res) {
    const { post_id } = req.params
    const { user_id } = req.query || {}
    runQuery({ res, query: getPostQuery, values: [post_id, user_id], user_id, single: true })
};

async function getFeed (req, res) {
    const { user_id } = req.params;
    runQuery({res, query: getFeedQuery, values: [user_id]});
};

async function uploadPost (req, res) {
    const { user_id, post_desc, group_id } = req.body
    const { type } = req.query || { type: '' }
    const values = type === 'group' ? [user_id, post_desc, group_id] : [user_id, post_desc]
    
    runQuery({res, query: createPostQuery(type), values, noResult: true })
};

async function likePost(req, res) { 
    const { user_id, post_id } = req.body;
    runQuery({ res, query: likePostQuery, values: [user_id, post_id], noResult: true })
};

async function unlikePost(req, res) { 
    const { user_id, post_id } = req.body;
    runQuery({ res, query: unlikePostQuery, values: [user_id, post_id], noResult: true })
};

async function editPost (req, res) {};

async function deletePost (req, res) {};

module.exports = {
    getPost,
    getFeed,
    uploadPost,
    likePost,
    unlikePost,
    editPost,
    deletePost
}