import 'package:flutter/cupertino.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class FinancialRiskScreen extends StatefulWidget {
  const FinancialRiskScreen({super.key});
  @override
  State<FinancialRiskScreen> createState() => _FinancialRiskScreenState();
}

class _FinancialRiskScreenState extends State<FinancialRiskScreen> {
  bool _analyzed = false;
  int _riskScore = 0;
  String _riskLevel = '';
  List<String> _flags = [];

  void _analyze() {
    setState(() {
      _analyzed = true;
      _riskScore = 72;
      _riskLevel = 'MEDIO';
      _flags = [
        'Endeudamiento alto (60%) > 50%',
        'Cobertura de deuda ajustada (1.2x)',
      ];
    });
  }

  Color get _scoreColor => _riskScore >= 80
      ? AppColors.success
      : _riskScore >= 60
      ? AppColors.warning
      : AppColors.error;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Riesgo Financiero',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.backgroundPrimary.withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: AppColors.accent),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: AppColors.backgroundPrimary,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _input('Activos Corrientes (\$)', '500000'),
            _input('Pasivos Corrientes (\$)', '400000'),
            _input('Activos Totales (\$)', '2000000'),
            _input('Pasivos Totales (\$)', '1200000'),
            _input('EBITDA (\$)', '300000'),
            _input('Deuda Financiera (\$)', '250000'),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: CupertinoButton.filled(
                onPressed: _analyze,
                child: const Text(
                  'ANALIZAR RIESGO',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            if (_analyzed) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _scoreColor.withValues(alpha: 0.5)),
                ),
                child: Column(
                  children: [
                    Text(
                      '$_riskScore',
                      style: TextStyle(
                        color: _scoreColor,
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      '/ 100',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _scoreColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'RIESGO $_riskLevel',
                        style: TextStyle(
                          color: _scoreColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ..._flags.map(
                (f) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      const Text('⚠️ ', style: TextStyle(fontSize: 14)),
                      Expanded(
                        child: Text(
                          f,
                          style: const TextStyle(
                            color: AppColors.textTertiary,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _input(String label, String val) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: CupertinoTextField(
        placeholder: label,
        controller: TextEditingController(text: val),
        keyboardType: TextInputType.number,
        style: const TextStyle(color: AppColors.textPrimary),
        placeholderStyle: const TextStyle(color: AppColors.textSecondary),
        decoration: BoxDecoration(
          color: AppColors.separator,
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.all(12),
      ),
    );
  }
}
