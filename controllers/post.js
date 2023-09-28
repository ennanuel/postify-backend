const path = require('path');
const fs = require('fs');
const { getFeedQuery, createPostQuery, getPostQuery, likePostQuery, unlikePostQuery, watchPostQuery, editPostQuery, deletePostQuery } = require('../queries/post');
const postgres = require('../utils/postgres');
const { deleteFile } = require('../functions/group');

async function getPost(req, res) {
    try {
        const { post_id } = req.params
        const { user_id, type } = req.query || {}
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

async function uploadPost(req, res) {
    try {
        const { user_id, post_desc, group_id, post_type, post_bg, channel_id, type, post_files } = req.body
        const values = [user_id, post_desc, post_type, post_bg, post_files];
        if (type === 'group' && group_id) {
            values.push(group_id, null);
        } else if (type === 'channel' && channel_id) {
            values.push(null, channel_id)
        } else {
            values.push(null, null)
        }
        await postgres.request({ query: createPostQuery, values })
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
        if (post) {
            const { files, post_type } = post;
            if (files?.length > 0) await files.map(async (file) => { await deleteFile(post_type, file) });
        }
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
        return res.status(200).json(result[0]);
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ message: error.message })
    }
}

async function likePostSocket({ user_id, post_id, socket, io, type }) { 
    const query = type === 'add' ? likePostQuery : unlikePostQuery
    postgres.socket({ socket, io, query: query, values: [user_id, post_id], eventName: 'someone-liked', extras: { type }})
};

module.exports = {
    getPost,
    getFeed,
    uploadPost,
    editPost,
    deletePost,
    watchPost,
    likePostSocket
}