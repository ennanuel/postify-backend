const postgres = require("../utils/postgres");
const { getUserQuery, getFullUserQuery, getUserPostsQuery, getUserFriendsQuery, editUserQuery, getValuesQuery } = require('../queries/user')

async function getUser(req, res) {
    try {
        const { user_id } = req.params;
        const { other_user } = req.query;
        const result = await postgres.request({ query: getUserQuery, values: [user_id, other_user] });
        return res.status(200).json(result[0])
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message })
    }
};

async function getFullUser(req, res) {
    try { 
        const { user_id } = req.params;
        const { other_user } = req.query;
        const result = await postgres.request({ query: getFullUserQuery, values: [user_id, other_user] });
        return res.status(200).json(result[0])
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getUserFriends (req, res) {
    try { 
        const { user_id } = req.params;
        const { other_user } = req.query;
        const result = await postgres.request({ query: getUserFriendsQuery, values: [user_id, other_user] });
        return res.status(200).json(result);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getUserPosts (req, res) {
    try {
        const { user_id } = req.params;
        const { other_user, type } = req.query;
        const result = await postgres.request({ query: getUserPostsQuery(type), values: [user_id, other_user] });
        return res.status(200).json(result)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getUserValues(req, res) { 
    try {
        const { user_id } = req.params;
        const result = await postgres.request({ query: getValuesQuery, values: [user_id] });
        return res.status(200).json(result[0])
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function editUserInfo(req, res) {
    const {
        user_id,
        name,
        username,
        profile_pic,
        cover,
        bio,
        email,
        phone,
        address,
        country,
        work_string,
        education_string,
        hobbies_string,
        relationship_string
    } = req.body;
    const [work, education, hobbies, relationship] = [work_string, education_string, hobbies_string, relationship_string]
        .map(elem => JSON.parse(elem));
    const [first_name, last_name] = name.split(' ');
    const values = [ user_id, first_name, last_name, username, profile_pic, cover, bio, email, phone, address, country, relationship, work, hobbies, education ]
    await postgres.request({ values, query: editUserQuery });
    return res.status(200).json({ message: 'Profile edited' })
};

async function deleteUser () {};

module.exports = {
    getUser,
    getFullUser,
    getUserFriends,
    getUserPosts,
    getUserValues,
    editUserInfo,
    deleteUser
}