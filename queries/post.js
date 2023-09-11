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
        cardinality(array(SELECT id FROM comments WHERE post_id = posts.id)) AS post_comments, 
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL)) AS post_likes,
        cardinality(array(SELECT id FROM share WHERE post_id = $1)) AS shares,
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND user_id = $1)) AS liked_post,
        date_posted,
        last_updated,
        posts.user_id,
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
    OR group_id = ANY ((SELECT unnest(groups) FROM user_friends)) 
    ORDER BY posts.date_posted DESC, posts.last_updated DESC;
`

const getPostQuery = `
    SELECT 
        posts.id, 
        post_desc,
        post_type,
        post_bg,
        cardinality(array( SELECT id FROM likes WHERE post_id = $1 AND user_id = $2 )) = 1 AS liked,
        cardinality(array( SELECT id FROM comments WHERE post_id = $1 )) AS post_comments, 
        cardinality(array( SELECT id FROM likes WHERE post_id = $1 AND comment_id IS NULL )) AS post_likes,
        cardinality(array( SELECT id FROM share WHERE post_id = $1 )) AS shares,
        date_posted,
        posts.user_id,
        concat(first_name, ' ', last_name) AS name,
        profile_pic, 
        active FROM posts
    INNER JOIN user_profile ON posts.user_id = user_profile.id
    WHERE posts.id = $1
`

const likePostQuery = `
    WITH remove_like AS (
        DELETE FROM likes WHERE user_id = $1 AND post_id = $2
    ), like_post AS (
        INSERT INTO likes (id, user_id, post_id) VALUES (uuid_generate_v4(), $1, $2)
        RETURNING id as like_id
    ) SELECT 
        id, 
        cardinality(array( SELECT id FROM likes WHERE post_id = $2 )) + cardinality(array( SELECT like_id FROM like_post )) as likes,
        $1 as user_id
    FROM posts WHERE id = $2;
`

const unlikePostQuery = `
    WITH like_post AS (
        DELETE FROM likes WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL
        RETURNING id AS like_id
    )  
    SELECT 
        id, 
        cardinality(array( SELECT id FROM likes WHERE post_id = $2 )) - cardinality(array( SELECT like_id FROM like_post )) as likes,
        $1 as user_id
    FROM posts WHERE id = $2;
`

const createPostQuery = ( type ) => `
    INSERT INTO posts ( id, user_id, post_desc${type === 'group' ? ', group_id' : ''} ) 
    VALUES (
        uuid_generate_v4(), $1, $2 ${type === 'group' ? ',$3' : ''}
    )
    RETURNING id AS post_id
`

module.exports = {
    getFeedQuery,
    createPostQuery,
    getPostQuery,
    likePostQuery,
    unlikePostQuery
}