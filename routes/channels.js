const router = require('express').Router()
const { getChannels, getChannelInfo, getChannelsFeed, createChannel, createChannelPost, getChannelIds, editChannel, deleteChannel } = require('../controllers/channel');
const uploadMiddleware = require('../functions/channel');

router.get('/:user_id', getChannels);
router.get('/id/:user_id', getChannelIds);
router.get('/feed/:channel_id', getChannelsFeed);
router.get('/info/:channel_id', getChannelInfo);
router.post('/create', uploadMiddleware, createChannel);
router.put('/edit', uploadMiddleware, editChannel);
router.post('/post', createChannelPost);
router.delete('/delete', deleteChannel)

module.exports = router;