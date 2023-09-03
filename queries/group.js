const getGroupsQuery = (type) => `
    SELECT id, name FROM groups 
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

const getGroupInfoQuery = (type) => `
    WITH group_members AS (
        SELECT profile_pic FROM groups
        JOIN user_profile ON user_profile.id = ANY( groups.members )
        WHERE groups.id = $1
    )
    ${
        type === 'full' ?
        `, group_photos AS (
            SELECT files[1] AS photo FROM posts WHERE group_id = $1
        )
        SELECT 
            groups.id, 
            group_desc, CONCAT(first_name, \' \', last_name) AS creator, 
            tags, 
            CARDINALITY(ARRAY( SELECT profile_pic FROM group_members )) AS members,
            ARRAY(SELECT photo FROM group_photos WHERE photo IS NOT NULL) AS photos
        FROM groups
        JOIN user_profile ON user_profile.id = groups.creator
        WHERE groups.id = $1` :
        `SELECT 
            groups.id, 
            name, 
            ARRAY( SELECT profile_pic FROM group_members LIMIT 10) AS member_pics, 
            creator
        FROM groups JOIN user_profile ON user_profile.id = groups.creator
        WHERE groups.id = $1`
    }
    
`

const getGroupPostsQuery = (type) => `
    ${
        type === 'all' ?
        `WITH get_groups AS (
            SELECT id AS group_posts FROM groups 
            WHERE $1 = ANY (members)
        )` : ''
    }
    SELECT 
        ${
            type === 'video' || type === 'photo' ?
            `posts.id, 
            files[1] AS file,
            CARDINALITY(files) AS file_count,
            CARDINALITY(likes) AS like_count,
            CARDINALITY(comments) AS comment_count` :
            `posts.id, 
            post_desc,
            post_type,
            post_bg,
            CARDINALITY(posts.comments) AS post_comments, 
            CARDINALITY(posts.likes) AS post_likes,
            shares,
            likes.user_id = posts.user_id AS liked_post,
            date_posted,
            last_updated,
            posts.user_id,
            CONCAT(first_name, ' ', last_name) AS name,
            profile_pic, 
            active`
        }
    FROM posts 
    JOIN user_profile ON posts.user_id = user_profile.id
    ${
        type !== 'video' || type !== 'photo' ? 'LEFT JOIN likes ON likes.id = ANY (posts.likes)' : ''
    }
    WHERE
    ${
        type === 'all' ?
        'posts.group_id = ANY (ARRAY(SELECT group_posts FROM get_groups))' :
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
    SET members = ${type === 'add' ? 'ARRAY_APPEND' : 'ARRAY_REMOVE'}(members, $2),
        invites = ARRAY_REMOVE(invites, $2)
    WHERE id = $1;
`

const getGroupInvitesQuery = `
    SELECT * FROM groups WHERE $1 = ANY (invites)
`

const addOrRemoveInviteQuery = ( type ) => `
    UPDATE groups 
        SET invites = ${type == 'add' ? 'ARRAY_APPEND' : 'ARRAY_REMOVE'}(invites, $2) 
    WHERE id = $1;
`

const createGroupQuery = `
    INSERT INTO groups ( id, name, group_desc, creator, members, tags, invites ) 
    VALUES ( uuid_generate_v4(), $2, $3, $1, $4, $5, $6 ) 
`

const editGroupQuery = `
    UPDATE groups 
        SET name = $2, group_desc = $3, tags = $4
    WHERE id = $1
`

const deleteGroupQuery = `
    DELETE FROM groups WHERE id = $1;
`

module.exports = {
    getGroupsQuery,
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