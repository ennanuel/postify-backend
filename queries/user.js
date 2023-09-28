const getUserQuery = `
    WITH user_friends AS (
        SELECT user_profile.id, profile_pic FROM user_interests 
        INNER JOIN user_profile ON user_profile.id = ANY (array_remove(user_interests.friends, $2))
        WHERE user_interests.id = $2
    )
    SELECT 
        user_profile.id,
        profile_pic,
        username,
        CONCAT(first_name, ' ', last_name) AS name,
        ARRAY( SELECT profile_pic FROM user_friends WHERE id = ANY (user_interests.friends) ) AS mutual_pics,
        CARDINALITY(ARRAY( SELECT profile_pic FROM user_friends WHERE id = ANY (user_interests.friends) )) AS mutual_friends,
        CARDINALITY(user_interests.friends) AS user_friends,
        $1 = $2 AS is_user,
        $1 = ANY(user_interests.friends) AS is_friend
    FROM user_profile 
    JOIN user_interests ON user_profile.id = user_interests.id
    WHERE user_profile.id = $1
`;

const getFullUserQuery = `
    WITH user_posts AS (
        SELECT files[0] AS file FROM posts WHERE user_id = $1 AND post_type = 'photo' LIMIT 6
    ), user_friends AS (
        SELECT 
            user_profile.id, 
            profile_pic, 
            CONCAT(first_name, ' ', last_name) AS name,
            (
                SELECT array_agg(array1.value)
                FROM ( SELECT unnest(array_remove(friends, $1)) FROM user_interests WHERE id = $2 ) AS array1(value)
                JOIN unnest(array_remove(new_interests.friends, $1)) AS array2(value) ON array1.value = array2.value
            ) AS mutual
        FROM user_interests 
        JOIN user_profile ON user_profile.id = ANY (user_interests.friends) AND user_profile.id != $2
        LEFT JOIN user_interests AS new_interests ON user_profile.id = new_interests.id
        WHERE user_interests.id = $1 LIMIT 6
    )
    SELECT 
        user_profile.id,
        profile_pic,
        cover,
        username,
        bio,
        concat(first_name, ' ', last_name) AS name,
        array(SELECT id FROM user_friends) AS friend_ids,
        array(SELECT profile_pic FROM user_friends) AS friend_pics,
        array(SELECT name FROM user_friends) AS friend_names,
        array(SELECT cardinality(mutual) FROM user_friends) AS friend_mutuals,
        array(SELECT file FROM user_posts) AS photos,
        cardinality(user_interests.friends) AS friend_count,
        education,
        hobbies,
        work,
        address,
        country,
        $1 = $2 AS is_user
    FROM user_profile
    JOIN user_interests ON user_profile.id = user_interests.id
    WHERE user_profile.id = $1
`

const getUserPostsQuery = (type) => `
    SELECT 
        posts.id, 
        post_desc,
        post_type,
        post_bg,
        cardinality(array(SELECT id FROM comments WHERE post_id = posts.id)) AS post_comments, 
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL)) AS post_likes,
        cardinality(array(SELECT id FROM share WHERE post_id = posts.id)) AS shares,
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND user_id = $2)) AS liked_post,
        date_posted,
        last_updated,
        posts.user_id,
        concat(first_name, ' ', last_name) AS name,
        profile_pic, 
        ${
            type === 'video' || type === 'photo' ?
            'files[0] AS file, cardinality(files) AS file_count,' :
            'files, '
        } 
        active
    FROM posts
    JOIN user_profile ON posts.user_id = user_profile.id
    WHERE posts.user_id = $1
    ${
    type === 'photo' ?
    "AND post_type = 'photo'" :
    type === 'video' ?
    "AND post_type = 'video'" :
    ''
    }
`

const getUserFriendsQuery = `
    SELECT 
        user_profile.id AS user_id,
        concat(first_name, ' ', last_name) AS name,
        user_profile.profile_pic,
        array(
            SELECT profile_pic FROM user_profile AS profile WHERE profile.id = ANY (array(
                SELECT 
                    unnest(array_agg(array1.value))
                FROM ( SELECT unnest(friends) FROM user_interests WHERE id = $2 ) AS array1(value)
                JOIN ( SELECT unnest(friends) FROM user_interests WHERE id = user_profile.id ) AS array2(value)
                    ON array1.value = array2.value
            ))
        ) AS mutual_pics,
        user_profile.id = ANY(array( SELECT unnest(friends) FROM user_interests WHERE id = $2 )) AS is_mutual,
        user_profile.id = $2 AS is_user
    FROM user_interests
    JOIN user_profile ON user_profile.id = ANY (user_interests.friends) 
    WHERE user_interests.id = $1
`
const getValuesQuery = `
    SELECT
        concat(first_name, ' ', last_name) AS name,
        username,
        profile_pic,
        cover,
        bio,
        email,
        phone,
        address,
        country,
        relationship,
        work,
        hobbies,
        education AS schools
    FROM user_profile
    WHERE id = $1
`

const editUserQuery = `
    UPDATE user_profile SET
        first_name = $2,
        last_name = $3,
        username = $4,
        profile_pic = $5,
        cover = $6,
        bio = $7,
        email = $8,
        phone = $9,
        address = $10,
        country = $11,
        relationship = $12,
        work = $13,
        hobbies = $14,
        education = $15
    WHERE id = $1
`;

const deleteUserQuery = ``;

module.exports = {
    getUserQuery,
    getFullUserQuery,
    getUserFriendsQuery,
    getUserPostsQuery,
    getValuesQuery,
    editUserQuery,
    deleteUserQuery
}