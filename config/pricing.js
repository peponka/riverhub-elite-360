// Fuente unica de verdad para los tramos facturables de ViaBarcazas.
// El cliente paga por las unidades reales de su flota, nunca por cupos vacios.
const PLANES = Object.freeze([
    { id: 'starter', name: 'Precio inicial', minUnits: 1, capacity: 9, effectiveUnitPrice: 100 },
    { id: 'fleet-10', name: 'Flota 10+', minUnits: 10, capacity: 24, effectiveUnitPrice: 95 },
    { id: 'fleet-25', name: 'Flota 25+', minUnits: 25, capacity: 49, effectiveUnitPrice: 90, popular: true },
    { id: 'fleet-50', name: 'Flota 50+', minUnits: 50, capacity: 99, effectiveUnitPrice: 85 },
    { id: 'fleet-100', name: 'Flota 100+', minUnits: 100, capacity: 149, effectiveUnitPrice: 80 },
    { id: 'fleet-150', name: 'Flota 150', minUnits: 150, capacity: 150, effectiveUnitPrice: 75 }
]);

const COMMERCIAL_TERMS = Object.freeze({
    currency: 'USD',
    annualCommitmentMonths: 12,
    annualPrepaymentDiscountPct: 10,
    pilot: { days: 60, capacity: 15, totalPrice: 3000, implementationCreditPct: 50 },
    implementationFrom: 3000
});

function toCount(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : null;
}

function calculateFleetPricing({ barges = 0, tugboats = 0, annualPrepay = false } = {}) {
    const normalizedBarges = toCount(barges);
    const normalizedTugboats = toCount(tugboats);
    if (normalizedBarges === null || normalizedTugboats === null) {
        throw new Error('Las cantidades de barcazas y remolcadores deben ser enteros positivos o cero.');
    }

    const billableUnits = normalizedBarges + normalizedTugboats;
    const plan = PLANES.find((item) => billableUnits >= item.minUnits && billableUnits <= item.capacity);
    if (!plan) {
        return { barges: normalizedBarges, tugboats: normalizedTugboats, billableUnits, customQuote: true, plan: null };
    }

    const prepaymentDiscount = annualPrepay ? COMMERCIAL_TERMS.annualPrepaymentDiscountPct : 0;
    const monthlyPrice = billableUnits * plan.effectiveUnitPrice;
    return {
        barges: normalizedBarges,
        tugboats: normalizedTugboats,
        billableUnits,
        customQuote: false,
        plan,
        monthlyPrice,
        annualPrepayTotal: Math.round(monthlyPrice * 12 * (1 - prepaymentDiscount / 100)),
        annualPrepaymentDiscountPct: prepaymentDiscount,
        savingsVsIndividual: Math.max(0, billableUnits * PLANES[0].effectiveUnitPrice - monthlyPrice)
    };
}

module.exports = { PLANES, COMMERCIAL_TERMS, calculateFleetPricing };
