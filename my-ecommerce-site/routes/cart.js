const express = require('express');
const router = express.Router();

router.post('/add', (req, res) => {
    const product = req.body;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const userId = req.session.user?.id;

    const persistentPurchases = (req.app.locals.purchases && userId && req.app.locals.purchases[userId]) || [];

    const purchasedIds = persistentPurchases.map(item => item.id);

    const existingItem = req.session.cart.find(item => item.id === product.id);
    const isOneTime = product.oneTimePurchase;

    if (isOneTime && purchasedIds.includes(product.id)) {
        return res.status(400).json({ error: 'You already purchased this.' });
    }

    if (existingItem) {
        if (isOneTime) {
            return res.status(400).json({ error: 'This product can only be purchased once.' });
        } else {
            existingItem.quantity += product.quantity;
            existingItem.totalPrice = existingItem.quantity * existingItem.price;
        }
    } else {
        req.session.cart.push({
            ...product,
            totalPrice: product.quantity * product.price
        });
    }
    
    res.json({ cart: req.session.cart });
});

router.get('/', (req, res) => {
    res.json(req.session.cart || []);
});

router.post('/clear', (req, res) => {
    req.session.cart = [];
    res.json({ message: 'Cart cleared' });
});

router.delete('/remove/:id', (req, res) => {
    const id = req.params.id;

    if (!req.session.cart) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    console.log('Cart:', req.session.cart);
    console.log('Remove ID:', id);

    const index = req.session.cart.findIndex(item => item.id == id);

    if (index !== -1) {
        req.session.cart.splice(index, 1);
        res.json({ message: 'Item ${id} deleted from cart., cart: req.session.cart' });
    } else {
        res.status(404).json({ error: 'Item not found in cart' });
    }
});

router.post('/checkout', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to checkout.' });
    }

    if (!req.session.cart || req.session.cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty.' });
    }

    const userId = req.session.user.id;

    if (!req.app.locals.purchases) {
        req.app.locals.purchases = {};
    }

    if (!req.app.locals.purchases[userId]) {
        req.app.locals.purchases[userId] = [];
    }

    const timestampedPurchases = req.session.cart.map(item => ({
        ...item,
        date: new Date().toISOString()
    }));
    
    req.app.locals.purchases[userId].push(...timestampedPurchases);

    if (!req.session.purchaseHistory) {
        req.session.purchaseHistory = [];
    }

    for (const item of req.session.cart) {
        if (item.oneTimePurchase && !req.session.purchaseHistory.includes(item.id)) {
            req.session.purchaseHistory.push(item.id);
        }
    }

    req.session.cart = [];

    res.json({ message: 'Checkout successful!' });
});

router.use((req, res, next) => {
    const userId = req.session.user?.id;
    if (userId) {
        const persistentPurchases = (req.app.locals.purchases && req.app.locals.purchases[userId]) || [];
        req.session.purchaseHistory = persistentPurchases
            .filter(item => item.oneTimePurchase)
            .map(item => item.id);
    }
    next();
});

router.get('/purchase-history', (req, res) => {
    const userId = req.session.user?.id;

    if (!userId || !req.app.locals.purchases || !req.app.locals.purchases[userId]) {
        return res.json([]);
    }

    res.json(req.app.locals.purchases[userId]);
});


module.exports = router;
