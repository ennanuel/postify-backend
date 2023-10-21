const getCommentQuery = `
    SELECT
        comments.id,
        content,
        date_uploaded,
        user_profile.id AS user_id,
        concat(first_name, ' ', last_name) AS name,
        profile_pic,
        cardinality(array(SELECT id FROM likes WHERE comment_id = comments.id)) AS likes,
        cardinality(array(SELECT id FROM comments WHERE reply_to = $1)) AS comments,
        cardinality(array(SELECT id FROM likes WHERE user_id = $2 AND comment_id = comments.id)) > 0 AS liked
    FROM comments
    JOIN user_profile ON user_profile.id = comments.user_id
    WHERE comments.id = $1;
`

const getCommentsQuery = (type) => `
    SELECT
        comments.id,
        content,
        date_uploaded,
        user_profile.id AS user_id,
        concat(first_name, ' ', last_name) AS name,
        profile_pic,
        cardinality(array(SELECT id FROM likes WHERE comments.id = comment_id)) AS likes,
        cardinality(array(SELECT id FROM comments AS comment WHERE reply_to = comments.id)) AS comments,
        cardinality(array(SELECT id FROM likes WHERE user_id = $2 AND comment_id = comments.id)) > 0 AS liked,
        reply_to
    FROM comments
    JOIN user_profile ON user_profile.id = comments.user_id
    WHERE comments.post_id = $1 
    ${
        type === 'replies' ?
        'AND reply_to = $3' :
        'AND reply_to IS NULL'
    };
`

const postCommentQuery =  `
    WITH post_comment AS (
        INSERT INTO comments (id, post_id, user_id, content) 
            VALUES ( uuid_generate_v4(), $1, $2, $3 )
            RETURNING id
    ) 
    SELECT
        id AS post_id,
        cardinality(array( SELECT id FROM comments WHERE post_id = $1 )) 
            + cardinality(array(SELECT id FROM post_comment)) as post_comments
    FROM posts WHERE id = $1
`

const postReplyQuery = `
    WITH post_comment AS (
        INSERT INTO comments (id, post_id, user_id, content , reply_to) 
            VALUES ( uuid_generate_v4(), $1, $2, $3 ,$4 )
            RETURNING id
    )  SELECT
        id AS post_id,
        $4 AS comment_id,
        cardinality(
            array( SELECT id FROM comments WHERE reply_to = $4)
        ) + cardinality(
            array( SELECT id FROM post_comment )
        ) AS replies,
        cardinality(array( SELECT id FROM comments WHERE post_id = $1 )) 
            + cardinality(array(SELECT id FROM post_comment)) as post_comments
    FROM posts WHERE id = $1
`

const likeCommentQuery = `
    WITH delete_like AS (
        DELETE FROM likes WHERE user_id = $1 AND comment_id = $2 AND post_id = $3
    ), like_comment AS (
        INSERT INTO likes ( id, user_id, comment_id, post_id ) VALUES (
            uuid_generate_v4(), $1, $2, $3
        ) RETURNING id as like_id, user_id
    )
    SELECT 
        id AS comment_id, 
        $1 AS user_id,
        cardinality(array( SELECT id FROM likes WHERE comment_id = $2 ))
            + cardinality(array( SELECT like_id FROM like_comment )) AS likes,
        $1 = ANY(array( SELECT user_id FROM like_comment )) AS liked,
        post_id
    FROM comments WHERE id = $2
`

const unlikeCommentQuery = `
    WITH delete_like AS (
        DELETE FROM likes WHERE user_id = $1 AND comment_id = $2 AND post_id = $3
        RETURNING id as like_id
    )
    SELECT 
        id AS comment_id, 
        $1 AS user_id,
        cardinality(array( SELECT id FROM likes WHERE comment_id = $2 ))
            - cardinality(array( SELECT like_id FROM delete_like )) as likes,
        NOT $1 = ANY(array( SELECT user_id FROM delete_like )) AS liked,
        post_id
    FROM comments WHERE id = $2
`

module.exports = {
    postCommentQuery,
    postReplyQuery,
    getCommentsQuery,
    getCommentQuery,
    likeCommentQuery,
    unlikeCommentQuery
}