document.addEventListener('DOMContentLoaded', function() {
    // Общая функция для показа сообщений
    function showMessage(message, type = 'danger') {
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            messageContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    }

    // Валидация формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Инициализация маски для телефона
        const phone = document.getElementById('phone');
        if (phone) {
            IMask(phone, {
                mask: '+{7}(000)000-00-00'
            });
        }

        // Валидация паролей и сложности
        const password = document.getElementById('password');
        const passwordConfirm = document.getElementById('passwordConfirm');
        const passwordHelp = document.getElementById('passwordHelp');

        function validatePasswordStrength(pw) {
            // Минимум 8 символов, заглавная, строчная, цифра, спецсимвол
            return /[A-Z]/.test(pw) &&
                   /[a-z]/.test(pw) &&
                   /[0-9]/.test(pw) &&
                   /[^A-Za-z0-9]/.test(pw) &&
                   pw.length >= 8;
        }

        function validatePasswords() {
            let valid = true;
            if (password && passwordConfirm) {
                if (password.value !== passwordConfirm.value) {
                    passwordConfirm.setCustomValidity('Пароли не совпадают');
                    valid = false;
                } else {
                    passwordConfirm.setCustomValidity('');
                }
                if (!validatePasswordStrength(password.value)) {
                    password.setCustomValidity('Пароль слишком простой');
                    if (passwordHelp) passwordHelp.classList.add('text-danger');
                    valid = false;
                } else {
                    password.setCustomValidity('');
                    if (passwordHelp) passwordHelp.classList.remove('text-danger');
                }
            }
            return valid;
        }

        if (password && passwordConfirm) {
            password.addEventListener('input', validatePasswords);
            passwordConfirm.addEventListener('input', validatePasswords);
        }

        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const valid = validatePasswords();
            if (!registerForm.checkValidity() || !valid) {
                e.stopPropagation();
                registerForm.classList.add('was-validated');
                showMessage('Проверьте правильность заполнения формы и сложность пароля.');
                return;
            }

            try {
                const formData = new FormData(registerForm);
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(Object.fromEntries(formData))
                });

                const result = await response.json();
                if (result.success) {
                    showMessage('Регистрация успешна! Перенаправление на страницу входа...', 'success');
                    registerForm.reset();
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showMessage(result.error || 'Ошибка регистрации');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showMessage('Произошла ошибка при регистрации');
            }
        });
    }

    // Валидация формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const formDataObject = {};
            formData.forEach((value, key) => {
                formDataObject[key] = value;
            });
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formDataObject)
                });
                const result = await response.json();
                if (result.success) {
                    showMessage('Вход выполнен! Перенаправление...', 'success');
                    setTimeout(() => {
                        window.location.href = result.redirect || '/';
                    }, 1000);
                } else {
                    showMessage(result.error || 'Ошибка входа');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showMessage('Произошла ошибка при входе');
            }
        });
    }

    // В функции handleLogin
    async function handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Сначала показываем уведомление
                await Swal.fire({
                    title: 'Успешно!',
                    text: 'Вы успешно вошли в систему',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                
                // После закрытия уведомления перенаправляем на главную
                window.location.href = '/';
            } else {
                Swal.fire({
                    title: 'Ошибка!',
                    text: data.error || 'Произошла ошибка при входе',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Ошибка:', error);
            Swal.fire({
                title: 'Ошибка!',
                text: 'Произошла ошибка при входе',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Добавляем обработчик события при загрузке страницы
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    });
}); 