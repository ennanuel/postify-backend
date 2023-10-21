const searchUserQuery = `
    SELECT
        id,
        concat(first_name, ' ', last_name) AS name,
        profile_pic,
        active,
        bio,
        id = ANY(( SELECT unnest(friends) FROM user_interests WHERE id = $1 )) AS is_friend
    FROM user_profile
    WHERE first_name ILIKE ANY($2) OR last_name ILIKE ANY($2) OR username ILIKE ANY($2);
`;

const searchFriendQuery = `
    SELECT
        user_profile.id,
        concat(first_name, ' ', last_name) AS name,
        profile_pic,
        'TRUE'::BOOLEAN AS is_friend,
        active
    FROM user_interests
    INNER JOIN user_profile ON user_profile.id = ANY(user_interests.friends)
        AND (first_name ILIKE ANY($2) OR last_name ILIKE ANY($2) OR username ILIKE ANY($2))
    WHERE user_interests.id = $1
`

const searchGroupQuery = `
    SELECT
        id,
        name,
        group_desc,
        picture,
        cardinality(members) AS members,
        $1 = ANY(members) AS is_member,
        $1 = ANY(invites) AS invite,
        $1 = creator AS owner,
        tags
    FROM groups WHERE name ILIKE ANY($2);
`;

const searchChannelQuery = `
    SELECT
        id,
        name,
        channel_desc,
        picture,
        cardinality(followers) AS followers,
        $1 = ANY(array_append(followers, creator)) AS is_following,
        tags
    FROM channel WHERE name ILIKE ANY($2);
`;

const searchPostQuery = `
    SELECT
        posts.id,
        post_desc,
        profile_pic,
        concat(first_name, ' ', last_name) AS name,
        user_id,
        files,
        cardinality(array(SELECT id FROM comments WHERE post_id = posts.id)) AS post_comments, 
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND comment_id IS NULL)) AS post_likes,
        cardinality(array(SELECT id FROM share WHERE post_id = $1)) AS shares,
        cardinality(array(SELECT id FROM likes WHERE post_id = posts.id AND user_id = $1)) AS liked,
        $1 = user_id AS is_yours,
        post_type
    FROM posts
    JOIN user_profile ON user_id = user_profile.id
    WHERE post_desc ILIKE ANY($2) AND channel_id IS NULL;
`;

module.exports = {
    people: searchUserQuery,
    friend: searchFriendQuery,
    group: searchGroupQuery,
    channel: searchChannelQuery,
    post: searchPostQuery
}