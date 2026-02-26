/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {

      loginByApi(email: string, password: string): Chainable<void>;

      /**
       * apiCreateSale
       * Crea una venta por API POST /api/sales
       */
      apiCreateSale(payload: any): Chainable<any>;

      /**
       * GET /api/sales/:saleId
       */
      apiGetSaleBySaleId(saleId: string): Chainable<any>;
    }
  }
}

Cypress.Commands.add('loginByApi', (email: string, password: string) => {
  const apiUrl = Cypress.env('apiUrl');


  cy.log(`loginByApi (stub): ${email}`);
  cy.wrap(null).then(() => {

  });
});

Cypress.Commands.add('apiCreateSale', (payload: any) => {
  const apiUrl = Cypress.env('apiUrl');

  return cy.request({
    method: 'POST',
    url: `${apiUrl}/sales`,
    failOnStatusCode: false,
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  });
});

Cypress.Commands.add('apiGetSaleBySaleId', (saleId: string) => {
  const apiUrl = Cypress.env('apiUrl');

  return cy.request({
    method: 'GET',
    url: `${apiUrl}/sales/${encodeURIComponent(saleId)}`,
    failOnStatusCode: false,
  });
});

export {};