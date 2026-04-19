import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class TrackingScreen extends StatelessWidget {
  const TrackingScreen({super.key});

  final List<Map<String, dynamic>> _shipments = const [
    {'vessel': 'TUG-ALPHA', 'product': 'Soja', 'qty': '2,000 TN', 'origin': 'Asunción', 'dest': 'Rosario', 'status': 'En Tránsito', 'eta': '18:00', 'progress': 0.65},
    {'vessel': 'BARGE-04', 'product': 'Vacío', 'qty': '-', 'origin': 'Rosario', 'dest': 'Asunción', 'status': 'En Puerto', 'eta': '-', 'progress': 0.0},
    {'vessel': 'BARGE-12', 'product': 'Mineral', 'qty': '1,500 TN', 'origin': 'Corumbá', 'dest': 'San Lorenzo', 'status': 'Cargando', 'eta': '12/03', 'progress': 0.3},
    {'vessel': 'TUG-BETA', 'product': 'Clinker', 'qty': '800 TN', 'origin': 'Corrientes', 'dest': 'Bs Aires', 'status': 'En Tránsito', 'eta': '20:30', 'progress': 0.82},
  ];

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context)),
        middle: Text('Tracking', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Tracking de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Cargas.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 24),

            // KPIs - editorial
            Row(children: [
              _kpi('En Tránsito', '2'),
              const SizedBox(width: 10),
              _kpi('En Puerto', '1'),
              const SizedBox(width: 10),
              _kpi('Cargando', '1'),
            ]),
            const SizedBox(height: 20),
            ..._shipments.map((s) => _shipmentCard(context, s)),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String val) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(children: [
          Text(val, style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
        ]),
      ),
    );
  }

  Widget _shipmentCard(BuildContext context, Map<String, dynamic> s) {
    return GestureDetector(
      onTap: () => _showDetail(context, s),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Row(children: [
              Icon(CupertinoIcons.helm, color: AppColors.textSecondary, size: 18),
              const SizedBox(width: 10),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(s['vessel'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
                Text('${s['product']} • ${s['qty']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
              ]),
            ]),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(6)),
              child: Text(s['status'], style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            ),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            Icon(CupertinoIcons.location, color: AppColors.textSecondary, size: 13),
            const SizedBox(width: 4),
            Text(s['origin'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
            Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Icon(CupertinoIcons.arrow_right, color: AppColors.separator, size: 12)),
            Text(s['dest'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
            const Spacer(),
            Text('ETA: ${s['eta']}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          ]),
          const SizedBox(height: 10),
          // Progress bar - monochrome
          Container(
            height: 4, width: double.infinity,
            decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(2)),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft, widthFactor: s['progress'] as double,
              child: Container(decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(2))),
            ),
          ),
        ]),
      ),
    );
  }

  void _showDetail(BuildContext context, Map<String, dynamic> s) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        height: 320, padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 18),
          Text(s['vessel'], style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          _detailRow('Producto', s['product']),
          _detailRow('Cantidad', s['qty']),
          _detailRow('Origen', s['origin']),
          _detailRow('Destino', s['dest']),
          _detailRow('Estado', s['status']),
          _detailRow('ETA', s['eta']),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, child: CupertinoButton(
            color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12),
            child: Text('Descargar Manifiesto PDF', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textOnAccent)),
            onPressed: () => Navigator.pop(ctx),
          )),
        ]),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
        Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ]),
    );
  }
}
