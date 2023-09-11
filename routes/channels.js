const router = require('express').Router()
const { getChannels, getChannelInfo, getChannelsFeed, createChannel, createChannelPost, getChannelIds } = require('../controllers/channel')

router.get('/:user_id', getChannels);
router.get('/id/:user_id', getChannelIds);
router.get('/feed/:channel_id', getChannelsFeed);
router.get('/info/:channel_id', getChannelInfo);
router.post('/create', createChannel);
router.post('/post', createChannelPost)

module.exports = router;