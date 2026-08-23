/**
 * Financial Risk Analysis Engine
 * 
 * Modulo de evaluación de riesgo financiero automatizado para ViaBarcazas.
 * Implementa lógica de validación, cálculo de ratios, detección de red flags y scoring.
 * 
 * Uso:
 * const analyzer = new FinancialRiskAnalyzer();
 * const result = analyzer.analyze(financialData);
 */

export class FinancialRiskAnalyzer {
    constructor() {
        this.THRESHOLDS = {
            liquidity: { warning: 1.0, critical: 0.8 },
            debtRatio: { warning: 0.7, critical: 0.9 }, // > 70%
            debtCoverage: { warning: 1.2, critical: 1.0 } // < 1.2
        };

        this.SCORING = {
            base: 100,
            penalties: {
                lowLiquidity: 15,
                highDebt: 20,
                lowCoverage: 20,
                volatileCashflow: 10,
                incompleteData: 15,
                redFlag: 25 // Major red flag penalty
            }
        };
    }

    /**
     * Main analysis function
     * @param {Object} data - Structured financial data
     * @returns {Object} JSON report
     */
    analyze(data) {
        const validation = this._validateData(data);
        const indicators = this._calculateIndicators(data);
        const redFlags = this._identifyRedFlags(data, indicators);
        const riskScore = this._calculateRiskScore(indicators, redFlags, validation.quality);
        const explanation = this._generateExplanation(indicators, redFlags, validation);

        return {
            risk_score: riskScore.score,
            risk_level: riskScore.level,
            key_indicators: {
                liquidity_ratio: indicators.liquidity,
                debt_ratio: indicators.debtRatio,
                debt_coverage: indicators.debtCoverage,
                cashflow_stability: indicators.cashflowStability
            },
            regulatory_explanation: explanation,
            red_flags: redFlags,
            analysis_summary: this._generateSummary(riskScore, indicators, redFlags),
            recommendations: this._generateRecommendations(riskScore, indicators),
            confidence_level: validation.confidence
        };
    }

    _validateData(data) {
        let issues = [];
        let missingFields = 0;
        const required = ['assets_current', 'liabilities_current', 'assets_total', 'liabilities_total'];

        required.forEach(field => {
            if (data[field] === undefined || data[field] === null) {
                issues.push(`Falta dato crítico: ${field}`);
                missingFields++;
            }
        });

        // Data quality assessment
        let quality = 'HIGH';
        if (missingFields > 0) quality = 'MEDIUM';
        if (missingFields > 2) quality = 'LOW';

        return { issues, quality, confidence: quality };
    }

    _calculateIndicators(data) {
        // Safe division helper
        const safeDiv = (n, d) => (d && d !== 0) ? (n / d) : null;

        return {
            liquidity: safeDiv(data.assets_current, data.liabilities_current),
            debtRatio: safeDiv(data.liabilities_total, data.assets_total),
            debtCoverage: safeDiv(data.ebitda, data.debt_financial),
            cashflowStability: data.cashflow_stability || 'UNKNOWN' // Assumed pre-calculated or strictly categorical input
        };
    }

    _identifyRedFlags(data, indicators) {
        const flags = [];

        // Regulatory & Best Practices Checks
        if (indicators.liquidity !== null && indicators.liquidity < this.THRESHOLDS.liquidity.warning) {
            flags.push(`Liquidez corriente baja (${indicators.liquidity.toFixed(2)}) < 1.0`);
        }
        if (indicators.debtRatio !== null && indicators.debtRatio > this.THRESHOLDS.debtRatio.warning) {
            flags.push(`Endeudamiento alto (${(indicators.debtRatio * 100).toFixed(1)}%) > 70%`);
        }
        if (indicators.debtCoverage !== null && indicators.debtCoverage < this.THRESHOLDS.debtCoverage.warning) {
            flags.push(`Cobertura de deuda insuficiente (${indicators.debtCoverage.toFixed(2)}) < 1.2`);
        }
        if (data.legal_issues) {
            flags.push("Existencia de litigios o problemas legales reportados");
        }
        if (indicators.cashflowStability === 'LOW') {
            flags.push("Alta volatilidad en flujo de caja detectada");
        }

        return flags;
    }

    _calculateRiskScore(indicators, redFlags, dataQuality) {
        let score = this.SCORING.base;
        let drivers = [];

        // Penalties based on indicators
        if (indicators.liquidity !== null && indicators.liquidity < 1.0) {
            score -= this.SCORING.penalties.lowLiquidity;
            drivers.push("Liquidez inferior a 1.0");
        }

        if (indicators.debtRatio !== null && indicators.debtRatio > 0.7) {
            score -= this.SCORING.penalties.highDebt;
            drivers.push("Endeudamiento superior al 70%");
        }

        if (indicators.debtCoverage !== null && indicators.debtCoverage < 1.2) {
            score -= this.SCORING.penalties.lowCoverage;
            drivers.push("Cobertura de deuda inferior a 1.2x");
        }

        if (indicators.cashflowStability === 'LOW') {
            score -= this.SCORING.penalties.volatileCashflow;
            drivers.push("Flujo de caja volátil");
        }

        // Data Quality Penalty
        if (dataQuality === 'MEDIUM') score -= 10;
        if (dataQuality === 'LOW') {
            score -= this.SCORING.penalties.incompleteData;
            drivers.push("Información financiera incompleta");
        }

        // External Red Flags (e.g. legal)
        if (redFlags.some(f => f.includes("litigios") || f.includes("legal"))) {
            score -= this.SCORING.penalties.redFlag;
            drivers.push("Alertas legales detectadas");
        }

        // Clamp score 0-100
        score = Math.max(0, Math.min(100, score));

        // Determine Level
        let level = 'HIGH';
        if (score >= 80) level = 'LOW';
        else if (score >= 60) level = 'MEDIUM';

        return { score, level, drivers };
    }

    _generateExplanation(indicators, redFlags, validation) {
        const mainDrivers = [];
        const adjustments = [];

        if (indicators.liquidity < 1.0) mainDrivers.push("Posición de liquidez comprometida");
        if (indicators.debtRatio > 0.7) mainDrivers.push("Estructura de capital altamente apalancada");

        if (validation.quality !== 'HIGH') {
            adjustments.push("Ajuste prudencial por calidad de datos limitada");
        }

        return {
            main_risk_drivers: mainDrivers.length > 0 ? mainDrivers : ["Sin factores de riesgo mayores identificados"],
            prudential_adjustments: adjustments,
            data_quality_impact: validation.quality
        };
    }

    _generateSummary(riskScore, indicators, redFlags) {
        const status = riskScore.level === 'LOW' ? 'sólida' : (riskScore.level === 'MEDIUM' ? 'aceptable con observaciones' : 'crítica');
        return `La entidad presenta una situación financiera ${status}, con un Risk Score de ${riskScore.score}/100. ${redFlags.length > 0 ? `Se detectaron ${redFlags.length} señales de alerta.` : 'No se detectaron señales de alerta críticas.'}`;
    }

    _generateRecommendations(riskScore, indicators) {
        const recs = [];
        if (riskScore.level === 'HIGH') {
            recs.push("Requerir garantías adicionales o avales.");
            recs.push("Limitar exposición crediticia a corto plazo.");
        } else if (riskScore.level === 'MEDIUM') {
            recs.push("Monitoreo trimestral de covenants financieros.");
        } else {
            recs.push("Mantener condiciones estándar de crédito.");
        }

        if (indicators.dataQuality === 'LOW' || indicators.dataQuality === 'MEDIUM') {
            recs.push("Solicitar estados financieros auditados completos para mejorar el score.");
        }

        return recs;
    }
}
