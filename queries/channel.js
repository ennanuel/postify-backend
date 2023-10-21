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

const getChannelInfoQuery = (type) => `
    SELECT 
        name,
        picture,
        cover,
        channel_desc,
        $2 = creator AS owner,
        ${
        type === 'full' ?
        `
        cardinality(followers) AS popularity,
        cardinality(array( SELECT posts.id FROM posts WHERE channel_id = channel.id )) as posts,
        $2 = ANY (followers) AS following,` :
        ''
        }
        tags,
        website
    FROM channel
    WHERE id = $1
`

const createChannelQuery = `
    INSERT INTO channel ( id, name, creator, channel_desc, picture, cover, website, tags )
    VALUES ( uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7 );
    RETURNING id AS channel_id, creator AS user_id
`

const editChannelQuery = `
    UPDATE channel SET
        name = $3,
        channel_desc = $4,
        tags = $5,
        website = $6,
        picture = $7,
        cover = $8
    WHERE id = $1 AND creator = $2
`

const createChannelPostQuery = `
    INSERT INTO posts (id, channel_id, user_id, post_desc, files) VALUES ( uuid_generate_v4(), $1, $2, $3, $4 )
`

const followChannelQuery = `
    UPDATE channel
        SET followers = array_append(followers, $2) 
    WHERE id = $1 
        AND creator != $2 AND NOT $2 = ANY(followers)
    RETURNING id AS channel_id, $2 AS user_id;
`

const unFollowChannelQuery = `
    UPDATE channel
        SET followers = array_remove(followers, $2) 
    WHERE id = $1 
        AND creator != $2
    RETURNING id as channel_id, $2 AS user_id
`

const getChannelsFeedQuery = (type) => `
    SELECT 
        posts.id, 
        name AS channel_name, 
        post_desc,
        picture,
        files[1] AS file,
        cardinality(array( SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL )) AS post_likes,
        cardinality(array( SELECT id FROM comments WHERE post_id = posts.id )) AS post_comments,
        cardinality(array( SELECT id FROM share WHERE post_id = posts.id )) AS shares,
        cardinality(array( SELECT id FROM likes WHERE user_id = $2 AND post_id = posts.id AND comment_id IS NULL )) > 0 AS liked,
        date_posted
    FROM posts
    JOIN channel ON channel.id = posts.channel_id
    WHERE
    ${
        type === 'single' ?
        '$1 = posts.channel_id' :
        type === 'following' ?
            '$1 = ANY(array_append(followers, creator))' :
            'NOT $1 = ANY(array_append(followers, creator))'
    }
    
    
    
    ORDER BY post_likes DESC;
`;

const deleteChannelQuery = `
    WITH delete_channel AS (
        DELETE FROM channel WHERE id = $1 AND creator = $2
        RETURNING id AS channel_id, picture, cover
    ), delete_posts AS (
        DELETE FROM posts WHERE channel_id = ANY(array( SELECT channel_id FROM delete_channel ))
        RETURNING id AS post_id, files
    ), delete_comments AS (
        DELETE FROM comments WHERE post_id = ANY(array( SELECT post_id FROM delete_posts ))
    ), delete_likes AS (
        DELETE FROM likes WHERE post_id = ANY(array( SELECT post_id FROM delete_posts ))
    ) SELECT 
        picture,
        cover,
        array(SELECT unnest(files) FROM delete_posts) AS post_files,
        '{}'::varchar[] AS story_files
    FROM delete_channel;
`

module.exports = {
    getChannelsQuery,
    getChannelIdsQuery,
    createChannelQuery,
    createChannelPostQuery,
    editChannelQuery,
    getChannelInfoQuery,
    followChannelQuery,
    unFollowChannelQuery,
    getChannelsFeedQuery,
    deleteChannelQuery
}