const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const users = {}; 

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (users[email]) {
        return res.status(400).send('Email already exists.');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    users[email] = { id, name, email, password: hashedPassword };

    req.session.user = { id, name, email };

    res.redirect('/html/profile.html');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users[email];

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Invalid email or password');
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };

    res.redirect('/html/profile.html');

    
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Logout failed');
        }
        res.redirect('/html/login.html');
    });
});

module.exports = router;
