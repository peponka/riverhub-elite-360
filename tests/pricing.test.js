const test = require('node:test');
const assert = require('node:assert/strict');
const { PLANES, COMMERCIAL_TERMS, calculateFleetPricing } = require('../config/pricing');

test('catalogo contiene los seis combos sin planes ilimitados', () => {
    assert.deepEqual(PLANES.map((plan) => [plan.capacity, plan.monthlyPrice]), [[1,115],[10,1100],[25,2500],[50,4750],[100,9000],[150,12750]]);
});
test('barcazas y remolcadores usan exactamente la misma unidad facturable', () => {
    const quote = calculateFleetPricing({ barges: 22, tugboats: 3 });
    assert.equal(quote.billableUnits, 25);
    assert.equal(quote.plan.id, 'fleet-25');
    assert.equal(quote.monthlyPrice, 2500);
    assert.equal(quote.savingsVsIndividual, 375);
});
test('un excedente pasa al siguiente combo y mas de 150 requiere propuesta', () => {
    assert.equal(calculateFleetPricing({ barges: 25, tugboats: 1 }).plan.id, 'fleet-50');
    assert.equal(calculateFleetPricing({ barges: 150, tugboats: 1 }).customQuote, true);
});
test('prepago anual aplica solo el descuento maximo autorizado y piloto queda definido', () => {
    const quote = calculateFleetPricing({ barges: 10, tugboats: 0, annualPrepay: true });
    assert.equal(quote.annualPrepayTotal, 11880);
    assert.equal(COMMERCIAL_TERMS.annualPrepaymentDiscountPct, 10);
    assert.deepEqual(COMMERCIAL_TERMS.pilot, { days: 60, capacity: 15, totalPrice: 3000, implementationCreditPct: 50 });
});
