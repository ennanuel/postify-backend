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
        $2 = ANY(user_interests.friends) AS is_friend
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
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND user_id = $2)) AS liked,
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

const deleteUserQuery = `
    WITH delete_cred AS (
        DELETE FROM user_cred WHERE id = $1
    ), delete_profile AS (
        DELETE FROM user_profile WHERE id =$1
        RETURNING profile_pic, cover
    ), delete_interests AS (
        DELETE FROM user_interests WHERE id = $1
        RETURNING friends
    ), delete_user_friends AS (
        DELETE FROM friend_groups WHERE user_id = $1
    ), remove_from_friend_group AS (
        UPDATE friend_groups SET users = array_remove(users, $1) WHERE $1 = ANY(users)
    ), remove_from_friends AS (
        UPDATE user_interests SET friends = array_remove(friends, $1) WHERE $1 = ANY(friends)
    ), delete_groups AS (
        DELETE FROM groups WHERE creator = $1
        RETURNING id AS group_id
    ), remove_from_groups AS (
        UPDATE groups SET members = array_remove(members, $1), invites = array_remove(invites, $1)
        WHERE $1 = ANY(array_cat(invites, members))
    ), delete_channels AS (
        DELETE FROM channel WHERE creator = $1
        RETURNING id AS channel_id
    ), remove_from_channel AS (
        UPDATE channel SET followers = array_remove(followers, $1)
        WHERE $1 = ANY(followers)
    ), delete_posts AS (
        DELETE FROM posts WHERE user_id = $1 OR group_id = ANY(array(SELECT group_id FROM delete_groups))
        RETURNING id AS post_id, files, post_type
    ), delete_stories AS (
        DELETE FROM story WHERE user_id = $1
        RETURNING id AS story_id, file, story_type
    ), delete_comments AS (
        DELETE FROM comments WHERE post_id = ANY(array(SELECT post_id FROM delete_posts)) OR user_id = $1
        RETURNING id AS comment_id
    ), delete_replies AS (
        DELETE FROM comments WHERE reply_to = ANY(array(SELECT comment_id FROM delete_comments))
        RETURNING id AS reply_id
    ), delete_likes AS (
        DELETE FROM likes WHERE user_id = $1
            OR post_id = ANY(array(SELECT post_id FROM delete_posts))
            OR comment_id = ANY(array(SELECT comment_id FROM delete_comments))
            OR comment_id = ANY(array(SELECT reply_id FROM delete_replies))
    ) SELECT
        array(SELECT unnest(files) FROM delete_posts WHERE NOT post_type = 'text') AS post_files,
        array(SELECT file FROM delete_stories WHERE NOT story_type = 'text') AS story_files,
        profile_pic AS picture,
        cover
    FROM delete_profile;
`;

module.exports = {
    getUserQuery,
    getFullUserQuery,
    getUserFriendsQuery,
    getUserPostsQuery,
    getValuesQuery,
    editUserQuery,
    deleteUserQuery
}