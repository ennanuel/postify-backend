function routesCrashProtection(req, res, next) {
    try {
        next();
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message })
    }
}

module.exports = {
    routesCrashProtection
}