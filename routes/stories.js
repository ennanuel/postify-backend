const router = (require('express')).Router();

const { getUserStories, getStory, createStory, deleteStory, watchedStory } = require('../controllers/story');
const uploadMiddleware = require('../functions/story');

router.get('/:user_id', getUserStories);
router.get('/detail/:story_id', getStory);
router.post('/create', uploadMiddleware, createStory);
router.put('/watch', watchedStory);
router.delete('/delete', deleteStory);

module.exports = router;