const test = require('node:test');
const assert = require('node:assert/strict');
const { PLANES, COMMERCIAL_TERMS, calculateFleetPricing } = require('../config/pricing');

test('catalogo contiene cinco tramos sin cupos vacios ni planes ilimitados', () => {
    assert.deepEqual(PLANES.map((plan) => [plan.minUnits, plan.capacity, plan.effectiveUnitPrice]), [[1,9,120],[10,24,110],[25,49,100],[50,99,92],[100,149,85]]);
});
test('una embarcacion muestra USD 120 y cada unidad adicional se calcula en vivo', () => {
    const oneVessel = calculateFleetPricing({ barges: 1 });
    const fleet = calculateFleetPricing({ barges: 10, tugboats: 2 });
    assert.equal(oneVessel.monthlyPrice, 120);
    assert.equal(fleet.billableUnits, 12);
    assert.equal(fleet.plan.id, 'fleet-10');
    assert.equal(fleet.monthlyPrice, 1320);
    assert.equal(fleet.savingsVsIndividual, 120);
});
test('el precio usa las unidades reales dentro de cada tramo y 150 o mas requiere propuesta (tramo abierto)', () => {
    const quote = calculateFleetPricing({ barges: 25, tugboats: 1 });
    assert.equal(quote.plan.id, 'fleet-25');
    assert.equal(quote.monthlyPrice, 2600);
    // Limite exacto del bug original: 150 unidades ya no matchea ningun
    // tramo cerrado, tiene que caer en propuesta personalizada.
    assert.equal(calculateFleetPricing({ barges: 150, tugboats: 0 }).customQuote, true);
    assert.equal(calculateFleetPricing({ barges: 150, tugboats: 1 }).customQuote, true);
});
test('prepago anual aplica solo el descuento maximo autorizado y piloto queda definido', () => {
    const quote = calculateFleetPricing({ barges: 10, tugboats: 0, annualPrepay: true });
    assert.equal(quote.annualPrepayTotal, 11880);
    assert.equal(COMMERCIAL_TERMS.annualPrepaymentDiscountPct, 10);
    assert.deepEqual(COMMERCIAL_TERMS.pilot, { days: 60, capacity: 15, totalPrice: 3000, implementationCreditPct: 50 });
});
