const authRoute = require('./auth')
const commentRoute = require('./comments')
const reactionRoute = require('./reactions')
const postRoute = require('./posts')
const userRoute = require('./users')
const groupRoute = require('./groups')
const notificationRoute = require('./notifications')
const friendRoute = require('./friends')
const channelRoute = require('./channels')

module.exports = {
    authRoute,
    commentRoute,
    reactionRoute,
    postRoute,
    userRoute,
    groupRoute,
    notificationRoute,
    friendRoute,
    channelRoute
}