describe('Roles', () => {
  it('Cashier NO puede entrar a /productos', () => {
    const email = Cypress.env('CASHIER_EMAIL');
    const pass = Cypress.env('CASHIER_PASS');

    cy.loginByApi(email, pass);
    cy.visitApp('/productos');

    // Según tu roleGuard: lo manda a /ventas
    cy.url().should('include', '/ventas');
  });

  it('Admin SÍ puede entrar a /productos', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    const pass = Cypress.env('ADMIN_PASS');

    cy.loginByApi(email, pass);
    cy.visitApp('/productos');

    cy.contains(/productos/i).should('be.visible');
  });
});