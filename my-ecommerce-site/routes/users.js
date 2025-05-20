const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    res.json({ user: req.session.user });  
});

router.get('/purchases', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.session.user.id;
    const purchases = req.app.locals.purchases?.[userId] || [];

    res.json({ purchases });
});

module.exports = router;