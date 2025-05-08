document.addEventListener('DOMContentLoaded', function() {
    // Обработка формы фильтров
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Здесь будет логика фильтрации
            console.log('Применение фильтров');
        });
    }

    // Добавление товара в корзину
    const addToCartButtons = document.querySelectorAll('.btn-primary');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Здесь будет логика добавления в корзину
            console.log('Товар добавлен в корзину');
        });
    });

    // Сортировка товаров
    const sortSelect = document.querySelector('select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            // Здесь будет логика сортировки
            console.log('Сортировка:', this.value);
        });
    }
}); 