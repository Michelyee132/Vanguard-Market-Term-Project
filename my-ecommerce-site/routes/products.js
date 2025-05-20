const express = require('express');
const router = express.Router();
const allProducts = require('../data/product');

router.get('/:productId', (req, res) => {
    const product = allProducts.find(p => p.id === req.params.productId);
    if (!product) return res.status(404).send('Product not found');

    const purchaseHistory = req.session.purchaseHistory || [];
    const alreadyPurchased = product.oneTimePurchase && purchaseHistory.includes(product.id);

    res.render('product', {
        product,
        alreadyPurchased
    });
});

router.get('/', (req, res) => {
    db.all('SELECT * FROM products', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        res.json(rows);
    });
});

router.get('/search', (req, res) => {
    const query = req.query.query?.toLowerCase();

    const matchedProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(query)
    );

    if (matchedProducts.length === 0) {
        return res.json({ error: `No products found for "${query}".` });
    }

    res.json({ products: matchedProducts });
});

router.get('/:id', (req, res) => {
    const productId = req.params.id;

    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch product' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(row);
    });
});

module.exports = router;