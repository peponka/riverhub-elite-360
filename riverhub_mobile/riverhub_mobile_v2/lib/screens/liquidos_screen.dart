import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../main.dart';

class LiquidosScreen extends StatefulWidget {
  const LiquidosScreen({super.key});
  @override
  State<LiquidosScreen> createState() => _LiquidosScreenState();
}

class _LiquidosScreenState extends State<LiquidosScreen> {
  final List<Map<String, dynamic>> _tanks = [
    {'name': 'BT-001 Petrobras', 'type': 'Tanque doble casco', 'cap': 2200, 'current': 1804, 'product': 'Gas Oil', 'productType': 'fuel', 'temp': 23, 'status': 'En tránsito', 'route': 'ASU → ROE'},
    {'name': 'BT-002 Copetrol', 'type': 'Tanque simple', 'cap': 1800, 'current': 810, 'product': 'Metanol', 'productType': 'chemical', 'temp': 19, 'status': 'Fondeada', 'route': 'Rosario'},
    {'name': 'BT-003 YPF', 'type': 'Tanque doble casco', 'cap': 2500, 'current': 2375, 'product': 'Crudo', 'productType': 'oil', 'temp': 28, 'status': 'En tránsito', 'route': 'CDB → BHI'},
    {'name': 'BT-004 Axion', 'type': 'Tanque simple', 'cap': 1500, 'current': 180, 'product': 'Nafta', 'productType': 'fuel', 'temp': 21, 'status': 'Descargando', 'route': 'San Lorenzo'},
    {'name': 'BT-005 Shell', 'type': 'Tanque doble casco', 'cap': 2000, 'current': 1200, 'product': 'Aceite Veg.', 'productType': 'water', 'temp': 25, 'status': 'En tránsito', 'route': 'VCO → SLO'},
    {'name': 'BT-006 Reserva', 'type': 'Tanque simple', 'cap': 1200, 'current': 0, 'product': 'Gas Oil', 'productType': 'fuel', 'temp': 0, 'status': 'Mantenimiento', 'route': 'Astillero ASU'},
  ];

  final List<Map<String, dynamic>> _ops = [
    {'date': '06/05 08:30', 'op': 'Descarga', 'barge': 'BT-004 Axion', 'product': 'Nafta', 'vol': '1,320 m³', 'terminal': 'Terminal San Lorenzo', 'dur': '6h 45m'},
    {'date': '05/05 14:00', 'op': 'Carga', 'barge': 'BT-001 Petrobras', 'product': 'Gas Oil', 'vol': '1,804 m³', 'terminal': 'PETROPAR Asunción', 'dur': '8h 20m'},
    {'date': '05/05 06:00', 'op': 'Trasvasije', 'barge': 'BT-002 → BT-005', 'product': 'Aceite Vegetal', 'vol': '400 m³', 'terminal': 'Zona fondeo Rosario', 'dur': '3h 10m'},
  ];

  int get _totalCurrent => _tanks.fold(0, (s, t) => s + (t['current'] as int));
  int get _totalCap => _tanks.fold(0, (s, t) => s + (t['cap'] as int));
  int get _avgUtil => _totalCap > 0 ? ((_totalCurrent / _totalCap) * 100).round() : 0;

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
        middle: Text('Líquidos', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          children: [
            Text('Gestión de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Líquidos.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 20),

            // KPIs
            Row(children: [
              Expanded(child: _kpi('BARCAZAS', '${_tanks.length}', CupertinoIcons.drop_fill, AppColors.purple)),
              const SizedBox(width: 8),
              Expanded(child: _kpi('UTILIZACIÓN', '$_avgUtil%', CupertinoIcons.chart_bar_fill, AppColors.warning)),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: _kpi('EN TRÁNSITO', '${(_totalCurrent / 1000).toStringAsFixed(1)}k m³', CupertinoIcons.arrow_right_arrow_left, AppColors.accent)),
              const SizedBox(width: 8),
              Expanded(child: _kpi('OPS HOY', '${_ops.length}', CupertinoIcons.arrow_2_circlepath, AppColors.success)),
            ]),
            const SizedBox(height: 24),

            // Tank Cards
            _sectionTitle('Barcazas Tanque', '${_tanks.length} monitoreadas'),
            const SizedBox(height: 12),
            ..._tanks.map((t) => _tankCard(t)),

            const SizedBox(height: 24),

            // Operations
            _sectionTitle('Últimas Operaciones', ''),
            const SizedBox(height: 12),
            ..._ops.map((o) => _opCard(o)),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
          Icon(icon, size: 14, color: color.withValues(alpha: 0.5)),
        ]),
        const SizedBox(height: 8),
        Text(value, style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1)),
      ]),
    );
  }

  Widget _sectionTitle(String title, String trailing) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(title, style: GoogleFonts.newsreader(fontSize: 20, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
      if (trailing.isNotEmpty) Text(trailing, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
    ]);
  }

  Color _productColor(String type) {
    switch (type) {
      case 'fuel': return AppColors.warning;
      case 'chemical': return AppColors.purple;
      case 'oil': return AppColors.textPrimary;
      case 'water': return AppColors.accent;
      default: return AppColors.textSecondary;
    }
  }

  Widget _tankCard(Map<String, dynamic> t) {
    final pct = t['cap'] > 0 ? ((t['current'] as int) / (t['cap'] as int) * 100).round() : 0;
    final color = _productColor(t['productType']);
    final isLight = pct > 50;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t['name'], style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            Text('${t['type']} — ${t['cap']} m³', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
            child: Text(t['product'], style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
          ),
        ]),
        const SizedBox(height: 14),

        // Gauge
        Container(
          height: 56,
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Stack(children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              width: double.infinity,
              height: 56,
              alignment: Alignment.bottomCenter,
              child: FractionallySizedBox(
                widthFactor: 1,
                heightFactor: pct / 100,
                child: Container(decoration: BoxDecoration(color: color.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(pct >= 100 ? 8 : 0))),
              ),
            ),
            Center(child: Text('$pct%', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: isLight ? CupertinoColors.white : AppColors.textPrimary))),
          ]),
        ),
        const SizedBox(height: 10),

        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Actual: ${t['current']} m³', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text('Cap: ${t['cap']} m³', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        ]),
        const SizedBox(height: 8),

        Wrap(spacing: 6, runSpacing: 4, children: [
          if (t['temp'] > 0) _metaChip('🌡️ ${t['temp']}°C'),
          _metaChip(t['status']),
          _metaChip(t['route']),
        ]),
      ]),
    );
  }

  Widget _metaChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
    );
  }

  Widget _opCard(Map<String, dynamic> o) {
    final isLoad = o['op'] == 'Carga';
    final isTransfer = o['op'] == 'Trasvasije';
    final color = isLoad ? AppColors.success : isTransfer ? AppColors.accent : AppColors.error;
    final icon = isLoad ? CupertinoIcons.arrow_up : isTransfer ? CupertinoIcons.arrow_right_arrow_left : CupertinoIcons.arrow_down;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${o['op']} — ${o['barge']}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text('${o['product']} · ${o['terminal']}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
          Text(o['date'], style: GoogleFonts.inter(fontSize: 9, color: AppColors.textTertiary)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(o['vol'], style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          Text(o['dur'], style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
        ]),
      ]),
    );
  }
}
