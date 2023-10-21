const postgres = require('../utils/postgres');
const { postCommentQuery, getCommentsQuery, getCommentQuery, likeCommentQuery, unlikeCommentQuery, postReplyQuery } = require('../queries/comment');
const { io } = require('../utils/server');

async function getComment(req, res) { 
    try {
        const { comment_id } = req.params
        const { user_id } = req.query || {}
        const result = await postgres.request({ res, values: [comment_id, user_id], query: getCommentQuery, single: true })
        return res.status(200).json(result[0])
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message })
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
        console.error(error.message);
        res.status(500).json({ message: error.message })
    }
}

async function postComment(req, res) {
    try {
        const { post_id, user_id, comment } = req.body;
        const result = await postgres.request({ query: postCommentQuery, values: [post_id, user_id, comment] });
        const postedComment = result[0];
        if (!postedComment) return;
        io.emit('someone-commented', postedComment);
        res.status(200).json({ message: 'comment sent' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message })
    }
}

async function postReply(req, res) {
    try {
        const { post_id, user_id, comment_id, comment } = req.body;
        const result = await postgres.request({ query: postReplyQuery, values: [post_id, user_id, comment, comment_id] });
        const postedReply = result[0]
        if (!postedReply) return;
        io.emit('someone-commented', postedReply);
        res.status(200).json({ message: 'reply sent' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message })
    }
}

async function likeComment(req, res) {
    try {
        const { user_id, post_id, comment_id } = req.body;
        const result = await postgres.request({ query: likeCommentQuery, values: [user_id, comment_id, post_id] });
        const likedComment = result[0];
        if (!likedComment) throw new Error('Could not like comment');
        io.emit('liked-comment', likedComment);
        res.status(200).json({ message: 'comment liked' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message })
    }
}

async function unlikeComment(req, res) {
    try {
        const { user_id, post_id, comment_id } = req.body;
        const result = await postgres.request({ query: unlikeCommentQuery, values: [user_id, comment_id, post_id] });
        const likedComment = result[0];
        if (!likedComment) throw new Error('Could not like comment');
        io.emit('liked-comment', likedComment);
        res.status(200).json({ message: 'like removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message })
    }
};

async function editComment () {};

async function deleteComment () {};

module.exports = {
    getComment,
    postComment,
    postReply,
    editComment,
    deleteComment,
    getComments,
    likeComment,
    unlikeComment
}