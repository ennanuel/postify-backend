const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bp = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require('http');
const { Server } = require('socket.io')

const route = require("./routes");

const { likePostSocket } = require('./controllers/post')
const { postCommentSocket, likeComment } = require("./controllers/comment");
const { friendsAction } = require("./controllers/friend");
const { memberActions } = require("./controllers/group");
const { followAction } = require("./controllers/channel");
const { authMiddleware } = require("./functions/auth");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
})

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Routes to handle HTTP requests
app.use('/image', express.static('./images'));
app.use('/video', express.static('./videos'));
app.use('/auth', route.auth);
app.use('/comment', authMiddleware, route.comment);
app.use('/post', authMiddleware, route.post);
app.use('/user', authMiddleware, route.user);
app.use('/group', authMiddleware, route.group);
app.use('/notification', authMiddleware, route.notification);
app.use('/friend', authMiddleware, route.friend);
app.use('/channel', authMiddleware, route.channel);
app.use('/story', authMiddleware, route.story);

// Socket event handlers
io.on("connection", (socket) => {
    console.log('Socket connected: %s', socket.id);
    socket.on('post-action', (params) => io.emit('post-event', params))
    socket.on('story-action', (params) => io.emit('story-event', params))
    socket.on('like-post', (params, type) => likePostSocket({ ...params, type, socket, io }))
    socket.on('comment', (params, type) => postCommentSocket({ ...params, type, socket, io }))
    socket.on('like-comment', (params, type) => likeComment({ ...params, type, socket, io }))
    socket.on('friend-action', (params, type) => friendsAction({ ...params, type, socket, io }))
    socket.on('group-action', (params, type) => memberActions({ ...params, type, socket, io }))
    socket.on('channel-action', (params, type) => followAction({ ...params, type, socket, io }))
    socket.on('watch-action', (params) => { console.log(params); io.emit('watch-event', params); })
})

server.listen(process.env.PORT, () => {
    console.log('server running...');
})