// authService.js
class AuthService {
    constructor() {
        this.users = [];
    }

    // Метод 1: Реєстрація користувача
    registerUser(email, age, gdprAccepted) {
        if (!gdprAccepted) {
            throw new Error("Згода з GDPR є обов'язковою");
        }
        if (typeof age !== 'number' || age < 0) {
            throw new Error("Некоректний вік");
        }
        if (age < 13) {
            throw new Error("Користувач має бути старше 13 років");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Некоректний формат email");
        }

        const existingUser = this.users.find(u => u.email === email);
        if (existingUser) {
            throw new Error("Користувач вже існує");
        }

        const newUser = { id: Date.now(), email, age, gdprAccepted, apiKeys: [], is2FAEnabled: false };
        this.users.push(newUser);
        return newUser;
    }

    // Метод 2: Додавання API-ключа
    addApiKey(email, provider, key) {
        const user = this.users.find(u => u.email === email);
        if (!user) {
            throw new Error("Користувача не знайдено");
        }
        const validProviders = ['OpenAI', 'Anthropic'];
        if (!validProviders.includes(provider)) {
            throw new Error("Непідтримуваний провайдер");
        }
        if (!key || key.length < 10) {
            throw new Error("Довжина API-ключа має бути не менше 10 символів");
        }

        const newKey = { provider, key, addedAt: new Date() };
        user.apiKeys.push(newKey);
        return newKey;
    }

    // Метод 3: Увімкнення двофакторної автентифікації (2FA)
    enable2FA(email, phoneNumber) {
        const user = this.users.find(u => u.email === email);
        if (!user) {
            throw new Error("Користувача не знайдено");
        }
        if (user.is2FAEnabled) {
            throw new Error("2FA вже увімкнено");
        }
        // Телефон має починатися з + і мати від 10 до 14 цифр
        const phoneRegex = /^\+\d{10,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
            throw new Error("Некоректний формат телефону");
        }

        user.is2FAEnabled = true;
        user.phoneNumber = phoneNumber;
        return true;
    }
}

module.exports = AuthService;