const runQuery = require('../dbHandler');
const { postCommentQuery, getCommentsQuery, getCommentQuery } = require('../queries/comment');

async function getComment(req, res) { 
    const { comment_id } = req.params;
    runQuery({ res, values: [comment_id], query: getCommentQuery, single: true })
};

async function getComments(req, res) {
    const { post_id } = req.params;
    const { type, comment_id } = req.query || {};
    const values = type === 'replies' ? [post_id, comment_id] : [post_id]
    runQuery({ res, values, query: getCommentsQuery(type) })
}

async function postComment(req, res) {
    const { user_id, post_id, content, type, comment_id } = req.body
    const values = type !== 'reply' ? [post_id, user_id, content] : [post_id, user_id, content, comment_id]
    runQuery({ res, values: values, query: postCommentQuery(type), noResult: true })
};

async function editComment () {};

async function deleteComment () {};

module.exports = {
    getComment,
    postComment,
    editComment,
    deleteComment,
    getComments,
}