// Fuente unica de verdad para precios y cupos facturables de ViaBarcazas.
const PLANES = Object.freeze([
    { id: 'individual', name: 'Unidad Individual', capacity: 1, monthlyPrice: 125, effectiveUnitPrice: 125 },
    { id: 'fleet-10', name: 'Combo Flota 10', capacity: 10, monthlyPrice: 1100, effectiveUnitPrice: 110, },
    { id: 'fleet-25', name: 'Combo Flota 25', capacity: 25, monthlyPrice: 2500, effectiveUnitPrice: 100, popular: true },
    { id: 'fleet-50', name: 'Combo Flota 50', capacity: 50, monthlyPrice: 4750, effectiveUnitPrice: 95 },
    { id: 'fleet-100', name: 'Combo Flota 100', capacity: 100, monthlyPrice: 9000, effectiveUnitPrice: 90 },
    { id: 'fleet-150', name: 'Combo Flota 150', capacity: 150, monthlyPrice: 12750, effectiveUnitPrice: 85 }
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
    const plan = PLANES.find((item) => billableUnits <= item.capacity);
    if (!plan) {
        return { barges: normalizedBarges, tugboats: normalizedTugboats, billableUnits, customQuote: true, plan: null };
    }

    const prepaymentDiscount = annualPrepay ? COMMERCIAL_TERMS.annualPrepaymentDiscountPct : 0;
    const monthlyPrice = plan.monthlyPrice;
    return {
        barges: normalizedBarges,
        tugboats: normalizedTugboats,
        billableUnits,
        customQuote: false,
        plan,
        monthlyPrice,
        annualPrepayTotal: Math.round(monthlyPrice * 12 * (1 - prepaymentDiscount / 100)),
        annualPrepaymentDiscountPct: prepaymentDiscount,
        savingsVsIndividual: Math.max(0, billableUnits * PLANES[0].monthlyPrice - monthlyPrice)
    };
}

module.exports = { PLANES, COMMERCIAL_TERMS, calculateFleetPricing };
