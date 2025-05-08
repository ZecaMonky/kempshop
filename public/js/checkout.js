document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('checkoutForm');
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    const addressBlock = document.getElementById('addressBlock');
    
    // Обработка изменения способа доставки
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'courier') {
                addressBlock.style.display = 'block';
                document.getElementById('city').required = true;
                document.getElementById('address').required = true;
                updateDeliveryPrice(300);
            } else {
                addressBlock.style.display = 'none';
                document.getElementById('city').required = false;
                document.getElementById('address').required = false;
                updateDeliveryPrice(0);
            }
        });
    });

    // Обновление стоимости доставки и итоговой суммы
    function updateDeliveryPrice(price) {
        const deliveryPriceElement = document.getElementById('deliveryPrice');
        const totalPriceElement = document.getElementById('totalPrice');
        const subtotal = parseInt(totalPriceElement.dataset.subtotal);
        
        deliveryPriceElement.textContent = `${price} ₽`;
        totalPriceElement.textContent = `${subtotal + price} ₽`;
    }

    // Валидация и отправка формы
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!form.checkValidity()) {
                e.stopPropagation();
                form.classList.add('was-validated');
                return;
            }

            const formData = new FormData(form);
            const formDataObject = {};
            formData.forEach((value, key) => {
                formDataObject[key] = value;
            });

            try {
                const response = await fetch('/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formDataObject)
                });

                const result = await response.json();
                
                if (result.success) {
                    // Показываем уведомление об успехе
                    Swal.fire({
                        title: 'Заказ оформлен!',
                        text: 'Ваш заказ успешно оформлен. Мы свяжемся с вами в ближайшее время.',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then((result) => {
                        window.location.href = '/profile'; // Перенаправляем в профиль
                    });
                } else {
                    Swal.fire({
                        title: 'Ошибка!',
                        text: result.error || 'Произошла ошибка при оформлении заказа',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Ошибка:', error);
                Swal.fire({
                    title: 'Ошибка!',
                    text: 'Произошла ошибка при оформлении заказа',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    }

    // Маска для телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        IMask(phoneInput, {
            mask: '+{7}(000)000-00-00'
        });
    }

    // Форма регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const formDataObject = {};
            formData.forEach((value, key) => {
                formDataObject[key] = value;
            });

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formDataObject)
                });

                const result = await response.json();
                
                if (result.success) {
                    Swal.fire({
                        title: 'Успешно!',
                        text: 'Регистрация прошла успешно. Теперь вы можете войти.',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then((result) => {
                        window.location.href = '/login';
                    });
                } else {
                    Swal.fire({
                        title: 'Ошибка!',
                        text: result.error || 'Произошла ошибка при регистрации',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Ошибка:', error);
                Swal.fire({
                    title: 'Ошибка!',
                    text: 'Произошла ошибка при регистрации',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    }
}); 