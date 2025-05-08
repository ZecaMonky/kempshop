document.addEventListener('DOMContentLoaded', function() {
    // Управление количеством товара
    const quantityInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decrease');
    const increaseBtn = document.getElementById('increase');

    if (decreaseBtn && increaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });

        increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
        });

        quantityInput.addEventListener('change', () => {
            if (quantityInput.value < 1) {
                quantityInput.value = 1;
            }
        });
    }

    // Галерея изображений
    const mainImage = document.querySelector('.main-image img');
    const thumbnails = document.querySelectorAll('.thumbnails img');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            mainImage.src = this.src;
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Добавление в корзину
    const addToCartBtn = document.getElementById('addToCart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const quantity = parseInt(quantityInput.value);
            const size = document.querySelector('input[name="size"]:checked')?.value;
            
            // Здесь будет логика добавления в корзину
            console.log('Добавление в корзину:', {
                quantity,
                size
            });
        });
    }
}); 