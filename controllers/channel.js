const runQuery = require('../dbHandler');
const { createChannelQuery, getChannelsQuery, getChannelInfoQuery, followActionQuery, getChannelsFeedQuery, createChannelPostQuery, getChannelIdsQuery } = require('../queries/channel');

async function getChannels(req, res) {
    const { user_id } = req.params;
    const { type } = req.query || {};
    runQuery.request({ res, values: [user_id], query: getChannelsQuery(type) })
}

async function getChannelIds(req, res) {
    const { user_id } = req.params;
    runQuery.request({ res, values: [user_id], query: getChannelIdsQuery, single: true })
}

async function getChannelsFeed(req, res) {
    const { channel_id } = req.params;
    const { user_id, type } = req.query || {};
    runQuery.request({ res, values: [channel_id, user_id], query: getChannelsFeedQuery(type) })
}

async function getChannelInfo(req, res) { 
    const { channel_id } = req.params;
    const { user_id } = req.query || {};
    runQuery.request({ res, values: [channel_id, user_id], query: getChannelInfoQuery, single: true })
}

async function createChannel(req, res) { 
    const { name, user_id, channel_desc, tags, website } = req.body;
    const refinedTags = `{${tags.join(', ')}}`;
    runQuery.request({ res, values: [ name, user_id, channel_desc, website, refinedTags ], query: createChannelQuery })
}

async function createChannelPost(req, res) {
    const { channel_id, user_id, post_desc, files } = req.body;
    runQuery.request({ res, values: [channel_id, user_id, post_desc, files], query: createChannelPostQuery, noResult: true })
}

async function followAction({ socket, io, user_id, channel_id, type }) {
    runQuery.socket({ socket, io, values: [channel_id, user_id], query: followActionQuery(type), eventName: 'channel-event', extras: { user_id } })
}

async function editChannel() { 

}

async function deleteChannel() { 

}

module.exports = {
    getChannels,
    getChannelIds,
    getChannelsFeed,
    getChannelInfo,
    createChannel,
    createChannelPost,
    editChannel,
    deleteChannel,
    followAction,
}