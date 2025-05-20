const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const purchases = {};
const allProducts = require('./data/product');
const productRoutes = require('./routes/products');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();
const PORT = 3000;

app.get('/products/search', (req, res) => {
    const query = req.query.query?.toLowerCase();

    const matchedProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(query)
    );

    if (matchedProducts.length === 0) {
        return res.send(`
            <h1>No products found for "${query}"</h1>
            <a href="/">Go Back</a>
        `);
    }

    const resultsHtml = matchedProducts.map(product => `
        <div class="product-card">
            <a href="${product.link}">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>$${product.price.toFixed(2)}</p>
            </a>
        </div>
    `).join('');    

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Vanguard Market - Search Results</title>
            <link rel="stylesheet" href="/public/css/styles.css">
        </head>
        <body>
            <header>
                <nav>
                    <h2>How can we help?</h2>
                    <div class="search-bar">
                        <form action="/products/search" method="get">
                            <input type="text" name="query" placeholder="Search products...">
                            <button type="submit">Search</button>
                        </form>
                    </div>
                    <ul class="nav-links">
                        <li><a href="/html/index.html">Home</a></li>
                        <li><a href="/html/login.html">Login</a></li>
                        <li><a href="/html/cart.html">Cart</a></li>
                        <li><a href="/html/about.html">About Us</a></li>
                        <li><a href="/html/faq.html">FAQ</a></li>
                        <li><a href="/html/profile.html">Profile</a></li>
                    </ul>
                </nav>
            </header>

            <h1>Search Results for "${query}"</h1>
            <div class="product-grid">
                ${resultsHtml}
            </div>

            <footer>
                <nav>
                    <ul>
                        <li><a href="/html/about.html">About Us</a></li>
                        <li><a href="/html/faq.html">FAQ</a></li>
                    </ul>
                </nav>
                <p>&copy; 2025 Vanguard Market. All rights reserved.</p>
            </footer>
        </body>
        </html>
    `);
});

app.use(session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: './data' }),
    secret: 'vanguardSecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/products', express.static(__dirname + '/products'));

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/cart', cartRoutes);
app.use('/products', productRoutes);

app.get('/api/check-login', (req, res) => {
    if (req.session && req.session.user) {
      res.json({ loggedIn: true, user: req.session.user });
    } else {
      res.json({ loggedIn: false });
    }
  });
  
app.get('/cart', (req, res) => {
    res.json(req.session.cart || []);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

app.get('/html/:page', (req, res) => {
    const publicPages = ['login.html', 'index.html', 'about.html', 'faq.html'];

    if (!publicPages.includes(req.params.page) && !req.session.user) {
        return res.redirect('/html/login.html');
    }

    res.sendFile(path.join(__dirname, 'html', req.params.page));
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const users = require('./data/users.json');
    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        req.session.user = user;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Username or password is incorrect" });
    }
});

app.post('/purchase', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const userEmail = req.session.user.email;
    const purchase = req.body;

    if (!purchases[userEmail]) {
        purchases[userEmail] = [];
    }
    purchases[userEmail].push(purchase);

    res.json({ message: 'Purchase successful' });
});

app.post('/cart/checkout', (req, res) => {
    if (!req.session.user) {
        return res.sendStatus(401);
    }

    const userEmail = req.session.user.email;
    const cart = req.session.cart || [];

    if (!purchases[userEmail]) {
        purchases[userEmail] = [];
    }

    purchases[userEmail].push(...cart);

    if (!req.session.purchaseHistory) {
        req.session.purchaseHistory = [];
    }
    req.session.purchaseHistory.push(...cart);

    req.session.cart = [];

    res.redirect('/html/profile.html');
});

app.delete('/cart/remove/:id', (req, res) => {
    const id = req.params.id;
    req.session.cart = (req.session.cart || []).filter(item => item.id !== id);
    res.json({ message: `Removed item ${id}, cart: req.session.cart` });
});

function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/html/login.html');
}

app.get('/products/:page', requireLogin, (req, res) => {
    const file = req.params.page;

    if (!file.endsWith('.html')) {
        return res.status(403).send('Forbidden');
    }

    res.sendFile(path.join(__dirname, 'products', file));
});

app.use('/products', requireLogin, express.static(path.join(__dirname, 'public/products')));

app.get('/auth/status', (req, res) => {
    if (req.session.user) {
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});

app.get('/user/purchases', (req, res) => {
    if (!req.session.user) {
        return res.sendStatus(401);
    }

    const userEmail = req.session.user.email;
    res.json({ purchases: purchases[userEmail] || [] });
});

app.get('/user/purchase-history', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({ history: req.session.purchaseHistory || [] });
});

app.get('/user/has-purchased/:productId', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const userEmail = req.session.user.email;
    const productId = req.params.productId;
    const userPurchases = purchases[userEmail] || [];

    const hasPurchased = userPurchases.some(p => p.id === productId);

    res.json({ hasPurchased });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
