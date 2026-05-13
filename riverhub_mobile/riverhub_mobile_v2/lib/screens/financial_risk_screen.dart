import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

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

  final _activos = TextEditingController(text: '500000');
  final _pasivos = TextEditingController(text: '400000');
  final _activosT = TextEditingController(text: '2000000');
  final _pasivosT = TextEditingController(text: '1200000');
  final _ebitda = TextEditingController(text: '300000');
  final _deuda = TextEditingController(text: '250000');

  @override
  void dispose() {
    _activos.dispose();
    _pasivos.dispose();
    _activosT.dispose();
    _pasivosT.dispose();
    _ebitda.dispose();
    _deuda.dispose();
    super.dispose();
  }

  void _analyze() {
    final activosC = double.tryParse(_activos.text) ?? 0;
    final pasivosC = double.tryParse(_pasivos.text) ?? 0;
    final activosT = double.tryParse(_activosT.text) ?? 0;
    final pasivosT = double.tryParse(_pasivosT.text) ?? 0;
    final ebitda = double.tryParse(_ebitda.text) ?? 0;
    final deuda = double.tryParse(_deuda.text) ?? 0;

    // Financial ratios
    final liquidez = pasivosC > 0 ? activosC / pasivosC : 0.0; // Current ratio
    final endeudamiento = activosT > 0 ? (pasivosT / activosT) * 100 : 0.0; // Debt ratio %
    final coberturaDeuda = deuda > 0 ? ebitda / deuda : 99.0; // EBITDA coverage
    final patrimonioNeto = activosT - pasivosT;
    final solvencia = pasivosT > 0 ? patrimonioNeto / pasivosT : 0.0;

    // Weighted score (0-100)
    double score = 50; // Base
    // Liquidity (weight: 25)
    if (liquidez >= 2.0) score += 25;
    else if (liquidez >= 1.5) score += 20;
    else if (liquidez >= 1.0) score += 10;
    else score -= 10;
    // Debt ratio (weight: 25)
    if (endeudamiento < 40) score += 25;
    else if (endeudamiento < 50) score += 15;
    else if (endeudamiento < 60) score += 5;
    else score -= 15;
    // EBITDA coverage (weight: 25)
    if (coberturaDeuda >= 3.0) score += 25;
    else if (coberturaDeuda >= 2.0) score += 15;
    else if (coberturaDeuda >= 1.0) score += 5;
    else score -= 15;

    score = score.clamp(0, 100).toDouble();

    // Generate dynamic flags
    List<String> dynamicFlags = [];
    if (endeudamiento > 50) dynamicFlags.add('Endeudamiento alto (${endeudamiento.toStringAsFixed(0)}%) > 50%');
    if (endeudamiento <= 50) dynamicFlags.add('Endeudamiento saludable (${endeudamiento.toStringAsFixed(0)}%)');
    if (coberturaDeuda < 1.5) dynamicFlags.add('Cobertura de deuda ajustada (${coberturaDeuda.toStringAsFixed(1)}x)');
    if (coberturaDeuda >= 1.5) dynamicFlags.add('Cobertura de deuda favorable (${coberturaDeuda.toStringAsFixed(1)}x)');
    if (liquidez < 1.0) dynamicFlags.add('Liquidez corriente insuficiente (${liquidez.toStringAsFixed(2)}x) < 1.0x');
    if (liquidez >= 1.0 && liquidez < 1.5) dynamicFlags.add('Liquidez corriente ajustada (${liquidez.toStringAsFixed(2)}x)');
    if (liquidez >= 1.5) dynamicFlags.add('Liquidez corriente favorable (${liquidez.toStringAsFixed(2)}x)');
    if (solvencia < 0.5) dynamicFlags.add('Solvencia baja: patrimonio neto \$${patrimonioNeto.toStringAsFixed(0)}');
    if (patrimonioNeto < 0) dynamicFlags.add('PATRIMONIO NETO NEGATIVO (\$${patrimonioNeto.toStringAsFixed(0)})');

    setState(() {
      _analyzed = true;
      _riskScore = score.round();
      _riskLevel = _riskScore >= 80 ? 'BAJO' : _riskScore >= 60 ? LocaleService.t('dyn_key_111') : 'ALTO';
      _flags = dynamicFlags;
    });
  }

  Color get _scoreColor => _riskScore >= 80 ? AppColors.success : _riskScore >= 60 ? AppColors.warning : AppColors.error;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: const Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text(LocaleService.t('dyn_key_112'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Análisis de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Riesgo Financiero', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 6),
            Text('SCORING CREDITICIO', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 24),

            // Inputs
            _inputField('Activos Corrientes (\$)', _activos),
            _inputField('Pasivos Corrientes (\$)', _pasivos),
            _inputField('Activos Totales (\$)', _activosT),
            _inputField('Pasivos Totales (\$)', _pasivosT),
            _inputField('EBITDA (\$)', _ebitda),
            _inputField('Deuda Financiera (\$)', _deuda),
            const SizedBox(height: 20),

            // Analyze button
            GestureDetector(
              onTap: _analyze,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                child: Center(child: Text(LocaleService.t('dyn_key_110'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.backgroundPrimary, letterSpacing: 0.5))),
              ),
            ),

            if (_analyzed) ...[
              const SizedBox(height: 24),
              // Score card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _scoreColor.withValues(alpha: 0.3), width: 1),
                ),
                child: Column(children: [
                  Text('$_riskScore', style: GoogleFonts.newsreader(fontSize: 56, fontWeight: FontWeight.w600, color: _scoreColor, height: 1)),
                  Text('/ 100', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(color: _scoreColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                    child: Text('RIESGO $_riskLevel', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: _scoreColor, letterSpacing: 0.5)),
                  ),
                ]),
              ),
              const SizedBox(height: 16),

              // Flags
              Text('ALERTAS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
              const SizedBox(height: 10),
              ..._flags.map((f) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.separator, width: 0.5),
                ),
                child: Row(children: [
                  Icon(CupertinoIcons.exclamationmark_triangle, size: 16, color: AppColors.warning),
                  const SizedBox(width: 10),
                  Expanded(child: Text(f, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textPrimary))),
                ]),
              )),
            ],
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _inputField(String label, TextEditingController ctrl) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Row(children: [
          Icon(CupertinoIcons.money_dollar_circle, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(child: CupertinoTextField(
            controller: ctrl,
            placeholder: label,
            keyboardType: TextInputType.number,
            placeholderStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textTertiary),
            style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
            decoration: const BoxDecoration(),
            padding: const EdgeInsets.symmetric(vertical: 12),
          )),
        ]),
      ),
    );
  }
}
