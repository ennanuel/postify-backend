const searchQueries = require('../queries/search');
const postgres = require('../utils/postgres')

async function search(req, res) { 
    try {
        const { q } = req.params
        const { user_id, type } = req.query;
        const searchValues = q.split(' ').map(val => '%' + val + '%');
        const result = { friend: [], people: [], channel: [], group: [], post: [] };
        for (let [key, query] of Object.entries(searchQueries)) {
            if (key !== type && type && type !== 'all') continue;
            const request = await postgres.request({ query, values: [user_id, searchValues] });
            result[key] = request;
        };
        return res.status(200).json(result);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    search
}