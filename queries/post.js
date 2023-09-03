const getFeedQuery = `
    WITH user_friends AS ( SELECT ARRAY_APPEND(friends, id) AS people, groups FROM user_interests WHERE id = $1 )
    SELECT 
        posts.id, 
        post_desc,
        post_type,
        post_bg,
        cardinality(array(SELECT id FROM comments WHERE post_id = posts.id)) AS post_comments, 
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id)) AS post_likes,
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
    WHERE ( posts.user_id = ANY ( SELECT UNNEST(people) FROM user_friends ) AND group_id IS NULL )
    OR group_id = ANY ( SELECT UNNEST(groups) FROM user_friends ) 
    ORDER BY posts.date_posted DESC, posts.last_updated DESC;
`

const getPostQuery = `
    SELECT 
        posts.id, 
        post_desc,
        post_type,
        post_bg,
        cardinality(array(SELECT id FROM likes WHERE post_id = $1 AND user_id = $2)) = 1 AS liked,
        cardinality(array(SELECT id FROM comments WHERE post_id = $1)) AS post_comments, 
        cardinality(array(SELECT id FROM likes WHERE post_id = $1)) AS post_likes,
        cardinality(array(SELECT id FROM share WHERE post_id = $1)) AS shares,
        date_posted,
        posts.user_id,
        concat(first_name, ' ', last_name) AS name,
        profile_pic, 
        active FROM posts
    INNER JOIN user_profile ON posts.user_id = user_profile.id
    WHERE posts.id = $1
`

const likePostQuery = `
    INSERT INTO likes (id, user_id, post_id) VALUES (uuid_generate_v4(), $1, $2)
`

const unlikePostQuery = `
    DELETE FROM likes WHERE user_id = $1 AND post_id = $2
`

const createPostQuery = ( type ) => `
    INSERT INTO posts ( id, user_id, post_desc, ${type === 'group' ? 'group_id' : ''} ) 
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