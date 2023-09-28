const postgres = require('../utils/postgres');
const { postCommentQuery, getCommentsQuery, getCommentQuery, likeCommentQuery, unlikeCommentQuery } = require('../queries/comment');

async function getComment(req, res) { 
    try { 
        const { comment_id } = req.params;
        const { user_id } = req.query || {};
        const result = await postgres.request({ res, values: [comment_id, user_id], query: getCommentQuery, single: true })
        return res.status(200).json(result[0]);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function getComments(req, res) {
    try {
        const { post_id } = req.params;
        const { type, comment_id, user_id } = req.query || {};
        const values = type === 'replies' ? [post_id, user_id, comment_id] : [post_id, user_id];
        const result = await postgres.request({ res, values, query: getCommentsQuery(type) });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function postCommentSocket({ user_id, post_id, content, type, comment_id, io, socket }) {
    const values = type !== 'reply' ?
        [post_id, user_id, content] :
        [post_id, user_id, content, comment_id]
    
    postgres.socket({ socket, io, values, query: postCommentQuery(type), eventName: 'someone-commented', extras: { type } })
}

async function likeComment({ user_id, post_id, comment_id, type, socket, io }) {
    const query = type === 'like' ? likeCommentQuery : unlikeCommentQuery
    postgres.socket({ socket, io, values: [user_id, comment_id, post_id], query, eventName: 'liked-comment', extras: { type }})
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