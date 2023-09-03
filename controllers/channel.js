const runQuery = require('../dbHandler');
const { createChannelQuery, getFollowingChannelsQuery, getCreatedChannelsQuery, getChannelsQuery, getChannelInfoQuery, followActionQuery, getChannelsFeedQuery, getChannelFeedQuery, createChannelPostQuery } = require('../queries/channel');

async function getChannels(req, res) {
    const { user_id } = req.params;
    runQuery({ res, values: [user_id], query: getChannelsQuery })
}

async function getChannelsFeed(req, res) {
    const { user_id } = req.params;
    const { type } = req.query || {};
    runQuery({ res, values: [user_id], query: getChannelsFeedQuery(type) })
}

async function getChannelFeed(req, res) {
    const { channel_id } = req.params;
    const { user_id } = req.query || {};
    runQuery({ res, values: [channel_id, user_id], query: getChannelFeedQuery })
}

async function getFollowingChannels(req, res) { 
    const { user_id } = req.params
    runQuery({ res, values: [user_id], query: getFollowingChannelsQuery })
}

async function getCreatedChannels(req, res) { 
    const { user_id } = req.params
    runQuery({ res, values: [user_id], query: getCreatedChannelsQuery })
}

async function getChannelInfo(req, res) { 
    const { channel_id } = req.params;
    const { user_id } = req.user_id || {};
    runQuery({ res, values: [channel_id, user_id], query: getChannelInfoQuery, single: true })
}

async function createChannel(req, res) { 
    const { name, user_id, channel_desc, tags, website } = req.body;
    const refinedTags = `{${tags.join(', ')}}`;
    runQuery({ res, values: [ name, user_id, channel_desc, website, refinedTags ], query: createChannelQuery })
}

async function createChannelPost(req, res) {
    const { channel_id, user_id, post_desc, files } = req.body;
    runQuery({ res, values: [channel_id, user_id, post_desc, files], query: createChannelPostQuery, noResult: true })
}

async function followActions(req, res) {
    const { user_id, channel_id, type } = req.body
    runQuery({ res, values: [channel_id, user_id], query: followActionQuery(type), noResult: true })
}

async function editChannel() { }

async function deleteChannel() { }

module.exports = {
    getChannels,
    getFollowingChannels,
    getCreatedChannels,
    getChannelsFeed,
    getChannelFeed,
    getChannelInfo,
    createChannel,
    createChannelPost,
    followActions,
    editChannel,
    deleteChannel
}