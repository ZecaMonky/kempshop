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

    // Обработка удаления товара
    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.dataset.productId;
            
            const result = await Swal.fire({
                title: 'Вы уверены?',
                text: 'Товар будет удален безвозвратно',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Да, удалить!',
                cancelButtonText: 'Отмена'
            });

            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/admin/products/${productId}`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        Swal.fire({
                            title: 'Удалено!',
                            text: 'Товар успешно удален',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: 'Ошибка!',
                            text: data.error || 'Произошла ошибка при удалении товара',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                } catch (error) {
                    console.error('Ошибка:', error);
                    Swal.fire({
                        title: 'Ошибка!',
                        text: 'Произошла ошибка при удалении товара',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            }
        });
    });
}); 