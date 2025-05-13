document.addEventListener('DOMContentLoaded', function() {
    // Обработка добавления товара
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/admin/products', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    Swal.fire({
                        title: 'Успешно!',
                        text: 'Товар успешно добавлен',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        title: 'Ошибка!',
                        text: result.error || 'Произошла ошибка при добавлении товара',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Ошибка:', error);
                Swal.fire({
                    title: 'Ошибка!',
                    text: 'Произошла ошибка при добавлении товара',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    }

    // Обработка редактирования товара
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        // Заполнение формы редактирования при открытии модального окна
        document.querySelectorAll('.edit-product').forEach(button => {
            button.addEventListener('click', function() {
                const product = JSON.parse(this.dataset.product);
                document.getElementById('editProductId').value = product.id;
                document.getElementById('editName').value = product.name;
                document.getElementById('editDescription').value = product.description || '';
                document.getElementById('editPrice').value = product.price;
                document.getElementById('editCategory').value = product.category || '';
                document.getElementById('editSku').value = product.sku;
                document.getElementById('editStock').value = product.stock;
                
                // Показываем текущее изображение
                const currentImageDiv = document.getElementById('currentImage');
                if (product.image_url) {
                    currentImageDiv.innerHTML = `
                        <img src="${product.image_url}" alt="${product.name}" style="max-width: 100px;" class="mt-2">
                    `;
                } else {
                    currentImageDiv.innerHTML = '';
                }
            });
        });

        // Обработка отправки формы редактирования
        editProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const productId = document.getElementById('editProductId').value;
            
            try {
                const response = await fetch(`/admin/products/${productId}`, {
                    method: 'PUT',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    Swal.fire({
                        title: 'Успешно!',
                        text: 'Товар успешно обновлен',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        title: 'Ошибка!',
                        text: result.error || 'Произошла ошибка при обновлении товара',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Ошибка:', error);
                Swal.fire({
                    title: 'Ошибка!',
                    text: 'Произошла ошибка при обновлении товара',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    }

    // Обработка архивации товара
    document.querySelectorAll('.archive-product').forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.dataset.productId;
            const result = await Swal.fire({
                title: 'Архивировать товар?',
                text: 'Товар будет скрыт из каталога, но останется в базе.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#6c757d',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Да, архивировать!',
                cancelButtonText: 'Отмена'
            });
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/admin/products/${productId}/archive`, {
                        method: 'POST'
                    });
                    const data = await response.json();
                    if (data.success) {
                        Swal.fire({
                            title: 'Архивировано!',
                            text: 'Товар успешно архивирован',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: 'Ошибка!',
                            text: data.error || 'Произошла ошибка при архивировании товара',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                } catch (error) {
                    console.error('Ошибка:', error);
                    Swal.fire({
                        title: 'Ошибка!',
                        text: 'Произошла ошибка при архивировании товара',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            }
        });
    });
}); 