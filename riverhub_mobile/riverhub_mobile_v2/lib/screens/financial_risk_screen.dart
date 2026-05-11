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

  void _analyze() {
    setState(() {
      _analyzed = true;
      _riskScore = 72;
      _riskLevel = LocaleService.t('dyn_key_111');
      _flags = [
        'Endeudamiento alto (60%) > 50%',
        'Cobertura de deuda ajustada (1.2x)',
        'Liquidez corriente favorable (1.25x)',
      ];
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
