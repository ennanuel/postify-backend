const getGroupsQuery = (type) => `
    SELECT id, name, picture FROM groups 
    WHERE 
    ${
        type === 'single' ?
        'id = $1' :
        type === 'created' ? 
        'creator = $1' : 
        type === 'joined' ?
        '$1 = ANY (members) AND creator != $1' :
        type === 'invites' ?
        '$1 = ANY (invites)' :
        'NOT ( $1 = ANY(ARRAY_CAT(members, invites)) )'
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
        array( SELECT files[1] FROM posts WHERE group_id = $1 AND files[1] IS NOT NULL ) AS photos`
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
            type === 'video' || type === 'photo' ?
            `posts.id, 
            files[1] AS file,
            CARDINALITY(files) AS file_count,
            CARDINALITY(array(SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL)) AS like_count,
            CARDINALITY(array(SELECT id FROM comments WHERE post_id = posts.id)) AS comment_count` :
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
            cardinality(array(SELECT id FROM comments WHERE post_id = posts.id)) AS post_comments, 
            cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL)) AS post_likes,
            cardinality(array(SELECT id FROM share WHERE post_id = posts.id)) AS shares,
            cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND user_id = $2)) > 0 AS liked_post,
            date_posted,
            last_updated`
        }
    FROM posts 
    JOIN user_profile ON posts.user_id = user_profile.id
    JOIN groups ON posts.group_id = groups.id
    WHERE
    ${
        type === 'all' ?
        'posts.group_id = ANY (array( SELECT id FROM groups WHERE $1 = ANY(members) ))' :
        type === 'photo' ?
        'posts.group_id = $1 AND posts.post_type = \'photo\'' :
        type === 'video' ?
        'posts.group_id = $1 AND posts.post_type = \'video\'' :
        'posts.group_id = $1'
    }
`

const getMembersQuery = ( type ) => `
    SELECT user_profile.id, CONCAT(first_name, ' ', last_name) AS name, groups.creator = user_profile.id AS owner, profile_pic FROM groups 
    JOIN user_profile ON user_profile.id = ${type === 'invites' ? 'ANY (groups.invites)' : 'ANY (groups.members)'}
    WHERE groups.id = $1
`

const addOrRemoveMemberQuery = ( type ) => `
    UPDATE groups 
        SET members = ${type === 'add' ? 'array_append' : 'array_remove'}(members, $1),
            invites = array_remove(invites, $1)
    WHERE id = $2
        ${ type === 'add' ? 'AND NOT $1 = ANY (members)' : '' }
`

const getGroupInvitesQuery = `
    SELECT * FROM groups WHERE $1 = ANY (invites)
`

const addOrRemoveInviteQuery = ( type ) => `
    UPDATE groups 
        SET invites = ${type === 'invite' ? 'array_append' : 'array_remove'}(invites, $1) 
    WHERE id = $2
        ${ type === 'invite' ? 'AND NOT $1 = ANY(invites)' : '' }
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
        array(SELECT unnest(files) FROM delete_posts) AS files
    FROM delete_group;
`

module.exports = {
    getGroupsQuery,
    getGroupIdsQuery,
    getGroupInfoQuery,
    getGroupPostsQuery,
    getMembersQuery,
    addOrRemoveMemberQuery,
    getGroupInvitesQuery,
    addOrRemoveInviteQuery,
    createGroupQuery,
    editGroupQuery,
    deleteGroupQuery,
}