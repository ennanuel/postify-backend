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
        $1 = $2 AS is_user
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
        username,
        concat(first_name, ' ', last_name) AS name,
        array(SELECT id FROM user_friends) AS friend_ids,
        array(SELECT profile_pic FROM user_friends) AS friend_pics,
        array(SELECT name FROM user_friends) AS friend_names,
        array(SELECT cardinality(mutual) FROM user_friends) AS friend_mutuals,
        array(SELECT file FROM user_posts) AS photos,
        cardinality(user_interests.friends) AS friend_count,
        school,
        hobbies,
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
        CARDINALITY(posts.comments) AS comment_count, 
        CARDINALITY(posts.likes) AS like_count,
        likes.user_id = $2 AS liked,
        shares,
        date_posted,
        last_updated,
        posts.user_id,
        CONCAT(first_name, ' ', last_name) AS name,
        profile_pic, 
        ${
            type === 'video' || type === 'photo' ?
            'files[0] AS file, cardinality(files) AS file_count,' :
            'files, '
        } 
        active
    FROM posts
    JOIN user_profile ON posts.user_id = user_profile.id
    LEFT JOIN likes ON likes.id = ANY (posts.likes)
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
    WITH mutual_friends AS (
            SELECT 
            user_profile.id,
            concat(first_name, ' ', last_name) AS name,
            user_profile.profile_pic,
            (
                SELECT 
                    array_agg(array1.value)
                FROM ( SELECT unnest(array_remove(friends, $1)) FROM user_interests WHERE id = $2 ) AS array1(value)
                JOIN unnest(array_remove(new_interests.friends, $1)) AS array2(value) ON array1.value = array2.value
            ) AS mutual,
            user_profile.id = ANY( SELECT unnest(friends) FROM user_interests WHERE id = $2 ) AS is_mutual
        FROM user_interests
        JOIN user_profile ON user_profile.id = ANY (user_interests.friends) 
        JOIN user_interests AS new_interests ON new_interests.id = user_profile.id
        WHERE user_interests.id = $1
    )
    SELECT 
        id,
        name,
        profile_pic,
        array(SELECT profile_pic FROM user_profile WHERE id = ANY (mutual)) AS mutual_pics,
        id = $2 AS is_user
    FROM mutual_friends
`

const editUserQuery = (entries) => `
    UPDATE user_profile SET ${entries.map(([key, value]) => `${key} = ${value}`).join(', ')} 
`;

const deleteUserQuery = ``;

module.exports = {
    getUserQuery,
    getFullUserQuery,
    getUserFriendsQuery,
    getUserPostsQuery,
    editUserQuery,
    deleteUserQuery
}