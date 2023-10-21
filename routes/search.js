const route = (require('express')).Router();
const { search } = require('../controllers/search');

route.get('/:q', search);

module.exports = route;