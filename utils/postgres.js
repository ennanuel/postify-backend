const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const request = ({query, values}) => new Promise((resolve, reject) => {
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD
    })
    try {
        client.connect();
        client.query(
            query,
            values,
            function (err, res) {
                client.end();
                if (!err) resolve(res.rows);
                else reject(err);
            }
        )
    } catch (error) {
        reject(error);
    }
}
)

function socket({ io, socket, query, values, eventName, extras = {} }) {
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD
    })
    
    try {
        client.connect()
        client.query(
            query,
            values,
            (err, res) => {
                console.log('running...')
                if (!err) {
                    io.emit(eventName, { ...res.rows[0], ...extras })
                    console.log('socket success!')
                    client.end();
                } else {
                    socket.emit('event-error', { message: err.message })
                    client.end()
                    console.log(err.message)
                }
            }
        )
    } catch (error) {
        socket.emit('event-error', { message: error.message })
    }
}

module.exports = { request, socket };