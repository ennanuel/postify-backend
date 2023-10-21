const getGroupsQuery = (fetchType) => `
    SELECT
        id,
        name,
        picture,
        cardinality(members) AS members,
        $1 = ANY(members) AS is_member,
        $1 = ANY(invites) AS invite
    FROM groups
    WHERE 
    ${
        fetchType === 'single' ?
        'id = $1' :
        fetchType === 'created' ? 
        'creator = $1' : 
        fetchType === 'joined' ?
        '$1 = ANY (members) AND creator != $1' :
        fetchType === 'invites' ?
        '$1 = ANY (invites)' :
        'NOT ( $1 = ANY(array_cat(members, invites)) )'
    }
    ORDER BY members;
`

const getGroupIdsQuery = `
    SELECT array(SELECT id FROM groups WHERE $1 = ANY(members)) AS results;
`

const getGroupInfoQuery = (type) => `
    SELECT 
        groups.id, 
        $2 = creator AS owner,
        $2 = ANY(members) AS is_member,
        groups.picture,
        groups.cover,
        name,
    ${
        type === 'full' ?
        `group_desc, 
        concat(first_name, ' ', last_name) AS creator, 
        tags, 
        cardinality(array( SELECT profile_pic FROM user_profile WHERE id = ANY (groups.members) )) AS members,
        array( SELECT unnest(files) FROM posts WHERE group_id = $1 AND post_type = 'photo' ) AS photos`
        :
        'array( SELECT profile_pic FROM user_profile WHERE id = ANY (groups.members) LIMIT 10 ) AS member_pics'
    }
    FROM groups 
    ${type === 'full' ? 'JOIN user_profile ON user_profile.id = groups.creator' : ''}
    WHERE groups.id = $1
`

const getGroupPostsQuery = (type) => `
    SELECT 
        ${
            /(video|photo)/i.test(type) ?
            `posts.id, 
            files[1] AS file,
            post_type,
            cardinality(files) AS file_count,` :
            `
            groups.id AS group_id, 
            groups.name AS group_name, 
            posts.user_id,
            concat(first_name, ' ', last_name) AS name,
            profile_pic, 
            active,
            posts.id, 
            post_desc,
            post_type,
            post_bg,
            files,
            cardinality(array(SELECT id FROM share WHERE post_id = posts.id)) AS shares,
            date_posted,
            last_updated,`
        }
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND user_id = $2)) > 0 AS liked,
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL)) AS post_likes,
        cardinality(array(SELECT id FROM comments WHERE post_id = posts.id)) AS post_comments
    FROM posts 
    JOIN user_profile ON posts.user_id = user_profile.id
    JOIN groups ON posts.group_id = groups.id
    WHERE
    ${
        type === 'all' ?
        'posts.group_id = ANY (array( SELECT id FROM groups WHERE $1 = ANY(members) ))' :
        type === 'photo' ?
        "posts.group_id = $1 AND posts.post_type = 'photo'" :
        type === 'video' ?
        "posts.group_id = $1 AND posts.post_type = 'video'" :
        'posts.group_id = $1'
    }
`

const getMembersQuery = ( type ) => `
    SELECT
        user_profile.id,
        concat(first_name, ' ', last_name) AS name,
        groups.creator = user_profile.id AS is_owner,
        $2 = user_profile.id AS is_user,
        user_profile.id = ANY(groups.invites) AS is_invited,
        $2 = groups.creator AS is_group_owner,
        profile_pic
    FROM groups
    JOIN user_profile ON user_profile.id = ${type === 'invites' ? 'ANY (groups.invites)' : 'ANY (groups.members)'}
    WHERE groups.id = $1
`

const getFriendsToInviteQuery = `
    WITH invites_members AS (
        SELECT array_cat(members, invites) AS people FROM groups WHERE id = $2
    )
    SELECT user_profile.id, concat(first_name, ' ', last_name) AS name, profile_pic
    FROM user_interests
    JOIN user_profile
        ON user_profile.id = ANY(user_interests.friends)
        AND NOT user_profile.id = ANY(( SELECT unnest(people) FROM invites_members ))
    WHERE user_interests.id = $1
`

const removeUserFromGroupQuery = `
    UPDATE groups 
        SET members = array_remove(members, $1),
            invites = array_remove(invites, $1)
    WHERE id = $2 AND $1 != creator
    RETURNING id AS group_id, $1 AS user_id
`

const addUserToGroupQuery = `
    UPDATE groups 
        SET members = array_append(members, $1),
            invites = array_remove(invites, $1)
    WHERE id = $2 AND NOT $1 = ANY (members)
    RETURNING id AS group_id, $1 AS user_id
`

const getGroupInvitesQuery = `
    SELECT * FROM groups WHERE $1 = ANY (invites)
`

const inviteUsertoGroupQuery = `
    UPDATE groups 
        SET invites = array_append(invites, $1) 
    WHERE id = $2 AND NOT $1 = ANY(invites) AND NOT $1 = ANY(members)
    RETURNING id AS group_id, $1 AS user_id
`

const removeUserGroupInviteQuery = `
    UPDATE groups 
        SET invites = array_remove(invites, $1) 
    WHERE id = $2
    RETURNING id AS group_id, $1 AS user_id
`

const createGroupQuery = `
    INSERT INTO groups ( id, name, group_desc, creator, members, tags, invites, picture, cover ) 
    VALUES ( uuid_generate_v4(), $2, $3, $1, $4, $5, $6, $7, $8 ) 
`

const editGroupQuery = `
    UPDATE groups SET
        name = $3,
        group_desc = $4,
        tags = $5,
        picture = $6,
        cover = $7
    WHERE id = $1 AND creator = $2
`

const deleteGroupQuery = `
    WITH delete_group AS (
        DELETE FROM groups WHERE id = $1 AND creator = $2
        RETURNING id AS group_id, picture, cover
    ), delete_posts AS (
        DELETE FROM posts WHERE group_id = ANY(array( SELECT group_id FROM delete_group ))
        RETURNING id AS post_id, files
    ), delete_comments AS (
        DELETE FROM comments WHERE post_id = ANY(array( SELECT post_id FROM delete_posts ))
    ), delete_likes AS (
        DELETE FROM likes WHERE post_id = ANY(array( SELECT post_id FROM delete_posts ))
    ) SELECT
        picture,
        cover,
        array(SELECT unnest(files) FROM delete_posts) AS post_files,
        '{}'::varchar[] AS story_files
    FROM delete_group;
`

module.exports = {
    getGroupsQuery,
    getGroupIdsQuery,
    getGroupInfoQuery,
    getGroupPostsQuery,
    getMembersQuery,
    getFriendsToInviteQuery,
    getGroupInvitesQuery,
    addUserToGroupQuery,
    removeUserFromGroupQuery,
    inviteUsertoGroupQuery,
    removeUserGroupInviteQuery,
    createGroupQuery,
    editGroupQuery,
    deleteGroupQuery,
}