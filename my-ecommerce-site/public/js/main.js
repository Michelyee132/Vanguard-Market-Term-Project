const navCartCount = document.querySelector('.nav-links a[href="/cart.html"]');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const cartItemsContainer = document.querySelector('.cart-items');
const cartSummary = document.querySelector('.cart-summary');
const checkoutButton = document.querySelector('.checkout-button');

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    if (navCartCount) {
        navCartCount.textContent = Cart (`${totalItems}`);
    }
}

function addToCart(event) {
    const button = event.target;
    const productCard = button.closest('.product-card') || button.closest('.product-info');
    
    const product = {
        id: productCard.dataset.productId || '1',
        name: productCard.querySelector('h3')?.textContent || productCard.querySelector('h1')?.textContent,
        price: parseFloat(productCard.querySelector('.price').textContent.replace('$', '')),
        image: productCard.querySelector('img').src,
        quantity: parseInt(productCard.querySelector('.quantity-selector select')?.value || 1)
    };

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push(product);
    }

    localStorage.setItem('cart', JSON.stringify(cart));  
    updateCartCount();  
    alert(`${product.quantity} ${product.name}(s) added to cart!`);
}

document.addEventListener('DOMContentLoaded', () => {
    renderCartItems(); 
});

function renderCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartSummaryElement = document.querySelector('.summary-details');

    cartItemsContainer.innerHTML = '';  
    cartSummaryElement.innerHTML = '';  

    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" width="100">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>$${item.price.toFixed(2)}</p>
                <div class="item-quantity">
                    <label>Quantity:</label>
                    <input type="number" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="remove-item" data-id="${item.id}">Remove</button>
                </div>
            </div>
            <div class="item-total">$${itemTotal.toFixed(2)}</div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    cartSummaryElement.innerHTML = `
        <p>Subtotal: <span>$${subtotal.toFixed(2)}</span></p>
        <p>Tax: <span>$${tax.toFixed(2)}</span></p>
        <p class="total">Total: <span>$${total.toFixed(2)}</span></p>
    `;
}

function handleQuantityChange(event) {
    if (event.target.type === 'number') {
        const productId = event.target.dataset.id;
        const newQuantity = parseInt(event.target.value);

        if (newQuantity < 1) {
            event.target.value = 1;
            return;
        }

        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCartItems();
            updateCartCount();
        }
    }
}

function handleRemoveItem(event) {
    if (event.target.classList.contains('remove-item')) {
        const productId = event.target.dataset.id;
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        updateCartCount();
    }
}

function handleCheckout(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    alert('Checkout would be processed here. This is just a demo.');
    
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', () => {
    if (addToCartButtons) {
        addToCartButtons.forEach(button => {
            button.addEventListener('click', addToCart);
        });
    }

    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('change', handleQuantityChange);
        cartItemsContainer.addEventListener('click', handleRemoveItem);
        renderCartItems();
    }

    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }

    updateCartCount();
});
