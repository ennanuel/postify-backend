const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bp = require("body-parser");
const cookieParser = require("cookie-parser");

const { io, app, server } = require('./utils/server')

const route = require("./routes");

const { friendsAction } = require("./controllers/friend");
const { memberActions } = require("./controllers/group");
const { followAction } = require("./controllers/channel");
const { authMiddleware } = require("./functions/auth");

dotenv.config();

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
app.use('/search', authMiddleware, route.search);

// Socket event handlers
io.on("connection", (socket) => {
    console.log('Socket connected: %s', socket.id);
    socket.on('group-action', (params, type) => memberActions({ ...params, type, socket, io }))
})

server.listen(process.env.PORT, () => {
    console.log('server running...');
})