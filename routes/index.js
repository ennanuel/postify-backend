const auth = require('./auth')
const comment = require('./comments')
const post = require('./posts')
const user = require('./users')
const group = require('./groups')
const notification = require('./notifications')
const friend = require('./friends')
const channel = require('./channels')
const story = require('./stories')
const search = require('./search');

module.exports = {
    auth,
    comment,
    post,
    user,
    group,
    notification,
    friend,
    channel,
    story,
    search
}