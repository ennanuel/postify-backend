const bcrypt = require('bcrypt');
const postgres = require('../utils/postgres');
const jwt = require('jsonwebtoken');
const { checkInvalidQuery, findUserQuery } = require('../queries/auth');

const maxAge = 3 * 24 * 60 * 60

function validateRegisterPassword({ password, confirm_password }) { 
    const fieldIsEmpty = !password || password.length < 1 || !confirm_password || confirm_password.length < 1;
    const doNotMatch = password !== confirm_password;
    const isTooShort = password.length < 8;
    const doesNotContainDigit = !/\d/.test(password);
    const doesNotContainUppercase = !/[A-Z]/.test(password);
    const doesNotContainSpecialChar = !/[^(a-z|0-9)]/i.test(password);

    if (fieldIsEmpty) return { failed: true, key: 'password', message: 'field cannot be empty' };
    else if (doNotMatch) return { failed: true, key: 'confirm_password', message: 'passwords don\'t match' };
    else if (isTooShort) return { failed: true, key: 'password', message: 'password too short' };
    else if (doesNotContainDigit) return { failed: true, key: 'password', message: 'password must contain at least one digit' };
    else if (doesNotContainUppercase) return { failed: true, key: 'password', message: 'pasword must contain an uppercase letter' };
    else if (doesNotContainSpecialChar) return { failed: true, key: 'password', message: 'Must contain a special Character' };
    else return { failed: false };
};
async function validateRegisterEmail(email) {
    const query = 'SELECT cardinality(array(SELECT email FROM user_profile WHERE email = $1)) > 0 AS found_user';
    const result = await postgres.request({ query, values: [email] });
    const username_exists = result[0] && result[0].found_user;
    if (username_exists) return { failed: true, key: 'email', message: 'email already exists' };
    return { failed: false };
};
async function validateRegisterUsername(username) {
    const query = 'SELECT cardinality(array(SELECT username FROM user_profile WHERE username = $1)) > 0 AS found_user';
    const result = await postgres.request({ query, values: [username] });
    const username_exists = result[0] && result[0].found_user;
    if (username_exists) return { failed: true, key: 'username', message: 'username already exists' };
    return { failed: false };
};
function validateOtherRegisterValues(values) { 
    for (let [key, value] of values) {
        const refinedKey = key.split('_').join(' ')
        if (!value || value.length < 1) return { failed: true, key, message: `${refinedKey} cannot be empty` };
    };
    return { failed: false };
};
async function validateRegisterValues(values) {
    const { confirm_password, password, email, username, ...others } = values;
    const otherValues = Object.entries(others);
    const validateEmail = await validateRegisterEmail(email);
    const validateUsername = await validateRegisterUsername(username);
    const validatePassword = validateRegisterPassword({ password, confirm_password });
    const validateOthers = validateOtherRegisterValues(otherValues);
    if (validateEmail.failed) return validateEmail;
    else if (validateUsername.failed) return validateUsername;
    else if (validatePassword.failed) return validatePassword;
    else if (validateOthers.failed) return validateOthers
    else return { failed: false };
};

async function hashPassword(pword) {
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(pword, salt);
    return password
}

async function unhashPassword(pword, hashed) {
    const compare = await bcrypt.compare(pword, hashed)
    return compare
}

async function authMiddleware(req, res, next) {
    const userToken = req.cookies.userToken
    if (!userToken) return res.status(403).json({ message: 'You are not logged in' });
    const result = await postgres.request({ query: checkInvalidQuery, values: [userToken] });
    if(result[0]?.is_invalid) return res.status(403).json({ message: 'Invalid token' })
    jwt.verify(userToken, process.env.JWT_SEC, (err, decodedToken) => {
        if (err) {
            console.log(err.message);
            return res.status(403).json({ message: 'You cannot access website' })
        } else {
            req.query.user_id = decodedToken.id
            next();
        }
    });
}

async function createToken({ jwt_secret_key, username, password }) {
    if (!username || !password) return { failed: true, message: 'Fields cannot be empty' };
    const find_user = await postgres.request({ query: findUserQuery, values: [username] });
    const user_found = find_user[0];
    if (!user_found) return { failed: true, message: 'Username or email doesn\'t exist' };
    const { id, hashed_password } = user_found;
    const validate = await unhashPassword(password, hashed_password);
    if (!validate) return { failed: true, message: 'Your password is wrong' };
    const userToken = jwt.sign({ id }, jwt_secret_key, { expiresIn: maxAge });
    const options = { httpOnly: true, secure: false, maxAge: maxAge * 1000 };
    const cookie = { userToken, options};
    return { failed: false, cookie };
};

module.exports = {
    hashPassword,
    createToken,
    authMiddleware,
    validateRegisterValues
}