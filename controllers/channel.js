const postgres = require('../utils/postgres');
const { handleFiles, handleDelete } = require('../functions/group');
const {
    createChannelQuery,
    getChannelsQuery,
    getChannelInfoQuery,
    getChannelsFeedQuery,
    createChannelPostQuery,
    getChannelIdsQuery,
    editChannelQuery,
    deleteChannelQuery,
    followChannelQuery,
    unFollowChannelQuery
} = require('../queries/channel');
const { io } = require('../utils/server');

async function getChannels(req, res) {
    try {            
        const { user_id } = req.params;
        const { type } = req.query || {};
        const result = await postgres.request({ values: [user_id], query: getChannelsQuery(type) });
        return res.status(200).json(result)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getChannelIds(req, res) {
    try { 
        const { user_id } = req.params;
        const result = await postgres.request({ values: [user_id], query: getChannelIdsQuery });
        return res.status(200).json(result[0])
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getChannelsFeed(req, res) {
    try {
        const { channel_or_user_id } = req.params;
        const { user_id, type } = req.query;
        const result = await postgres.request({ values: [channel_or_user_id, user_id], query: getChannelsFeedQuery(type) });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getChannelInfo(req, res) { 
    try {
        const { channel_id } = req.params;
        const { user_id, type } = req.query || {};
        const result = await postgres.request({ res, values: [channel_id, user_id], query: getChannelInfoQuery(type), single: true })
        return res.status(200).json(result[0]);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message })
    }
}

async function createChannel(req, res) {
    try {
        const { name, user_id, channel_desc, tags, website, picture, cover } = req.body;
        const values = [name, user_id, channel_desc, picture, cover, website, tags || []];
        const result = await postgres.request({ values, query: createChannelQuery });
        const createdChannel = result[0];
        if (!createdChannel) throw Error('No new channel created');
        io.emit('channel-event', createdChannel);
        return res.status(200).json({ message: 'Channel Created!' })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

async function createChannelPost(req, res) {
    try {
        const { channel_id, user_id, post_desc, files } = req.body;
        await postgres.request({ values: [channel_id, user_id, post_desc, files], query: createChannelPostQuery });
        return res.status(200).json({ message: 'Channel Created' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message })
    }
}

async function followChannel(req, res) {
    try {
        const { user_id, channel_id } = req.body;
        const result = await postgres.request({ query: followChannelQuery, values: [channel_id, user_id] });
        const followedChannel = result[0];
        if (!followedChannel) throw Error('no channels followed');
        io.emit('channel-event', followedChannel);
        res.status(200).json({ message: 'Channel followed' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message })
    }
}

async function unFollowChannel(req, res) {
    try {
        const { user_id, channel_id } = req.body;
        const result = await postgres.request({ query: unFollowChannelQuery, values: [channel_id, user_id] });
        const followedChannel = result[0];
        if (!followedChannel) throw Error('no channels unfollowed');
        io.emit('channel-event', followedChannel);
        res.status(200).json({ message: 'Channel unfollowed' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message })
    }
}

async function editChannel(req, res) {
    try {
        const { channel_id, name, user_id, channel_desc, tags, website, prev_cover, prev_pic, cover, picture } = req.body;
        const [new_picture, new_cover] = await handleFiles([[prev_pic, picture], [prev_cover, cover]]);
        const values = [channel_id, user_id, name, channel_desc, tags, website, new_picture, new_cover]
        await postgres.request({ values, query: editChannelQuery });
        return res.status(200).json({ message: 'Channel Edited!' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function deleteChannel(req, res) { 
    try { 
        const { channel_id, user_id } = req.body;
        const [deleted_channel] = await postgres.request({ query: deleteChannelQuery, values: [channel_id, user_id] });
        if (deleted_channel) await handleDelete(deleted_channel);
        return res.status(200).json({ message: 'Channel Deleted' })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getChannels,
    getChannelIds,
    getChannelsFeed,
    getChannelInfo,
    followChannel,
    unFollowChannel,
    createChannel,
    createChannelPost,
    editChannel,
    deleteChannel,
}