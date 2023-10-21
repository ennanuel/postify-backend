const postgres = require('../utils/postgres');
const { getStoriesQuery, getStoryQuery, createStoryQuery, deleteStoryQuery, watchStoryQuery } = require('../queries/story');
const { io } = require('../utils/server');

async function getUserStories(req, res) {
    try { 
        const { user_id } = req.params;
        const { type } = req.query || {};
        const result = await postgres.request({ values: [user_id], query: getStoriesQuery(type) });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getStory(req, res) {
    try {
        const { story_id } = req.params;
        const { user_id } = req.query || {};
        const result = await postgres.request({ values: [story_id, user_id], query: getStoryQuery });
        return res.status(200).json(result[0])
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function createStory(req, res) {
    try { 
        const { user_id, story_desc, story_bg, story_type, file } = req.body;
        await postgres.request({ res, values: [user_id, story_desc, story_bg, story_type, file], query: createStoryQuery, noResult: true })
        return res.status(200).json({ message: 'Story created' })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function deleteStory(req, res) { }

async function watchedStory(req, res) { 
    try {
        const { story_id, user_id } = req.body;
        const result = await postgres.request({ values: [story_id, user_id], query: watchStoryQuery });
        const watchedStory = result[0];
        if (!watchedStory) throw Error('No stories watched');
        io.emit('story-event', watchedStory);
        return res.status(200).json({ message: 'Story watched' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getUserStories,
    getStory,
    createStory,
    deleteStory,
    watchedStory
}