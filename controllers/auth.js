const { Client } = require('pg');
const { createUserQuery, loginQuery } = require('../queries/auth');
const runQuery = require('../dbHandler');

async function register (req, res) {
    for(let [key, values] of Object.entries(req.body)) {
        if(!values || values === '') return res.status(500).json({ message: `${key} cannot be empty` });
    }

    const { name, username, email, password } = req.body;
    const [first_name, last_name = ''] = name.split(' ')
    runQuery.request({res, query: createUserQuery, values: [ password, first_name, last_name, username, email ]})
}

async function login (req, res) {
    const { username, password } = req.body;

    runQuery.request({ res, query: loginQuery, values: [password, username], single: true })
}

async function logout (req, res) {

}

module.exports = {
    register,
    login,
    logout
}