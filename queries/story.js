const getStoriesQuery = (type) => `
    WITH stories AS (
        SELECT
            ${ type === 'more' ? 'array_agg(story.id)' : 'count(story.id)' } AS stories,
            user_profile.id AS user_id,
            max(time_posted) AS posted,
            profile_pic,
            username,
            user_profile.id = $1 AS is_yours,
            cardinality(array( SELECT id FROM story WHERE user_id = user_profile.id AND $1 = ANY(seen) )) AS seen,
            first_name AS name
        FROM story 
        JOIN user_profile ON story.user_id = user_profile.id
        WHERE user_id = $1 OR user_profile.id = ANY(SELECT unnest(friends) FROM user_interests WHERE id = $1)
        GROUP BY user_profile.id
    )
    SELECT
        stories.*,
        story.id,
        file,
        story_bg,
        story_type,
        story_desc
    FROM stories
    JOIN story ON
        story.time_posted = stories.posted
        AND story.user_id = stories.user_id
    ORDER BY posted DESC
`

const getStoryQuery = `
    SELECT 
        id,
        story_desc,
        file,
        story_bg,
        story_type,
        cardinality(likes) AS story_likes,
        cardinality(seen) AS views,
        $2 = ANY(seen) AS has_seen,
        time_posted,
        $2 = ANY(likes) liked,
        user_id = $2 AS is_yours
    FROM story
    WHERE id = $1
`

const createStoryQuery = `
    INSERT INTO story ( id, user_id, story_desc, story_bg, story_type, file ) VALUES ( uuid_generate_v4(), $1, $2, $3, $4, $5 )
`

const deleteStoryQuery = ``

const watchStoryQuery = `
    UPDATE story SET seen = array_append(seen, $2)
    WHERE id = $1 AND NOT (user_id = $2 OR $2 = ANY(seen))
`

module.exports = {
    getStoriesQuery,
    getStoryQuery,
    createStoryQuery,
    deleteStoryQuery,
    watchStoryQuery,
}