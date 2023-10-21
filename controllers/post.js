const path = require('path');
const fs = require('fs');
const {
    getFeedQuery,
    createPostQuery,
    getPostQuery,
    likePostQuery,
    unlikePostQuery,
    watchPostQuery,
    editPostQuery,
    deletePostQuery,
    getNextPostsForChannelFollowingQuery,
    getNextPostsForChannelQuery,
    getNextPostsForChannelNotFollowingQuery
} = require('../queries/post');
const postgres = require('../utils/postgres');
const { handleDelete } = require('../functions/group');
const { io } = require('../utils/server');

async function getPost(req, res) {
    try {
        const { post_id } = req.params
        const { user_id, type } = req.query
        const result = await postgres.request({ query: getPostQuery(type), values: [post_id, user_id] })
        return res.status(200).json(result[0]);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message })
    }
};

async function getFeed(req, res) {
    try {
        const { user_id } = req.params;
        const result = await postgres.request({ query: getFeedQuery, values: [user_id] });
        return res.status(200).json(result)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function getNextPost(req, res) {
    try {
        const { user_id, post_id } = req.params;
        const { queueType, currentQueue } = req.query;
        const queryType = ['single', 'following'].includes(queueType?.toLowerCase()) ? queueType.toLowerCase() : 'notfollowing';
        const queueArray = currentQueue ? currentQueue.split(',') : [];
        const QUERY_OPTIONS = {
            single: { query: getNextPostsForChannelQuery, values: [post_id, queueArray] },
            following: { query: getNextPostsForChannelFollowingQuery, values: [user_id, queueArray] },
            notfollowing: { query: getNextPostsForChannelNotFollowingQuery, values: [user_id, queueArray] }
        };
        const { query, values } = QUERY_OPTIONS[queryType];
        const result = await postgres.request({ query, values });
        const { next_posts } = result[0];
        return res.status(200).json(next_posts.slice(0, 2));
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function uploadPost(req, res) {
    try {
        const { user_id, post_desc, post_type, post_bg, post_files, channel_id, group_id } = req.body;
        const values = [user_id, post_desc, post_type, post_bg, post_files, group_id, channel_id];
        const result = await postgres.request({ query: createPostQuery, values });
        const createdPost = result[0];
        if (!createdPost) throw new Error('No new post created');
        io.emit('post-event', createdPost);
        return res.status(200).json({ message: 'Post uploaded!' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

async function editPost(req, res) {
    try {
        const { to_delete } = req.body;
        async function deleteFile(file) {
            const fileType = /.(jpg|png|jpeg)$/i.test(file) ? 'photo' : 'video'
            console.log(fileType);
            const filePath = path.join(__dirname, `../${fileType === 'video' ? 'videos/post_videos' : 'images/post_images'}/${file}`);
            const exists = await fs.existsSync(filePath);
            if (!exists) console.log('File doesn\'t exist');
            else await fs.unlinkSync(filePath);
            return file;
        }
        if (to_delete) {
            const deleted_files = await Promise.all(to_delete.map(elem => deleteFile(elem)));
            req.body.post_files = req.body.post_files.filter(file => !deleted_files.includes(file));
            console.log('file(s) deleted')
        } else console.log('nothing was deleted')

        const { post_id, user_id, post_desc, post_type, post_bg, post_files } = req.body;
        await postgres.request({ values: [post_id, user_id, post_desc, post_type, post_bg, post_files], query: editPostQuery });
        return res.status(200).json({ message: 'Post edited' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message })
    }
};

async function deletePost(req, res) { 
    try { 
        const { user_id, post_id } = req.body;
        const [post] = await postgres.request({ query: deletePostQuery, values: [post_id, user_id] });
        if (post) await handleDelete(post);
        return res.status(200).json({ message: 'Post Deleted!' });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ message: error.message })        
    }
};

async function watchPost(req, res) {
    try {
        const { user_id, post_id } = req.body;
        const result = await postgres.request({ query: watchPostQuery, values: [post_id, user_id] });
        const watchedPost = result[0];
        if (!watchedPost) throw new Error('Could not watch video');
        io.emit('watch-event', watchedPost);
        res.status(200).json({ message: 'like removed' });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ message: error.message })
    }
}

async function likePost(req, res) {
    try {
        const { user_id, post_id, } = req.body;
        const result = await postgres.request({ query: likePostQuery, values: [user_id, post_id] });
        const likedPost = result[0];
        if (!likedPost) throw new Error('Could not like post');
        io.emit('someone-liked', likedPost);
        res.status(200).json({ message: 'comment liked' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message })
    }
}

async function unlikePost(req, res) {
    try {
        const { user_id, post_id, } = req.body;
        const result = await postgres.request({ query: unlikePostQuery, values: [user_id, post_id] });
        const likedPost = result[0];
        if (!likedPost) throw new Error('Could not unlike post');
        io.emit('someone-liked', likedPost);
        res.status(200).json({ message: 'like removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    getPost,
    getFeed,
    getNextPost,
    uploadPost,
    editPost,
    deletePost,
    watchPost,
    likePost,
    unlikePost
}