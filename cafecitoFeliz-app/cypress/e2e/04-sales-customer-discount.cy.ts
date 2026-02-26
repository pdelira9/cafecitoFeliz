describe('Ventas - cliente (sin asumir compras)', () => {
  beforeEach(() => {
    cy.loginByApi(Cypress.env('CASHIER_EMAIL'), Cypress.env('CASHIER_PASS'));
    cy.visit('/ventas');
  });

  it('Selecciona cliente y cobra', () => {
    cy.get('[data-testid="customer-search-input"]').type('juan');
    cy.get('[data-testid="customer-search-btn"]').click();
    cy.get('[data-testid="customer-select-btn"]').first().click();

    // Agrega producto y cobra
    cy.get('[data-testid="product-add-btn"]').first().click();
    cy.get('[data-testid="pay-btn"]').click();

    cy.get('[data-testid="ticket-card"]').should('be.visible');
  });
});