// Функции для работы с корзиной
const updateQuantity = async (itemId, action, value) => {
    let newQuantity;
    
    switch(action) {
        case 'increase':
            newQuantity = parseInt(document.querySelector(`input[data-item-id="${itemId}"]`).value) + 1;
            break;
        case 'decrease':
            newQuantity = parseInt(document.querySelector(`input[data-item-id="${itemId}"]`).value) - 1;
            if (newQuantity < 1) newQuantity = 1;
            break;
        case 'set':
            newQuantity = parseInt(value);
            if (newQuantity < 1) newQuantity = 1;
            break;
    }

    try {
        const response = await fetch('/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId,
                quantity: newQuantity
            })
        });

        const data = await response.json();
        if (data.success) {
            updateCartUI(data.cart);
        }
    } catch (error) {
        console.error('Ошибка при обновлении корзины:', error);
    }
};

const updateCartUI = (cart) => {
    // Обновление количества товаров в шапке
    const cartCounter = document.querySelector('.cart-counter');
    if (cartCounter) {
        cartCounter.textContent = cart.totalItems;
    }

    // Обновление итоговых сумм
    const subtotalElem = document.querySelector('.cart-subtotal');
    if (subtotalElem) subtotalElem.textContent = `${cart.subtotal} ₽`;

    const shippingElem = document.querySelector('.cart-shipping');
    if (shippingElem) shippingElem.textContent = `${cart.shipping} ₽`;

    const totalElem = document.querySelector('.cart-total');
    if (totalElem) totalElem.textContent = `${cart.total} ₽`;

    // Если корзина пуста, показываем соответствующее сообщение
    const cartItemsElem = document.querySelector('.cart-items');
    if (cartItemsElem && cart.items.length === 0) {
        cartItemsElem.innerHTML = `
            <div class="text-center py-5">
                <h4>Корзина пуста</h4>
                <p>Перейдите в каталог, чтобы добавить товары</p>
                <a href="/catalog" class="btn btn-primary">Перейти в каталог</a>
            </div>
        `;
    }
};

const proceedToCheckout = () => {
    window.location.href = '/checkout';
};

document.addEventListener('DOMContentLoaded', function() {
    // Обработка форм добавления в корзину
    const addToCartForms = document.querySelectorAll('.add-to-cart-form');
    
    addToCartForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId: formData.get('productId'),
                        quantity: parseInt(formData.get('quantity'))
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    updateCartCounter(result.cart);
                    showNotification('Товар добавлен в корзину', 'success');
                } else {
                    showNotification(result.error || 'Ошибка при добавлении товара', 'danger');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showNotification('Произошла ошибка при добавлении товара', 'danger');
            }
        });
    });

    // Функция для обновления количества товара в корзине
    window.updateQuantity = async function(productId, change) {
        try {
            // Получаем текущее количество из DOM
            const itemElem = document.querySelector(`[data-product-id="${productId}"]`);
            let currentQuantity = 1;
            if (itemElem) {
                const quantitySpan = itemElem.querySelector('.mx-2');
                if (quantitySpan) {
                    currentQuantity = parseInt(quantitySpan.textContent) || 1;
                }
            }
            let newQuantity = currentQuantity + change;
            if (newQuantity < 1) newQuantity = 1;
            const response = await fetch('/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: parseInt(productId),
                    quantity: newQuantity
                })
            });
            const result = await response.json();
            if (result.success) {
                window.location.reload();
            } else {
                showNotification(result.error || 'Ошибка при обновлении количества', 'danger');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Произошла ошибка при обновлении количества', 'danger');
        }
    };

    // Функция для удаления товара из корзины
    window.removeFromCart = async function(productId) {
        if (!confirm('Вы уверены, что хотите удалить этот товар из корзины?')) {
            return;
        }
        try {
            const response = await fetch('/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId: parseInt(productId) })
            });
            const result = await response.json();
            if (result.success) {
                // Находим и удаляем элемент из DOM
                const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
                if (cartItem) {
                    cartItem.remove();
                }
                // Обновляем счетчик корзины
                const counter = document.querySelector('.cart-counter');
                if (counter) {
                    const itemCount = result.cart.items.length;
                    if (itemCount > 0) {
                        counter.textContent = itemCount;
                        counter.style.display = 'inline';
                    } else {
                        counter.style.display = 'none';
                        window.location.reload();
                    }
                }
                // Обновляем общую сумму
                const totalElement = document.querySelector('.cart-total');
                if (totalElement) {
                    totalElement.textContent = `${result.cart.total} ₽`;
                }
                showNotification('Товар удален из корзины', 'success');
            } else {
                showNotification(result.error || 'Ошибка при удалении товара', 'danger');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Произошла ошибка при удалении товара', 'danger');
        }
    };

    // Обновление счетчика корзины
    function updateCartCounter(cart) {
        const counter = document.querySelector('.cart-counter');
        if (counter && cart && cart.items) {
            const itemCount = cart.items.length;
            if (itemCount > 0) {
                counter.textContent = itemCount;
                counter.style.display = 'inline';
            } else {
                counter.style.display = 'none';
            }
        }
    }

    // Функция для показа уведомлений
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}); 