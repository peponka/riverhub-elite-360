import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../services/locale_service.dart';

class QuoteScreen extends StatefulWidget {
  const QuoteScreen({super.key});

  @override
  State<QuoteScreen> createState() => _QuoteScreenState();
}

class _QuoteScreenState extends State<QuoteScreen> {
  final _originController = TextEditingController(text: 'Asunción');
  final _destController = TextEditingController(text: 'Rosario');
  final _bunkerController = TextEditingController(text: '1.12');

  double _riverLevel = 3.5;
  String? _finalPrice;
  bool _isCalculating = false;
  String _aiAnalysis = LocaleService.t('dyn_key_203');

  @override
  void dispose() {
    _originController.dispose();
    _destController.dispose();
    _bunkerController.dispose();
    super.dispose();
  }

  Future<void> _calculateQuote() async {
    setState(() { _isCalculating = true; _finalPrice = null; _aiAnalysis = LocaleService.t('dyn_key_205'); });
    await Future.delayed(const Duration(milliseconds: 1500));

    String bunkerRaw = _bunkerController.text.replaceAll(',', '.');
    double bunker = double.tryParse(bunkerRaw) ?? 1.12;
    if (bunker > 100) bunker = bunker / 1000;
    double rate = 16.50;
    double bunkerDiff = bunker - 1.0;
    if (bunkerDiff > 0) rate += (bunkerDiff * 4.5);
    if (_riverLevel < 2.0) { rate += (2.0 - _riverLevel) * 9.0; }
    else if (_riverLevel < 3.0) { rate += (3.0 - _riverLevel) * 2.0; }
    if (rate < 12.0) rate = 12.0;

    _saveQuoteToDB(_originController.text, _destController.text, _riverLevel, bunker, rate);

    if (mounted) {
      setState(() {
        _isCalculating = false;
        _finalPrice = 'USD/TN ${rate.toStringAsFixed(2)}';
        _aiAnalysis = 'Tarifa ajustada por nivel de río (${_riverLevel.toStringAsFixed(2)}m) y MGO (\$${bunker.toStringAsFixed(2)}/L).';
      });
    }
  }

  Future<void> _saveQuoteToDB(String origin, String dest, double river, double bunker, double rate) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      final quoteNum = "QT-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}";
      await Supabase.instance.client.from('quotations').insert({
        'quote_number': quoteNum, 'origin_port': origin, 'destination_port': dest,
        'cargo_type': LocaleService.t('dyn_key_207'), 'estimated_weight': 15000, 'freight_rate': rate,
        'currency': 'USD', 'status': 'draft',
        'ai_argumentation': 'Calculado con Río en ${river}m y Bunker a \$$bunker',
        'generated_by': user?.email ?? 'System Mobile',
      });
    } catch (e) { debugPrint('Error: $e'); }
  }

  Widget _field(TextEditingController ctrl, String placeholder, {Widget? prefix}) {
    return CupertinoTextField(
      controller: ctrl, placeholder: placeholder,
      padding: const EdgeInsets.all(14),
      placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
      style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
      prefix: prefix,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        middle: Text(LocaleService.t('quote_cotizador'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text(LocaleService.t('quote_cotizador'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text(LocaleService.t('quote_inteligente'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 24),

            // Route card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(LocaleService.t('quote_ruta_logistica'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 14),
                  Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(LocaleService.t('quote_origen'), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                      const SizedBox(height: 4),
                      _field(_originController, LocaleService.t('dyn_key_204')),
                    ])),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
                      child: Icon(CupertinoIcons.arrow_right, color: AppColors.separator, size: 16),
                    ),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(LocaleService.t('quote_destino'), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                      const SizedBox(height: 4),
                      _field(_destController, LocaleService.t('dyn_key_206')),
                    ])),
                  ]),
                  const SizedBox(height: 20),
                  Container(height: 0.5, color: AppColors.separator),
                  const SizedBox(height: 20),
                  Text(LocaleService.t('quote_variables_fisicas'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 14),
                  Text(LocaleService.t('quote_precio_bunker_usd_l'), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                  const SizedBox(height: 4),
                  _field(_bunkerController, '1.12', prefix: Padding(
                    padding: const EdgeInsets.only(left: 14),
                    child: Text('\$', style: GoogleFonts.inter(color: AppColors.textSecondary)),
                  )),
                  const SizedBox(height: 16),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text(LocaleService.t('quote_nivel_del_rio'), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                    Text('${_riverLevel.toStringAsFixed(2)} m', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  ]),
                  CupertinoSlider(
                    value: _riverLevel, min: 0.5, max: 6.0, divisions: 55,
                    activeColor: AppColors.textPrimary,
                    onChanged: (val) => setState(() => _riverLevel = val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Button
            SizedBox(
              width: double.infinity,
              child: CupertinoButton(
                color: AppColors.textPrimary,
                borderRadius: BorderRadius.circular(12),
                padding: const EdgeInsets.symmetric(vertical: 16),
                onPressed: _isCalculating ? null : _calculateQuote,
                child: _isCalculating
                    ? const CupertinoActivityIndicator(color: AppColors.textOnAccent)
                    : Text(LocaleService.t('quote_calcular_tarifa'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textOnAccent)),
              ),
            ),
            const SizedBox(height: 24),

            // Result card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Column(children: [
                Text(LocaleService.t('quote_tarifa_recomendada'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                const SizedBox(height: 12),
                Text(
                  _finalPrice ?? '---',
                  style: GoogleFonts.newsreader(
                    fontSize: 40, fontWeight: FontWeight.w400,
                    color: _finalPrice != null ? AppColors.textPrimary : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Icon(CupertinoIcons.bolt_fill, color: AppColors.textSecondary, size: 16),
                    const SizedBox(width: 10),
                    Expanded(child: Text(_aiAnalysis, style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 12, height: 1.4))),
                  ]),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}
