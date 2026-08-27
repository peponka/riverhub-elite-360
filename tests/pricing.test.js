const test = require('node:test');
const assert = require('node:assert/strict');
const { PLANES, COMMERCIAL_TERMS, calculateFleetPricing } = require('../config/pricing');

test('catalogo contiene seis tramos sin cupos vacios ni planes ilimitados', () => {
    assert.deepEqual(PLANES.map((plan) => [plan.minUnits, plan.capacity, plan.effectiveUnitPrice]), [[1,9,100],[10,24,95],[25,49,90],[50,99,85],[100,149,80],[150,150,75]]);
});
test('una embarcacion muestra USD 100 y cada unidad adicional se calcula en vivo', () => {
    const oneVessel = calculateFleetPricing({ barges: 1 });
    const fleet = calculateFleetPricing({ barges: 10, tugboats: 2 });
    assert.equal(oneVessel.monthlyPrice, 100);
    assert.equal(fleet.billableUnits, 12);
    assert.equal(fleet.plan.id, 'fleet-10');
    assert.equal(fleet.monthlyPrice, 1140);
    assert.equal(fleet.savingsVsIndividual, 60);
});
test('el precio usa las unidades reales dentro de cada tramo y mas de 150 requiere propuesta', () => {
    const quote = calculateFleetPricing({ barges: 25, tugboats: 1 });
    assert.equal(quote.plan.id, 'fleet-25');
    assert.equal(quote.monthlyPrice, 2340);
    assert.equal(calculateFleetPricing({ barges: 150, tugboats: 1 }).customQuote, true);
});
test('prepago anual aplica solo el descuento maximo autorizado y piloto queda definido', () => {
    const quote = calculateFleetPricing({ barges: 10, tugboats: 0, annualPrepay: true });
    assert.equal(quote.annualPrepayTotal, 10260);
    assert.equal(COMMERCIAL_TERMS.annualPrepaymentDiscountPct, 10);
    assert.deepEqual(COMMERCIAL_TERMS.pilot, { days: 60, capacity: 15, totalPrice: 3000, implementationCreditPct: 50 });
});
