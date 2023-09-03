const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

function runQuery ({res, query, values, single = false, noResult = false}) {
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
            (err, qRes) => {
                console.log('running...')
                if(!err) {
                    console.log('success!')
                    client.end();
                    return res.status(200).json(
                        single ? 
                        qRes.rows[0] : 
                        noResult ?
                        { message: 'task successful' } :
                        qRes.rows
                    )
                } else {
                    client.end()
                    console.log(err.message)
                    return res.status(500).json({ message: err.message })
                }
            }
        )
    } catch (error) {
        const { message } = error

        console.error('failed: ', message)

        return res.status(500).json({ message })
    }
}

module.exports = runQuery;