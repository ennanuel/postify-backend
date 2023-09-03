const router = require('express').Router()
const { getChannels, getChannelInfo, getFollowingChannels, getChannelsFeed, getCreatedChannels, createChannel, followActions, getChannelFeed, createChannelPost } = require('../controllers/channel')

router.get('/:user_id', getChannels);
router.get('/feed/:user_id', getChannelsFeed);
router.get('/feed/single/:channel_id', getChannelFeed);
router.get('/info/:channel_id', getChannelInfo);
router.get('/following/:user_id', getFollowingChannels);
router.get('/created/:user_id', getCreatedChannels);
router.post('/create', createChannel);
router.post('/post', createChannelPost)
router.put('/action', followActions);

module.exports = router;