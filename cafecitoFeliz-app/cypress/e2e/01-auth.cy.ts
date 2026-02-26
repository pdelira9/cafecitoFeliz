describe('Auth - Login', () => {
  it('Login válido (API) -> entra a /ventas', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    const pass = Cypress.env('ADMIN_PASS');

    cy.loginByApi(email, pass);
    cy.visitApp('/ventas');

    // Ajusta este assert a algo que exista en tu pantalla de ventas
    cy.contains('Ventas').should('be.visible');
  });

  it('Login inválido muestra error', () => {
    cy.visitApp('/login');

    cy.get('input[type="email"]').type('noexiste@cafecitofeliz.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.contains('Entrar').click();

    cy.contains(/credenciales incorrectas|no se pudo iniciar sesión/i).should('be.visible');
  });
});