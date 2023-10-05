const createUserQuery = `
    WITH ins1 AS (
        INSERT INTO user_cred ( id, password ) VALUES ( uuid_generate_v4(), $1 )
        RETURNING id AS userId
    ), ins2 AS (
        INSERT INTO user_profile ( id, first_name, last_name, username, email )
        SELECT userId, $2, $3, $4, $5 FROM ins1
    ), ins3 AS (
        INSERT INTO user_interests ( id ) SELECT userId FROM ins1
    ), ins4 AS (
        INSERT INTO friend_groups ( id, user_id, group_name, group_type, users )
        SELECT uuid_generate_v4(), userId, 'received_requests', 'main', '{}' FROM ins1
    ) INSERT INTO friend_groups ( id, user_id, group_name, group_type, users )
    SELECT uuid_generate_v4(), userId, 'sent_requests', 'main', '{}' FROM ins1;
`;

const loginQuery = `
    SELECT 
        user_cred.id,
        user_cred.password AS hashed
    FROM user_cred 
    JOIN user_profile ON user_profile.id = user_cred.id
    WHERE user_profile.email = $1 OR user_profile.username = $1;
`;

const getUserQuery = `
    SELECT
        id,
        concat(first_name, ' ', last_name) AS name,
        username,
        profile_pic
    FROM user_profile WHERE id = $1
`

const logoutQuery = `
    INSERT INTO invalid ( token ) VALUES ( $1 )
`

const checkInvalidQuery = `
    SELECT $1 = ANY(array( SELECT token FROM invalid )) AS is_invalid
`

const deleteUserQuery = ``

module.exports = {
    createUserQuery,
    loginQuery,
    getUserQuery,
    deleteUserQuery,
    logoutQuery,
    checkInvalidQuery
}