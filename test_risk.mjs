
import { FinancialRiskAnalyzer } from './public/js/modules/financial_risk.js';

// Sample Data Case 1: High Risk
const riskyData = {
    entity_name: "Empresa Fantasma S.A.",
    assets_current: 50000,
    liabilities_current: 60000, // Liquidity < 1 (0.83) -> Penalty
    assets_total: 100000,
    liabilities_total: 80000, // Debt Ratio 0.8 -> > 0.7 -> Penalty
    ebitda: 5000,
    debt_financial: 6000, // Coverage 0.83 < 1.2 -> Penalty
    cashflow_stability: "LOW", // Penalty
    legal_issues: true // Red Flag
};

// Sample Data Case 2: Good Company
const goodData = {
    entity_name: "Solidez Corp",
    assets_current: 200000,
    liabilities_current: 100000, // Liquidity 2.0
    assets_total: 500000,
    liabilities_total: 200000, // Debt Ratio 0.4
    ebitda: 100000,
    debt_financial: 50000, // Coverage 2.0
    cashflow_stability: "HIGH",
    legal_issues: false
};

const analyzer = new FinancialRiskAnalyzer();

console.log("--- Analyzing Risky Data ---");
const result1 = analyzer.analyze(riskyData);
console.log(JSON.stringify(result1, null, 2));

console.log("\n--- Analyzing Good Data ---");
const result2 = analyzer.analyze(goodData);
console.log(JSON.stringify(result2, null, 2));
