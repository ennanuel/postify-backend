const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bp = require("body-parser");
const http = require('http');
const { Server } = require('socket.io')

const { likePostSocket } = require('./controllers/post')

const {
    authRoute,
    commentRoute,
    reactionRoute,
    postRoute,
    userRoute,
    groupRoute,
    notificationRoute,
    friendRoute,
    channelRoute
} = require("./routes");
const { postCommentSocket, likeComment } = require("./controllers/comment");
const { friendsAction } = require("./controllers/friend");
const { memberActions } = require("./controllers/group");
const { followAction } = require("./controllers/channel");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    }
})

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }))
app.use(cors({
    origin: "*"
}))


app.use('/auth', authRoute);
app.use('/comment', commentRoute);
app.use('/react', reactionRoute);
app.use('/post', postRoute);
app.use('/user', userRoute);
app.use('/group', groupRoute);
app.use('/notification', notificationRoute);
app.use('/friend', friendRoute);
app.use('/channel', channelRoute);

io.on("connection", (socket) => {
    console.log('Socket connected: %s', socket.id);
    socket.on('post-action', (params) => io.emit('post-event', params))
    socket.on('like-post', (params, type) => likePostSocket({ ...params, type, socket, io }))
    socket.on('comment', (params, type) => postCommentSocket({ ...params, type, socket, io }))
    socket.on('like-comment', (params, type) => likeComment({ ...params, type, socket, io }))
    socket.on('friend-action', (params, type) => friendsAction({ ...params, type, socket, io }))
    socket.on('group-action', (params, type) => memberActions({ ...params, type, socket, io }))
    socket.on('channel-action', (params, type) => followAction({ ...params, type, socket, io }))
})

server.listen(process.env.PORT, () => {
    console.log('server running...');
})