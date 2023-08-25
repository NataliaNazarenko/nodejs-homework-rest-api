/* eslint-disable no-undef */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');

const { DB_HOST_TEST } = process.env;


describe('login user', () => {
    beforeAll(async () => {
        try {
            await mongoose.connect(DB_HOST_TEST, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('DB Connected');
        } catch (error) {
            console.error(error);
        }
    });

    const testUser = {
        email: "testuser@gmail.com",
        password: "testpassword123"
    };

    it('should login user', async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send(testUser);

        // Перевірка статус-коду
        expect(response.statusCode).toBe(200);

        // Перевірка токена
        expect(response.body.token).toBeDefined();

        // Перевірка об'єкта користувача з полями email та subscription
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.subscription).toBeDefined();
        expect(typeof response.body.user.email).toBe('string');
        expect(typeof response.body.user.subscription).toBe('string');
    });

    afterAll(async () => {
        await mongoose.disconnect();
        console.log('DB Disconnected');
    });
});
