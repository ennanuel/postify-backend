const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const maxAge = 3 * 24 * 60 * 60

// Hashing the user's password
async function hashPassword(pword) {
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(pword, salt);
    return password
}

async function unhashPassword(pword, hashed) {
    const compare = await bcrypt.compare(pword, hashed)
    return compare
}

function validateName(value) {
    const names = value.split(' ')
    for (let name of names) {
        if (!name || name.length < 1) return { failed: true, message: 'Name cannot be empty'}
        if (name.length > 255) return { failed: true, message: "Name is too long" }
    }
    return { failed: false }
}

function validatePassword(pword) {
    if (pword.length < 8) return { failed: true, msg: 'Must contain at least eight(8) characters' };
    if (!/[A-Z]/.test(pword)) return { failed: true, msg: 'Must contain at least one(1) uppercase letter' };
    if (!/\d/.test(pword)) return { failed: true, msg: 'Must contain at least one(1) number character' };
    // Change this later
    if (!/[^a-z|\D]/.test(pword)) return { failed: true, msg: 'Must contain special character (eg: !, #, @...)' };
    return { failed: false }
}

function validateEmail(email) {
    return { failed: false }
}

function validateUsername(uname) { 
    return { failed: false }
}

function validate(values) {
    for(let [key, value] of Object.entries(values)) {
        if (!values || value === '') return { failed: true, msg: `${key} field cannot be empty.` };
        let check = {};
        switch (key) {
            case 'name':
                check = validateName(value);
                break;
            case 'email':
                check = validateEmail(value)
                break;
            case 'username':
                check = validateUsername(value);
                break;
            case 'password':
                check = validatePassword(value);
                break;
        }
        if (check.failed) return check;
    }
    return { failed: false }
}

function authMiddleware(req, res, next) {
    const userToken = req.cookies.userToken
    if (!userToken) return res.status(403).json({ message: 'You are not logged in' });
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

async function createToken({ res, secret, password, id, hashed }) {
    if (!id) return { status: 403, message: 'No user found' };
    const validate = await unhashPassword(password, hashed)
    if (!validate) return { status: 403, message: 'Your password is wrong!' };
    const userToken = jwt.sign({ id }, secret, { expiresIn: maxAge });
    res.cookie('userToken', userToken, { httpOnly: true, secure: false, maxAge: maxAge * 1000 });
    return { status: 200, message: 'User found', id };
};

module.exports = {
    hashPassword,
    validate,
    createToken,
    authMiddleware
}