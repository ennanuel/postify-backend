const getChannelsQuery = (type) => `
    SELECT 
        id, name, picture 
    FROM channel
    WHERE 
    ${
    type === 'following' ?
    '$1 = ANY (followers)' :
    type === 'created' ?
    'creator = $1' :
    'NOT $1 = ANY(array_append(followers, creator))'
    }
`

const getChannelIdsQuery = `
    SELECT array( SELECT id FROM channel WHERE $1 = ANY(array_append(followers, creator)) );
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
    WHERE id = $1 
        AND creator != $2 
        ${ type === 'follow' ? 'AND NOT $2 = ANY(followers)' : '' }
    RETURNING id as channel_id
`

const getChannelsFeedQuery = (type) => `
    SELECT 
        posts.id, 
        name AS channel_name, 
        post_desc,
        picture,
        files[1] AS thumbnail,
        cardinality(array( SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL )) AS post_likes,
        cardinality(array( SELECT id FROM comments WHERE post_id = posts.id )) AS post_comments,
        cardinality(array( SELECT id FROM likes WHERE user_id = $2 AND post_id = posts.id AND comment_id IS NULL )) > 0 AS liked,
        cardinality(array( SELECT id FROM share WHERE post_id = posts.id )) AS shares,
        date_posted
    FROM posts
    JOIN channel ON channel.id = posts.channel_id
    WHERE
    ${
    type === 'single' ?
        'posts.channel_id = $1' : 
        `${ type === 'explore' ? 'NOT' : '' } $1 = ANY (array_append(followers, creator))`
    }
    ORDER BY post_likes DESC
`

module.exports = {
    getChannelsQuery,
    getChannelIdsQuery,
    createChannelQuery,
    createChannelPostQuery,
    getChannelInfoQuery,
    followActionQuery,
    getChannelsFeedQuery,
}