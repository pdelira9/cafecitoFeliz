import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',

    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',

    supportFile: 'cypress/support/e2e.ts',

    video: true,
    screenshotOnRunFailure: true,

    defaultCommandTimeout: 10000,
    requestTimeout: 15000,

    env: {
      apiUrl: 'http://localhost:3001/api/auth/login',
      // Ajusta tus credenciales reales si tu login es por API (si aún no aplica auth, no se usan)
      CASHIER_EMAIL: 'cajeroprueba@cafecitofelis.com',
      CASHIER_PASS: '9081726354',
      ADMIN_EMAIL: 'admin@cafecitofeliz.com',
      ADMIN_PASS: '9081726354',
    },
  },
});
