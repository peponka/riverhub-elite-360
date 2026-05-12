import 'dart:convert';
import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
import '../services/locale_service.dart';

/// Invoice Intelligence screen — paste invoice text and analyze with Gemini AI.
class FacturacionIAScreen extends StatefulWidget {
  const FacturacionIAScreen({super.key});

  @override
  State<FacturacionIAScreen> createState() => _FacturacionIAScreenState();
}

class _FacturacionIAScreenState extends State<FacturacionIAScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  Map<String, dynamic>? _result;
  String? _error;

  static const String _demoInvoice = '''FACTURA DE FLETE FLUVIAL
N° 0001-00004521
Fecha: 15/04/2026
Emisor: Transportes Fluviales del Paraná S.A.
CUIT: 30-71234567-8
Cliente: Cargill S.A.C.I.

Detalle del servicio:
- Viaje: Convoy C-47 | Ruta: Asunción (PY) → Rosario (AR)
- Embarcación: R/M HÉRCULES + 6 barcazas
- Carga: 8.400 toneladas de soja a granel
- Distancia: 1.580 km

Conceptos:
1. Flete principal (8.400 ton x USD 12.50/ton)............ USD 105,000.00
2. Sobrestadía puerto Rosario (3 días x USD 2,800/día).... USD   8,400.00
3. Combustible adicional (2.100 lt x USD 0.92/lt)......... USD   1,932.00
4. Seguro de carga (0.15% sobre valor declarado).......... USD   4,200.00
5. Servicio de practicaje.................................. USD   1,500.00

Subtotal:.............. USD 121,032.00
IVA 21%:............... USD  25,416.72
TOTAL:................. USD 146,448.72

Condición de pago: 30 días fecha factura
Cuenta: Banco Nación — CBU 0110012340001234567890''';

  Future<void> _analyze() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() { _loading = true; _error = null; _result = null; });

    try {
      final client = HttpClient();
      client.connectionTimeout = const Duration(seconds: 90);
      final uri = Uri.parse('https://riverhub-elite-360.onrender.com/api/ai/invoice');
      final request = await client.postUrl(uri);
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer demo');
      request.write(jsonEncode({'invoiceText': text}));
      final response = await request.close().timeout(const Duration(seconds: 120));
      final body = await response.transform(utf8.decoder).join();
      final data = jsonDecode(body) as Map<String, dynamic>;

      if (data.containsKey('result')) {
        setState(() => _result = data['result'] as Map<String, dynamic>);
      } else if (data.containsKey('apiError')) {
        setState(() => _error = 'Gemini API: ${data['apiError']}');
      } else {
        setState(() => _error = data['raw']?.toString() ?? 'No se pudo procesar');
      }
    } catch (e) {
      setState(() => _error = 'Error de conexión: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundSecondary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundPrimary,
        middle: Text('Invoice Intelligence', style: GoogleFonts.newsreader(fontSize: 18, fontWeight: FontWeight.w500)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Text('Demo', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF7C3AED))),
          onPressed: () => setState(() { _controller.text = _demoInvoice; _result = null; _error = null; }),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E293B)]),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(children: [
                const Icon(CupertinoIcons.lightbulb_fill, color: Color(0xFF00C2A8), size: 24),
                const SizedBox(width: 12),
                Expanded(child: Text(
                  'Pegá el texto de una factura y la IA extraerá datos, validará montos y detectará discrepancias.',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.white70),
                )),
              ]),
            ),
            const SizedBox(height: 16),

            // Input
            _card(
              title: 'FACTURA A ANALIZAR',
              child: Column(children: [
                CupertinoTextField(
                  controller: _controller,
                  placeholder: 'Pegá aquí el texto de la factura...',
                  maxLines: 8,
                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.textPrimary),
                  placeholderStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.separator),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: CupertinoButton.filled(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      onPressed: _loading ? null : _analyze,
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(_loading ? CupertinoIcons.hourglass : CupertinoIcons.sparkles, size: 16),
                        const SizedBox(width: 8),
                        Text(_loading ? 'Analizando...' : 'Analizar con IA', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      ]),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CupertinoButton(
                    padding: const EdgeInsets.all(12),
                    color: AppColors.separator,
                    child: const Icon(CupertinoIcons.trash, size: 16, color: Colors.black54),
                    onPressed: () => setState(() { _controller.clear(); _result = null; _error = null; }),
                  ),
                ]),
              ]),
            ),

            // Loading
            if (_loading)
              Padding(
                padding: const EdgeInsets.all(24),
                child: Center(child: Column(children: [
                  const CupertinoActivityIndicator(radius: 14),
                  const SizedBox(height: 8),
                  Text('Gemini está analizando...', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
                ])),
              ),

            // Error
            if (_error != null)
              Container(
                margin: const EdgeInsets.only(top: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: const Color(0xFFFEE2E2), borderRadius: BorderRadius.circular(12)),
                child: Text(_error!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF991B1B))),
              ),

            // Results
            if (_result != null) ..._buildResults(),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildResults() {
    final inv = (_result!['invoice'] ?? {}) as Map<String, dynamic>;
    final val = (_result!['validation'] ?? {}) as Map<String, dynamic>;
    final sum = (_result!['summary'] ?? {}) as Map<String, dynamic>;
    final status = (sum['status'] ?? 'REVISAR').toString().toUpperCase();
    final isApproved = status.contains('APROB');
    final isRejected = status.contains('RECH');

    return [
      const SizedBox(height: 16),
      // Status
      _card(title: 'RESULTADO', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: isApproved ? const Color(0xFFDCFCE7) : isRejected ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(status, style: GoogleFonts.inter(
            fontSize: 12, fontWeight: FontWeight.w700,
            color: isApproved ? const Color(0xFF166534) : isRejected ? const Color(0xFF991B1B) : const Color(0xFF92400E),
          )),
        ),
        if (sum['confidence'] != null) ...[
          const SizedBox(height: 8),
          Text('Confianza: ${sum['confidence']}%', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
        ],
        if (sum['notes'] != null) ...[
          const SizedBox(height: 8),
          Text(sum['notes'].toString(), style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
        ],
        const SizedBox(height: 16),
        _statRow('N° Factura', inv['number']?.toString() ?? 'N/A'),
        _statRow('Proveedor', inv['supplier']?.toString() ?? 'N/A'),
        _statRow('Fecha', inv['date']?.toString() ?? 'N/A'),
        _statRow('Total', '${inv['currency'] ?? 'USD'} ${_formatNum(inv['total'])}'),
      ])),

      // Items
      if ((inv['items'] as List?)?.isNotEmpty ?? false)
        _card(title: 'ÍTEMS EXTRAÍDOS', child: Column(
          children: (inv['items'] as List).map<Widget>((item) {
            final it = item as Map<String, dynamic>;
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF4F4F5)))),
              child: Row(children: [
                Expanded(child: Text(it['description']?.toString() ?? '', style: GoogleFonts.inter(fontSize: 13))),
                Text(_formatNum(it['subtotal']), style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
              ]),
            );
          }).toList(),
        )),

      // Discrepancies
      if ((val['discrepancies'] as List?)?.isNotEmpty ?? false)
        _card(title: 'DISCREPANCIAS', child: Column(
          children: (val['discrepancies'] as List).map<Widget>((d) {
            final disc = d as Map<String, dynamic>;
            final sev = disc['severity']?.toString() ?? 'INFO';
            final color = sev == 'CRITICA' ? const Color(0xFFEF4444) : sev == 'ADVERTENCIA' ? const Color(0xFFF59E0B) : const Color(0xFF3B82F6);
            final bg = sev == 'CRITICA' ? const Color(0xFFFEE2E2) : sev == 'ADVERTENCIA' ? const Color(0xFFFEF3C7) : const Color(0xFFDBEAFE);
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                CircleAvatar(radius: 14, backgroundColor: color, child: Icon(CupertinoIcons.exclamationmark, size: 14, color: Colors.white)),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${disc['field']}: ${disc['invoiceValue']} vs ${disc['systemValue']}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  if (disc['note'] != null) Text(disc['note'].toString(), style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                ])),
              ]),
            );
          }).toList(),
        )),
    ];
  }

  Widget _card({required String title, required Widget child}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.backgroundPrimary,
        border: Border.all(color: AppColors.separator),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: AppColors.textSecondary)),
        const SizedBox(height: 14),
        child,
      ]),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
        Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
      ]),
    );
  }

  String _formatNum(dynamic val) {
    if (val == null) return '0.00';
    final num n = val is num ? val : double.tryParse(val.toString()) ?? 0;
    return n.toStringAsFixed(2).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+\.)'), (m) => '${m[1]},');
  }
}
