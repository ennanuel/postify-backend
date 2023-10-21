const getMutualFriendsProfilPics = `
    SELECT profile_pic FROM user_profile WHERE id = ANY (array(
        SELECT unnest(array_agg(array1.value))
        FROM unnest(user_interests.friends) AS array1(value)
        JOIN (SELECT unnest(friends) FROM user_interests WHERE id = $1) AS array2(value) ON array1.value = array2.value
    ))
`;
const is_received_request = `array(
    SELECT unnest(users) FROM friend_groups
    WHERE user_id = user_profile.id
        AND group_type = 'main'
        AND group_name = 'sent_requests')
`;
const is_sent_request = `array(
    SELECT unnest(users) FROM friend_groups
    WHERE user_id = $1
        AND group_type = 'main'
        AND group_name = 'sent_requests')
`;

const getUsersQuery = (type) => `
    WITH quer1 AS (
        ${
            type !== 'suggestions' ?
            `
                SELECT users FROM friend_groups 
                WHERE user_id = $1
                    AND group_type = 'main'
                    AND group_name = ${type === 'sent' ? "'sent_requests'" : "'received_requests'"}
            ` :
            `
                SELECT 
                    array_cat( 
                        array(SELECT unnest(users) FROM friend_groups WHERE user_id = user_interests.id), 
                        array_append(friends, $1)
                    ) AS users
                FROM user_interests WHERE id = $1
            `
        }
    ) SELECT 
        user_profile.id,
        concat(first_name, ' ', last_name) AS name,
        user_profile.profile_pic,
        $1 = ANY(${is_received_request}) AS is_received_request,
        user_profile.id = ANY(${is_sent_request}) AS is_sent_request,
        array(${getMutualFriendsProfilPics}) AS mutual_pics
    FROM user_profile
    JOIN user_interests ON user_interests.id = user_profile.id
    WHERE ${ type === 'suggestions' ? 'NOT' : '' } user_interests.id = ANY ( SELECT unnest(users) FROM quer1 )
`;

const getFriendIdsQuery = `
    SELECT array(SELECT unnest(friends) FROM user_interests WHERE id = $1) AS results;
`

const addFriendQuery = `
    WITH remove_from_groups AS (
        UPDATE friend_groups 
            SET users = array_remove(users, $1)
        WHERE user_id = $2
            AND group_type = 'main' 
            AND group_name = 'sent_requests'
    ), remove_from_group2 AS (
        UPDATE friend_groups
            SET users = array_remove(users, $2)
        WHERE user_id = $1
            AND group_type = 'main'
            AND group_name = 'received_requests'
    ), remove_friend1 AS (
        UPDATE user_interests 
            SET friends = array_append(friends, $2)
            WHERE id = $1
    ), remove_friend2 AS (
        UPDATE user_interests 
            SET friends = array_append(friends, $1) 
        WHERE id = $2
    ) SELECT array[$1, $2] AS users
`;

const unFriendQuery = `
    WITH remove_from_groups AS (
        UPDATE friend_groups 
            SET users = array_remove(users, $1)
        WHERE user_id = $2
    ), remove_from_group2 AS (
        UPDATE friend_groups
            SET users = array_remove(users, $2)
        WHERE user_id = $1
    ), remove_friend1 AS (
        UPDATE user_interests 
            SET friends = array_remove(friends, $2)
            WHERE id = $1
    ), remove_friend2 AS (
        UPDATE user_interests 
            SET friends = array_remove(friends, $1) 
        WHERE id = $2
    ) SELECT array[$1, $2] AS users;
`;

const sendRequestQuery = `
    WITH update_sent AS (
        UPDATE friend_groups
            SET users = array_append(users, $2) 
        WHERE user_id = $1
            AND group_type = 'main' 
            AND group_name = 'sent_requests'
            AND NOT $2 = ANY(users)
        RETURNING user_id
    ), update_groups AS (
        UPDATE friend_groups
            SET users = array_append(users, $1) 
        WHERE user_id = $2
            AND group_type = 'main' 
            AND group_name = 'received_requests'
            AND NOT $2 = ANY (users)
        RETURNING user_id
    ) SELECT
        array_cat(array(SELECT user_id FROM update_sent), array(SELECT user_id FROM update_groups)) AS users;
`

const removeRequestQuery = `
    WITH update_sent AS (
        UPDATE friend_groups
            SET users =  array_remove(users, $2) 
        WHERE user_id = $1
            AND group_type = 'main' 
        RETURNING user_id
    ), update_groups AS (
        UPDATE friend_groups
            SET users = array_remove(users, $1) 
        WHERE user_id = $2
            AND group_type = 'main'
        RETURNING user_id
    ) SELECT
        array_cat(array(SELECT user_id FROM update_sent), array(SELECT user_id FROM update_groups)) AS users;
`

const getFriendsQuery = `
    SELECT 
        user_profile.id,
        CONCAT(first_name, ' ', last_name) AS name,
        profile_pic,
        'TRUE'::BOOLEAN AS is_friend,
        active
    FROM user_interests
    JOIN user_profile ON user_profile.id = ANY (user_interests.friends)
    WHERE user_interests.id = $1;
`

const getCustomGroupsQuery = `
    SELECT 
        id, 
        group_name,
        color,
        array( SELECT profile_pic FROM user_profile WHERE id = ANY(users) LIMIT 5 ) AS friend_pics,
        array( SELECT concat(first_name, ' ', last_name) AS name FROM user_profile WHERE id = ANY(users) LIMIT 3 ) AS friend_names,
        cardinality(users) AS friends_count
    FROM friend_groups
    WHERE user_id = $1 AND group_type = 'custom'
`

const getCustomGroupInfoQuery = (type) => `
    SELECT id, ${type === 'edit' ? 'users,' : ''} color, group_name FROM friend_groups WHERE id = $1;
`

const getCustomGroupFriendsQuery = `
    SELECT 
        user_profile.id, 
        CONCAT(first_name, ' ', last_name) AS name,
        profile_pic,
        active
    FROM friend_groups
    JOIN user_profile ON user_profile.id = ANY (friend_groups.users)
    WHERE friend_groups.id = $1;
`

const createCustomGroupQuery = `
    INSERT INTO friend_groups ( id, user_id, group_name, users, color ) VALUES (uuid_generate_v4(), $1, $2, $3, $4 );
`

const editCustomGroupQuery = `
    UPDATE friend_groups SET group_name = $3, users = $4, color = $5 WHERE id = $1 AND user_id = $2
`

const deleteCustomGroupQuery = `
    DELETE FROM friend_groups WHERE id = $1 AND user_id = $2;
`


module.exports = {
    getFriendsQuery,
    getFriendIdsQuery,
    getUsersQuery,
    sendRequestQuery,
    removeRequestQuery,
    addFriendQuery,
    unFriendQuery,
    getCustomGroupsQuery,
    getCustomGroupInfoQuery,
    getCustomGroupFriendsQuery,
    createCustomGroupQuery,
    editCustomGroupQuery,
    deleteCustomGroupQuery
}