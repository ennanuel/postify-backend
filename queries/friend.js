const getFriendRequestsQuery = `
    WITH quer1 AS (
        SELECT users FROM friend_groups 
        WHERE user_id = $1
            AND group_type = 'main'
            AND group_name = 'received_requests'
    ), quer2 AS (
        SELECT friends FROM user_interests WHERE id = $1
    ), quer3 AS (
        SELECT 
            user_profile.id, 
            profile_pic,
            CONCAT(first_name, ' ', last_name) AS name,
            user_interests.friends
        FROM user_profile 
        JOIN user_interests ON user_interests.id = user_profile.id
        WHERE user_profile.id = ANY ( SELECT UNNEST(users) FROM quer1 )
    ), quer4 AS (
        SELECT id, CONCAT(first_name, ' ', last_name) AS name, profile_pic FROM quer2
        JOIN user_profile ON user_profile.id = ANY (quer2.friends)
        WHERE id = ANY ( SELECT UNNEST(friends) FROM quer3 )
    ), quer5 AS (
        SELECT 
            id, 
            name, 
            ( SELECT profile_pic FROM quer4 WHERE quer4.id = ANY ( friends ) ) AS mutual_pic
        FROM quer3
    )
    SELECT * FROM quer5;
`;

const getSentRequestsQuery = `
    WITH quer1 AS (
        SELECT users FROM friend_groups 
        WHERE user_id = $1
            AND group_type = 'main'
            AND group_name = 'sent_requests'
    ), quer2 AS (
        SELECT friends FROM user_interests WHERE id = $1
    ), quer3 AS (
        SELECT 
            user_profile.id, 
            profile_pic,
            CONCAT(first_name, ' ', last_name) AS name,
            user_interests.friends
        FROM user_profile 
        JOIN user_interests ON user_interests.id = user_profile.id
        WHERE user_profile.id = ANY ( SELECT UNNEST(users) FROM quer1 )
    ), quer4 AS (
        SELECT id, CONCAT(first_name, ' ', last_name) AS name, profile_pic FROM quer2
        JOIN user_profile ON user_profile.id = ANY (quer2.friends)
        WHERE id = ANY ( SELECT UNNEST(friends) FROM quer3 )
    ), quer5 AS (
        SELECT 
            id, 
            name, 
            ( SELECT profile_pic FROM quer4 WHERE quer4.id = ANY ( friends ) ) AS mutual_pic
        FROM quer3
    )
    SELECT * FROM quer5;
`

const getFriendSuggestionQuery = `
    WITH quer1 AS (
        SELECT users FROM friend_groups WHERE user_id = $1
    ), quer2 AS (
        SELECT friends FROM user_interests 
        WHERE NOT (
            id != $1
            OR id = ANY ( SELECT UNNEST(users) FROM quer1 )
        )
    ), quer3 AS (
        SELECT 
            user_profile.id, 
            profile_pic,
            CONCAT(first_name, ' ', last_name) AS name,
            user_interests.friends
        FROM user_profile 
        JOIN user_interests ON user_interests.id = user_profile.id
        WHERE NOT (
            user_profile.id = ANY ( SELECT UNNEST(users) FROM quer1 )
            OR user_profile.id = ANY ( SELECT UNNEST(friends) FROM quer2 )
            OR user_profile.id = $1
        )
    ), quer4 AS (
        SELECT id, CONCAT(first_name, ' ', last_name) AS name, profile_pic FROM quer2
        JOIN user_profile ON user_profile.id = ANY (quer2.friends)
        WHERE id = ANY ( SELECT UNNEST(friends) FROM quer3 )
    ), quer5 AS (
        SELECT 
            id, 
            name, 
            ( SELECT profile_pic FROM quer4 WHERE quer4.id = ANY ( friends ) ) AS mutual_pic
        FROM quer3
    )
    SELECT * FROM quer5;
`

const addFriendQuery = `
    WITH remove_received AS (
        UPDATE friend_groups
            SET users = ARRAY_REMOVE(users, $2) 
            WHERE user_id = $1
                AND group_type = 'main' 
                AND group_name = 'received_requests'
    ), remove_sent AS (
        UPDATE friend_groups
            SET users = ARRAY_REMOVE(users, $1) 
            WHERE user_id = $2
                AND group_type = 'main' 
                AND group_name = 'sent_requests'
    ), add_friend AS (
        UPDATE user_interests 
            SET friends = ARRAY_APPEND(friends, $2) 
            WHERE id = $1
    ) UPDATE user_interests 
        SET friends = ARRAY_APPEND(friends, $1) 
        WHERE id = $2;
`

const sendFriendRequestQuery = `
    WITH update_sent AS (
        UPDATE friend_groups
            SET users =  ARRAY_APPEND(users, $2) 
        WHERE user_id = $1
            AND group_type = 'main' 
            AND group_name = 'sent_requests'
    ) UPDATE friend_groups
        SET users = ARRAY_APPEND(users, $1) 
    WHERE user_id = $2
        AND group_type = 'main' 
        AND group_name = 'received_requests';
`

const removeFriendRequestQuery = `
    WITH remove_sent AS (
        UPDATE friend_groups
            SET users =  ARRAY_REMOVE(users, $2) 
        WHERE user_id = $1
            AND group_type = 'main' 
            AND group_name = 'sent_requests'
    ) UPDATE friend_groups
        SET users = ARRAY_REMOVE(users, $1) 
    WHERE user_id = $2
        AND group_type = 'main' 
        AND group_name = 'received_requests';
`

const unfriendQuery = `
    WITH remove_from_groups AS (
        UPDATE friend_groups 
            SET users = ARRAY_REMOVE(users, $1)
        WHERE user_id = $2
    ), remove_from_group2 AS (
        UPDATE friend_groups
            SET users = ARRAY_REMOVE(users, $2)
        WHERE user_id = $1
    ), add_friend AS (
        UPDATE user_interests 
            SET friends = ARRAY_REMOVE(friends, $2) 
            WHERE id = $1
    ) UPDATE user_interests 
        SET friends = ARRAY_REMOVE(friends, $1) 
        WHERE id = $2;
`

const getFriendsQuery = `
    SELECT 
        user_profile.id,
        CONCAT(first_name, ' ', last_name) AS name,
        profile_pic,
        active
    FROM user_profile
    JOIN user_interests ON user_profile.id = ANY ( user_interests.friends )
    WHERE user_interests.id = $1
`

const getCustomGroupsQuery = `
    WITH group_friends AS (
        SELECT 
            profile_pic, 
            CONCAT(first_name, ' ', last_name) AS name 
        FROM friend_groups
        JOIN user_profile ON user_profile.id = ANY (friend_groups.users)
        WHERE friend_groups.user_id = $1
    )
    SELECT 
        id, 
        group_name, 
        ARRAY( SELECT profile_pic FROM group_friends LIMIT 5 ) AS friend_pics,
        ARRAY( SELECT name FROM group_friends LIMIT 3 ) AS friend_names,
        CARDINALITY(ARRAY( SELECT profile_pic FROM group_friends )) AS friends_count
    FROM friend_groups
    WHERE user_id = $1 AND group_type = 'custom'
`

const getCustomGroupInfoQuery = `
    SELECT id, group_name FROM friend_groups WHERE id = $1;
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

module.exports = {
    getFriendsQuery,
    getFriendRequestsQuery,
    getSentRequestsQuery,
    sendFriendRequestQuery,
    removeFriendRequestQuery,
    addFriendQuery,
    getFriendSuggestionQuery,
    unfriendQuery,
    getCustomGroupsQuery,
    getCustomGroupInfoQuery,
    getCustomGroupFriendsQuery,
}