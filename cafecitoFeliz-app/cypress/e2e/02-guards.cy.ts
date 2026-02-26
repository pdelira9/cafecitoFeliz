describe('Guards', () => {
  beforeEach(() => {
    cy.logout();
  });

  it('Sin sesión: /ventas redirige a /login', () => {
    cy.visitApp('/ventas');
    cy.url().should('include', '/login');
  });
});