const getFeedQuery = `
    WITH user_friends AS ( 
        SELECT 
            array_append(friends, id) AS people, 
            array(SELECT id FROM groups WHERE $1 = ANY (members)) AS groups
        FROM user_interests WHERE id = $1 
    ) SELECT 
        groups.id AS group_id,
        groups.name AS group_name,
        posts.id, 
        post_desc,
        post_type,
        post_bg,
        files,
        cardinality(array(SELECT id FROM comments WHERE post_id = posts.id)) AS post_comments, 
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL)) AS post_likes,
        cardinality(array(SELECT id FROM share WHERE post_id = $1)) AS shares,
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND user_id = $1)) AS liked,
        date_posted,
        last_updated,
        posts.user_id,
        $1 = posts.user_id AS is_yours,
        concat(first_name, ' ', last_name) AS name,
        profile_pic,
        active 
    FROM posts
    JOIN user_profile ON posts.user_id = user_profile.id
    LEFT JOIN groups ON groups.id = posts.group_id
    WHERE ( 
        posts.user_id = ANY ((SELECT unnest(people) FROM user_friends)) 
        AND posts.group_id IS NULL 
    )
    AND channel_id IS NULL
    OR group_id = ANY ((SELECT unnest(groups) FROM user_friends)) 
    ORDER BY posts.date_posted DESC, posts.last_updated DESC;
`

const getPostQuery = (type) => `
    SELECT 
        posts.id, 
        post_desc,
        cardinality(array( SELECT id FROM likes WHERE post_id = $1 AND user_id = $2 )) = 1 AS liked,
        cardinality(array( SELECT id FROM comments WHERE post_id = $1 )) AS post_comments, 
        cardinality(array( SELECT id FROM likes WHERE post_id = $1 AND comment_id IS NULL )) AS post_likes,
        cardinality(array( SELECT id FROM share WHERE post_id = $1 )) AS shares,
        date_posted,
        ${
            type === 'channel' ?
            `channel.id AS channel_id,
            name AS channel_name,
            picture AS profile_pic,
            files[1] AS file,
            cardinality(views) AS views,
            $2 = ANY(array_append(followers, creator)) AS is_following` :
            `post_type,
            post_bg,
            files,
            posts.user_id,
            concat(first_name, ' ', last_name) AS name,
            profile_pic, 
            groups.name,
            posts.group_id,
            active,
            posts.group_id`
        }
    FROM posts
    ${
        type === 'channel' ?
        'LEFT JOIN channel ON channel.id = posts.channel_id' :
        `JOIN user_profile ON posts.user_id = user_profile.id 
        LEFT JOIN groups ON groups.id = posts.group_id`
    }
    WHERE posts.id = $1;
`

const getNextPostsForChannelQuery = `
    WITH next_posts AS (
        SELECT id FROM posts
        WHERE channel_id = ANY(array( SELECT channel_id FROM posts WHERE id = $1 ))
            AND NOT id = ANY($2)
        ORDER BY views
        LIMIT 2
    ) SELECT array(SELECT id FROM next_posts) AS next_posts;
`

const getNextPostsForChannelFollowingQuery = `
    WITH unwatched_posts AS (
        SELECT id FROM posts
        WHERE
            user_id != $1
            AND NOT id = ANY($2)
            AND NOT $1 = ANY(views)
            AND channel_id = ANY(array( SELECT id FROM channel WHERE $1 = ANY(followers) ))
        ORDER BY views
        LIMIT 2
    ), watched_posts AS (
        SELECT id FROM posts
        WHERE
            user_id != $1
            AND NOT id = ANY($2)
            AND $1 = ANY(views)
            AND channel_id = ANY(array( SELECT id FROM channel WHERE $1 = ANY(followers) ))
        ORDER BY views
        LIMIT 2
    ) SELECT array_cat(array( SELECT id FROM unwatched_posts ), array( SELECT id FROM watched_posts )) AS next_posts
`

const getNextPostsForChannelNotFollowingQuery = `
    WITH unwatched_posts AS (
        SELECT id FROM posts
        WHERE
            user_id != $1
            AND NOT id = ANY($2)
            AND NOT $1 = ANY(views)
            AND channel_id = ANY(array( SELECT id FROM channel WHERE NOT $1 = ANY(followers) ))
        ORDER BY views
        LIMIT 2
    ), watched_posts AS (
        SELECT id FROM posts
        WHERE
            user_id != $1
            AND NOT id = ANY($2)
            AND $1 = ANY(views)
            AND channel_id = ANY(array( SELECT id FROM channel WHERE NOT $1 = ANY(followers) ))
        ORDER BY views
        LIMIT 2
    ) SELECT array_cat(array( SELECT id FROM unwatched_posts ), array( SELECT id FROM watched_posts )) AS next_posts
`

const unlikePostQuery = `
    WITH delete_like AS (
        DELETE FROM likes WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL
        RETURNING id AS like_id, user_id
    ) SELECT 
        id AS post_id, 
        cardinality(array( SELECT id FROM likes WHERE post_id = $2 AND comment_id IS NULL ))
            - cardinality(array( SELECT like_id FROM delete_like )) as post_likes,
        NOT $1 = ANY(array( SELECT user_id FROM delete_like )) AS liked,
        $1 as user_id
    FROM posts WHERE id = $2;
`

const likePostQuery = `
    WITH remove_like AS (
        DELETE FROM likes WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL
    ), like_post AS (
        INSERT INTO likes (id, user_id, post_id) VALUES (uuid_generate_v4(), $1, $2)
        RETURNING id as like_id, user_id
    ) SELECT 
        id AS post_id, 
        cardinality(array( SELECT id FROM likes WHERE post_id = $2 AND user_id != $1 AND comment_id IS NULL ))
            + cardinality(array( SELECT like_id FROM like_post )) AS post_likes,
        $1 = ANY(array( SELECT user_id FROM like_post )) AS liked,
        $1 as user_id
    FROM posts WHERE id = $2;
`

const watchPostQuery = `
    WITH watch AS (
        UPDATE posts SET views = array_append(views, $2) WHERE id = $1 AND NOT $2 = ANY(views)
        RETURNING id AS post_id
    ) SELECT
        cardinality(views) + cardinality(array(SELECT id FROM watch)) AS views,
        $1 AS post_id
    FROM posts WHERE id = $1
`

const createPostQuery = `
    INSERT INTO posts ( id, user_id, post_desc, post_type, post_bg, files, group_id, channel_id ) 
    VALUES ( uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7 )
    RETURNING id AS post_id, user_id, channel_id, group_id
`;

const editPostQuery = `
    UPDATE posts SET
        post_desc = $3,
        post_type = $4,
        post_bg = $5,
        files = $6,
        last_updated = now()
    WHERE id = $1 AND user_id = $2
`;

const deletePostQuery = `
    WITH delete_post AS (
        DELETE FROM posts WHERE id = $1 AND user_id = $2
        RETURNING id AS post_id, files, post_type
    ), delete_comments AS (
        DELETE FROM comments WHERE post_id = ANY(array( SELECT post_id FROM delete_post ))
    ), delete_likes AS (
        DELETE FROM likes WHERE post_id = ANY(array( SELECT post_id FROM delete_post ))
    ) SELECT
        files AS post_files,
        '{}'::varchar[] AS story_files,
        post_type
    FROM delete_post;
`;

module.exports = {
    getFeedQuery,
    createPostQuery,
    getPostQuery,
    getNextPostsForChannelQuery,
    getNextPostsForChannelFollowingQuery,
    getNextPostsForChannelNotFollowingQuery,
    editPostQuery,
    deletePostQuery,
    likePostQuery,
    unlikePostQuery,
    watchPostQuery
}