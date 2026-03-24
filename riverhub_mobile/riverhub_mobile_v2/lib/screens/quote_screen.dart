import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
  String _aiAnalysis = 'Listo para calcular tarifa...';

  Future<void> _calculateQuote() async {
    setState(() {
      _isCalculating = true;
      _finalPrice = null;
      _aiAnalysis = 'Analizando variables de ruta y navegabilidad...';
    });

    // Simulate AI thinking time
    await Future.delayed(const Duration(milliseconds: 1500));

    // Logic Mirroring JS
    String bunkerRaw = _bunkerController.text.replaceAll(',', '.');
    double bunker = double.tryParse(bunkerRaw) ?? 1.12;
    if (bunker > 100) bunker = bunker / 1000;

    double rate = 16.50; // Base rate Asu-Ros

    // Bunker Adjustment
    double bunkerDiff = bunker - 1.0;
    if (bunkerDiff > 0) rate += (bunkerDiff * 4.5);

    // River Adjustment
    if (_riverLevel < 2.0) {
      rate += (2.0 - _riverLevel) * 9.0;
    } else if (_riverLevel < 3.0) {
      rate += (3.0 - _riverLevel) * 2.0;
    }

    if (rate < 12.0) rate = 12.0; // Min cap

    String calculatedPrice = rate.toStringAsFixed(2);

    // Save to Supabase DB Behind the scenes
    _saveQuoteToDB(
      _originController.text,
      _destController.text,
      _riverLevel,
      bunker,
      rate,
    );

    if (mounted) {
      setState(() {
        _isCalculating = false;
        _finalPrice = 'USD/TN $calculatedPrice';
        _aiAnalysis =
            'Análisis de ruta completado. Tarifa ajustada automáticamente por nivel de río (${_riverLevel.toStringAsFixed(2)}m) y precio MGO actual (\$${bunker.toStringAsFixed(2)}/L).';
      });
    }
  }

  Future<void> _saveQuoteToDB(
    String origin,
    String dest,
    double river,
    double bunker,
    double rate,
  ) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      final quoteNum =
          "QT-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}";

      await Supabase.instance.client.from('quotations').insert({
        'quote_number': quoteNum,
        'origin_port': origin,
        'destination_port': dest,
        'cargo_type': 'Granel General',
        'estimated_weight': 15000,
        'freight_rate': rate,
        'currency': 'USD',
        'status': 'draft',
        'ai_argumentation':
            'Calculado con Río en $river'
            'm y Bunker a \$$bunker',
        'generated_by': user?.email ?? 'System Mobile',
      });
      debugPrint('Cotización Guardada DB: $quoteNum');
    } catch (e) {
      debugPrint('Error Guardando Cotización: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: CupertinoColors.systemGroupedBackground,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CupertinoColors.white.withValues(alpha: 0.85),
        middle: Text(
          'Cotizador IA',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          children: [
            // Input Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: CupertinoColors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: CupertinoColors.systemGrey.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ruta Logística',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: CupertinoColors.activeBlue,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Origen',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: CupertinoColors.systemGrey,
                              ),
                            ),
                            const SizedBox(height: 4),
                            CupertinoTextField(
                              controller: _originController,
                              padding: const EdgeInsets.all(12),
                            ),
                          ],
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 20,
                        ),
                        child: Icon(
                          CupertinoIcons.arrow_right_circle_fill,
                          color: CupertinoColors.systemGrey3,
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Destino',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: CupertinoColors.systemGrey,
                              ),
                            ),
                            const SizedBox(height: 4),
                            CupertinoTextField(
                              controller: _destController,
                              padding: const EdgeInsets.all(12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const material.Divider(height: 1),
                  const SizedBox(height: 20),

                  Text(
                    'Variables Físicas',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: CupertinoColors.activeBlue,
                    ),
                  ),
                  const SizedBox(height: 16),

                  Text(
                    'Precio Bunker (USD/Litro)',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: CupertinoColors.systemGrey,
                    ),
                  ),
                  const SizedBox(height: 4),
                  CupertinoTextField(
                    controller: _bunkerController,
                    padding: const EdgeInsets.all(12),
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    prefix: const Padding(
                      padding: EdgeInsets.only(left: 10),
                      child: Text('\$'),
                    ),
                  ),

                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Nivel del Río Origen',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: CupertinoColors.systemGrey,
                        ),
                      ),
                      Text(
                        '${_riverLevel.toStringAsFixed(2)} m',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  CupertinoSlider(
                    value: _riverLevel,
                    min: 0.5,
                    max: 6.0,
                    divisions: 55,
                    activeColor: CupertinoColors.activeBlue,
                    onChanged: (val) {
                      setState(() => _riverLevel = val);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ACTION BUTTON
            SizedBox(
              width: double.infinity,
              height: 55,
              child: CupertinoButton(
                color: CupertinoColors.activeBlue,
                borderRadius: BorderRadius.circular(15),
                onPressed: _isCalculating ? null : _calculateQuote,
                child: _isCalculating
                    ? const CupertinoActivityIndicator(
                        color: CupertinoColors.white,
                      )
                    : Text(
                        'CALCULAR TARIFA',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
              ),
            ),

            const SizedBox(height: 24),

            // Result Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    CupertinoColors.darkBackgroundGray,
                    Color(0xFF1c1c1e),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: CupertinoColors.systemGrey3.withValues(alpha: 0.2),
                ),
              ),
              child: Column(
                children: [
                  Text(
                    'TARIFA RECOMENDADA',
                    style: GoogleFonts.inter(
                      color: CupertinoColors.systemGrey,
                      fontSize: 12,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 16),

                  Text(
                    _finalPrice ?? '---',
                    style: GoogleFonts.inter(
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                      color: _finalPrice != null
                          ? const Color(0xFF00e5ff)
                          : CupertinoColors.systemGrey,
                    ),
                  ),

                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: CupertinoColors.black.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF00e5ff).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          CupertinoIcons.sparkles,
                          color: Color(0xFF00e5ff),
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _aiAnalysis,
                            style: GoogleFonts.inter(
                              color: CupertinoColors.white,
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
