const getCommentQuery = `
    SELECT
        comments.id,
        content,
        date_uploaded,
        user_profile.id AS user_id,
        concat(first_name, ' ', last_name) AS name,
        profile_pic,
        cardinality(array(SELECT id FROM likes WHERE comment_id = comments.id)) AS likes,
        cardinality(array(SELECT id FROM comments WHERE reply_to = $1)) AS comments
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
        cardinality(array(SELECT id FROM comments AS comment WHERE reply_to = comments.id)) AS comments
    FROM comments
    JOIN user_profile ON user_profile.id = comments.user_id
    WHERE comments.post_id = $1 
    ${
        type === 'replies' ?
        'AND reply_to = $2' :
        ''
    };
`

const postCommentQuery = (action) =>  `
    INSERT INTO comments (id, post_id, user_id, content ${action === 'reply' ? ', reply_to' : ''}) 
    VALUES ( uuid_generate_v4(), $1, $2, $3 ${action === 'reply' ? ',$4' : ''} )
`

module.exports = {
    postCommentQuery,
    getCommentsQuery,
    getCommentQuery,
}