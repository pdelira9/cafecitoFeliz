describe('Ventas - flujo básico (real)', () => {
  beforeEach(() => {
    cy.loginByApi(Cypress.env('CASHIER_EMAIL'), Cypress.env('CASHIER_PASS'));
    cy.visit('/ventas');
    cy.contains('Carrito').should('be.visible');
  });

  it('Agrega un producto y cobra (sin cliente)', () => {
    // Agrega el primer producto disponible
    cy.get('[data-testid="product-add-btn"]').first().click();

    // Cobrar
    cy.get('[data-testid="pay-btn"]').click();

    // Ticket se muestra
    cy.get('[data-testid="ticket-card"]').should('be.visible');

    // Verifica contenido mínimo del ticket
    cy.contains(/Cafecito Feliz/i).should('exist');
    cy.contains(/Folio:/i).should('exist');
    cy.contains(/Total/i).should('exist');
  });
});