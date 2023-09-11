const runQuery = require('../dbHandler');
const { postCommentQuery, getCommentsQuery, getCommentQuery, likeCommentQuery, unlikeCommentQuery } = require('../queries/comment');

async function getComment(req, res) { 
    const { comment_id } = req.params;
    const { user_id } = req.query || {};
    runQuery.request({ res, values: [comment_id, user_id], query: getCommentQuery, single: true })
};

async function getComments(req, res) {
    const { post_id } = req.params;
    const { type, comment_id, user_id } = req.query || {};
    const values = type === 'replies' ? [post_id, user_id, comment_id] : [post_id, user_id]
    runQuery.request({ res, values, query: getCommentsQuery(type) })
}

async function postCommentSocket({ user_id, post_id, content, type, comment_id, io, socket }) {
    const values = type !== 'reply' ?
        [post_id, user_id, content] :
        [post_id, user_id, content, comment_id]
    
    runQuery.socket({ socket, io, values, query: postCommentQuery(type), eventName: 'someone-commented', extras: { type } })
}

async function likeComment({ user_id, post_id, comment_id, type, socket, io }) {
    const query = type === 'like' ? likeCommentQuery : unlikeCommentQuery
    runQuery.socket({ socket, io, values: [user_id, comment_id, post_id], query, eventName: 'liked-comment', extras: { type }})
}

async function editComment () {};

async function deleteComment () {};

module.exports = {
    getComment,
    postCommentSocket,
    editComment,
    deleteComment,
    getComments,
    likeComment,
}