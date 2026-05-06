import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../main.dart';

class ContratosScreen extends StatefulWidget {
  const ContratosScreen({super.key});
  @override
  State<ContratosScreen> createState() => _ContratosScreenState();
}

class _ContratosScreenState extends State<ContratosScreen> {
  final List<Map<String, dynamic>> _contracts = [
    {'client': 'Cargill S.A.', 'route': 'Rosario → Asunción', 'product': 'Soja', 'type': 'COA Anual', 'status': 'active', 'vol': 84000, 'volUsed': 61200, 'rate': 28.5, 'expires': '31 Dic 2026'},
    {'client': 'ADM Paraguay', 'route': 'Concepción → San Lorenzo', 'product': 'Maíz', 'type': 'Semestral', 'status': 'active', 'vol': 48000, 'volUsed': 32400, 'rate': 24.2, 'expires': '30 Jun 2026'},
    {'client': 'PETROPAR', 'route': 'Montevideo → Asunción', 'product': 'Gas Oil', 'type': 'COA Anual', 'status': 'expires', 'vol': 36000, 'volUsed': 33800, 'rate': 42.8, 'expires': '15 Jun 2026'},
    {'client': 'Bunge Ltd.', 'route': 'Rosario → Nueva Palmira', 'product': 'Harina', 'type': 'Trimestral', 'status': 'active', 'vol': 24000, 'volUsed': 18000, 'rate': 22.0, 'expires': '30 Sep 2026'},
    {'client': 'Louis Dreyfus', 'route': 'Barranqueras → Rosario', 'product': 'Algodón', 'type': 'Spot', 'status': 'renewing', 'vol': 12000, 'volUsed': 12000, 'rate': 35.0, 'expires': '10 May 2026'},
    {'client': 'Viterra', 'route': 'San Lorenzo → Bahía Blanca', 'product': 'Trigo', 'type': 'Semestral', 'status': 'active', 'vol': 60000, 'volUsed': 22000, 'rate': 26.8, 'expires': '31 Dic 2026'},
  ];

  int get _activeCount => _contracts.where((c) => c['status'] == 'active').length;
  int get _totalTonnage => _contracts.fold(0, (s, c) => s + (c['vol'] as int));
  double get _totalRevenue => _contracts.fold(0.0, (s, c) => s + ((c['volUsed'] as int) * (c['rate'] as double)) / 1000);
  int get _expiringCount => _contracts.where((c) => c['status'] == 'expires' || c['status'] == 'renewing').length;

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
        middle: Text('Contratos', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: _showNewContract, child: const Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          children: [
            Text('Contratos de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Flete.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 20),

            // KPIs
            Row(children: [
              Expanded(child: _kpi('ACTIVOS', '$_activeCount', CupertinoIcons.doc_text_fill, AppColors.accent)),
              const SizedBox(width: 8),
              Expanded(child: _kpi('TONELAJE', '${(_totalTonnage / 1000).round()}k', CupertinoIcons.cube_box_fill, AppColors.success)),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: _kpi('REVENUE', '\$${_totalRevenue.toStringAsFixed(0)}k', CupertinoIcons.money_dollar_circle_fill, AppColors.warning)),
              const SizedBox(width: 8),
              Expanded(child: _kpi('POR EXPIRAR', '$_expiringCount', CupertinoIcons.exclamationmark_triangle_fill, AppColors.error)),
            ]),
            const SizedBox(height: 24),

            // Contracts List
            _sectionTitle('Contratos Vigentes', '${_contracts.length} total'),
            const SizedBox(height: 12),
            ..._contracts.map((c) => _contractCard(c)),

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

  Color _statusColor(String status) {
    switch (status) {
      case 'active': return AppColors.success;
      case 'expires': return AppColors.warning;
      case 'renewing': return AppColors.accent;
      default: return AppColors.textSecondary;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'active': return 'ACTIVO';
      case 'expires': return 'EXPIRA';
      case 'renewing': return 'RENOVANDO';
      default: return status.toUpperCase();
    }
  }

  Widget _contractCard(Map<String, dynamic> c) {
    final pct = (c['vol'] as int) > 0 ? ((c['volUsed'] as int) / (c['vol'] as int) * 100).round() : 0;
    final color = _statusColor(c['status']);
    final barColor = pct > 90 ? AppColors.error : pct > 70 ? AppColors.warning : AppColors.success;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Text(c['client'], style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
            child: Text(_statusLabel(c['status']), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5)),
          ),
        ]),
        const SizedBox(height: 2),
        Text('${c['route']} — ${c['product']}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        const SizedBox(height: 12),

        // Usage bar
        Container(
          height: 8,
          decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(4)),
          child: LayoutBuilder(builder: (_, constraints) => Stack(children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 600),
              width: constraints.maxWidth * (pct / 100).clamp(0.0, 1.0),
              height: 8,
              decoration: BoxDecoration(color: barColor, borderRadius: BorderRadius.circular(4)),
            ),
          ])),
        ),
        const SizedBox(height: 6),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('${c['volUsed']} / ${c['vol']} ton · $pct%', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text('\$${c['rate']}/ton', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.accent)),
        ]),
        const SizedBox(height: 8),

        // Meta
        Wrap(spacing: 6, runSpacing: 4, children: [
          _metaChip(c['type']),
          _metaChip('Exp: ${c['expires']}'),
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

  void _showNewContract() {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.5),
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 20),
          Text('Nuevo Contrato', style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
          const SizedBox(height: 4),
          Text('Esta funcionalidad se conectará con el módulo web', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(height: 24),
          ...[
            _infoRow('Tipos disponibles', 'COA Anual, Semestral, Trimestral, Spot'),
            _infoRow('Campos requeridos', 'Cliente, ruta, producto, volumen, tarifa'),
            _infoRow('Integración', 'Sync con admin-contratos-fluvia.html'),
          ],
          const Spacer(),
          GestureDetector(
            onTap: () => Navigator.pop(ctx),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
              child: Center(child: Text('Cerrar', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.backgroundPrimary))),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(CupertinoIcons.checkmark_circle_fill, size: 16, color: AppColors.success),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text(value, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        ])),
      ]),
    );
  }
}
