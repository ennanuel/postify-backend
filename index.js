const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bp = require("body-parser")

const { authRoute, commentRoute, reactionRoute, postRoute, userRoute, groupRoute, notificationRoute, friendRoute, channelRoute } = require("./routes");

dotenv.config();

const app = express();

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

app.listen(process.env.PORT, () => {
    console.log('server running...');
})