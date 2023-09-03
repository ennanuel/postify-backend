const getChannelsQuery = `
    SELECT id, name, picture FROM channel WHERE NOT ($1 = ANY (followers) OR creator = $1)
`

const getFollowingChannelsQuery = `
    SELECT id, name, picture FROM channel WHERE $1 = ANY (followers)
`

const getCreatedChannelsQuery = `
    SELECT id, name, picture FROM channel WHERE creator = $1
`

const getChannelInfoQuery = `
    SELECT 
        name, 
        picture,
        cover,
        cardinality(followers) AS popularity, 
        channel_desc, 
        cardinality(array( SELECT posts.id FROM posts WHERE channel_id = channel.id )) as posts,
        $2 = ANY (followers) AS following,
        tags,
        website
    FROM channel
    WHERE id = $1
`

const createChannelQuery = `
    INSERT INTO channel ( id, name, creator, channel_desc, website, tags  ) VALUES ( uuid_generate_v4(), $1, $2, $3, $4, $5 );
`

const createChannelPostQuery = `
    INSERT INTO posts (id, channel_id, user_id, post_desc, files) VALUES ( uuid_generate_v4(), $1, $2, $3, $4 )
`

const followActionQuery = (type) => `
    UPDATE channel
    SET followers = ${ type === 'follow' ? 'array_append' : 'array_remove' }(followers, $2) 
    WHERE id = $1 AND creator != $2 AND NOT $2 = ANY(followers)
`

const getChannelFeedQuery = `
    SELECT 
        posts.id, 
        channel.name AS channel_name, 
        channel.id AS channel_id,
        post_desc, 
        files[0] as thumbnail,
        picture,
        cardinality(likes) AS post_likes,
        cardinality(comments) AS post_comments,
        $2 = likes.user_id AS liked,
        shares,
        date_posted
    FROM posts
    JOIN channel ON channel.id = posts.channel_id
    LEFT JOIN likes ON likes.id = ANY (posts.likes)
    WHERE posts.channel_id = $1
`

const getChannelsFeedQuery = (type) => `
    WITH channels AS (
        SELECT id, name FROM channel WHERE ${type === 'explore' ? 'NOT' : ''} ($1 = ANY (followers) OR creator = $1)
    )
    SELECT 
        posts.id, 
        name AS channel_name, 
        post_desc,
        files[1] AS thumbnail,
        cardinality(likes) AS post_likes,
        cardinality(comments) AS post_comments,
        $1 = likes.user_id AS liked,
        shares,
        date_posted
    FROM channels
    JOIN posts ON posts.channel_id = channels.id
    LEFT JOIN likes ON likes.id = ANY (posts.likes)
`

module.exports = {
    getChannelsQuery,
    getFollowingChannelsQuery,
    getCreatedChannelsQuery,
    createChannelQuery,
    createChannelPostQuery,
    getChannelInfoQuery,
    followActionQuery,
    getChannelFeedQuery,
    getChannelsFeedQuery,
}