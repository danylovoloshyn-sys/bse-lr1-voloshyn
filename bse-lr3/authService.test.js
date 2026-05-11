// authService.test.js
const AuthService = require('./authService');

describe('AuthService Unit Tests', () => {
    let authService;

    // Arrange для всіх тестів: створюємо новий чистий екземпляр перед кожним тестом
    beforeEach(() => {
        authService = new AuthService();
    });

    // --- ТЕСТИ ДЛЯ registerUser ---

    test('BVA: Помилка реєстрації, якщо вік 12 років (межа - 1)', () => {
        // Arrange
        const email = 'user@mail.com';
        const age = 12;
        const gdpr = true;

        // Act & Assert
        expect(() => {
            authService.registerUser(email, age, gdpr);
        }).toThrow("Користувач має бути старше 13 років");
    });

    test('BVA: Успішна реєстрація, якщо вік 13 років (межа)', () => {
        // Arrange
        const email = 'user13@mail.com';
        const age = 13;
        const gdpr = true;

        // Act
        const user = authService.registerUser(email, age, gdpr);

        // Assert
        expect(user.email).toBe(email);
        expect(user.age).toBe(13);
    });

    test('EP (Негативний): Помилка реєстрації без згоди GDPR', () => {
        // Arrange
        const email = 'user@mail.com';
        const age = 20;
        const gdpr = false;

        // Act & Assert
        expect(() => {
            authService.registerUser(email, age, gdpr);
        }).toThrow("Згода з GDPR є обов'язковою");
    });

    test('EP (Негативний): Помилка при некоректному форматі email', () => {
        // Arrange
        const invalidEmail = 'usermail.com';
        
        // Act & Assert
        expect(() => {
            authService.registerUser(invalidEmail, 20, true);
        }).toThrow("Некоректний формат email");
    });

    test('EP (Негативний): Помилка реєстрації дубліката email', () => {
        // Arrange
        const email = 'duplicate@mail.com';
        authService.registerUser(email, 25, true); // Додаємо першого користувача

        // Act & Assert
        expect(() => {
            authService.registerUser(email, 30, true); // Спроба додати такого ж
        }).toThrow("Користувач вже існує");
    });

    // --- ТЕСТИ ДЛЯ addApiKey ---

    test('EP (Негативний): Помилка при непідтримуваному провайдері', () => {
        // Arrange
        authService.registerUser('test@mail.com', 20, true);
        
        // Act & Assert
        expect(() => {
            authService.addApiKey('test@mail.com', 'Google', '1234567890');
        }).toThrow("Непідтримуваний провайдер");
    });

    test('BVA: Помилка, якщо довжина API-ключа 9 символів (межа - 1)', () => {
        // Arrange
        authService.registerUser('test@mail.com', 20, true);
        const shortKey = '123456789'; 

        // Act & Assert
        expect(() => {
            authService.addApiKey('test@mail.com', 'OpenAI', shortKey);
        }).toThrow("Довжина API-ключа має бути не менше 10 символів");
    });

    test('BVA: Успішне додавання ключа довжиною 10 символів (межа)', () => {
        // Arrange
        authService.registerUser('test@mail.com', 20, true);
        const validKey = '1234567890';

        // Act
        const result = authService.addApiKey('test@mail.com', 'OpenAI', validKey);

        // Assert
        expect(result.key).toBe(validKey);
        expect(result.provider).toBe('OpenAI');
    });

    // --- ТЕСТИ ДЛЯ enable2FA ---

    test('EP (Негативний): Помилка при некоректному форматі телефону (без +)', () => {
        // Arrange
        authService.registerUser('test@mail.com', 20, true);
        const invalidPhone = '380501234567';

        // Act & Assert
        expect(() => {
            authService.enable2FA('test@mail.com', invalidPhone);
        }).toThrow("Некоректний формат телефону");
    });

    test('BVA: Успішне увімкнення 2FA з телефоном 10 цифр (нижня межа)', () => {
        // Arrange
        authService.registerUser('test@mail.com', 20, true);
        const validPhone = '+1234567890';

        // Act
        const result = authService.enable2FA('test@mail.com', validPhone);

        // Assert
        expect(result).toBe(true);
        expect(authService.users[0].is2FAEnabled).toBe(true);
    });

    test('EP (Негативний): Помилка повторного увімкнення 2FA', () => {
        // Arrange
        authService.registerUser('test@mail.com', 20, true);
        authService.enable2FA('test@mail.com', '+1234567890'); // Вмикаємо вперше

        // Act & Assert
        expect(() => {
            authService.enable2FA('test@mail.com', '+0987654321'); // Спроба вдруге
        }).toThrow("2FA вже увімкнено");
    });
});