const { createUserQuery, loginQuery, getUserQuery, logoutQuery } = require('../queries/auth');
const postgres = require('../utils/postgres');
const { validate, hashPassword, createToken } = require('../functions/auth');

async function register(req, res) {
    try {
        const { name, username, email, password } = req.body;
        const checkValues = validate({ name, username, email, password })
        if (checkValues.failed) return res.status(500).json({ message: checkValues.msg });
        const [first_name, last_name = ''] = name.split(' ')
        const hashedPassword = await hashPassword(password);
        const result = await postgres.request({ query: createUserQuery, values: [hashedPassword, first_name, last_name, username, email] });
    return res.status(200).json(result)        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function getUser(req, res) {
    try {
        const { user_id } = req.query;
        const result = await postgres.request({ query: getUserQuery, values: [user_id] });
        return res.status(200).json(result[0]);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
}

async function login(req, res) {
    try {
        const { username, password } = req.body;
        const result = await postgres.request({
            query: loginQuery,
            values: [username],
        })
        const user = result[0];
        const { status, ...others } = await createToken({ res, password, secret: process.env.JWT_SEC, ...user });
        return res.status(status).json(others);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message })
    }
}

async function logout (req, res) {
    const { userToken } = req.cookies;
    await postgres.request({ query: logoutQuery, values: [userToken] });
    return res.status(200).json({ message: 'user logged out'})
}

module.exports = {
    register,
    login,
    logout,
    getUser
}