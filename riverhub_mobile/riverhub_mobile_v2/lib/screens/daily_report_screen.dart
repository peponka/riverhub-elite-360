import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class DailyReportScreen extends StatefulWidget {
  const DailyReportScreen({super.key});

  @override
  State<DailyReportScreen> createState() => _DailyReportScreenState();
}

class _DailyReportScreenState extends State<DailyReportScreen> {
  bool _isLoading = true;
  int _activeVessels = 0;
  int _criticalAlerts = 0;
  List<Map<String, dynamic>> _movements = [];

  @override
  void initState() { super.initState(); _loadReportData(); }

  Future<void> _loadReportData() async {
    try {
      final vessels = await SupabaseService.getVessels();
      final alerts = await SupabaseService.getAlerts();
      final orders = await SupabaseService.getServiceOrders();
      if (mounted) {
        setState(() {
          _activeVessels = vessels.where((v) => v['status'] == 'active').length;
          _criticalAlerts = alerts.where((a) => a['severity'] == 'critical' || a['severity'] == 'high').length;
          if (orders.isNotEmpty) {
            _movements = orders.take(5).map((o) => {
              'vessel': o['vessel_name'] ?? o['order_number'] ?? 'Desconocido',
              'status': o['status'] ?? 'En Curso',
              'cargo': '-',
              'dest': o['destination_port'] ?? 'En ruta',
            }).toList().cast<Map<String, dynamic>>();
          } else { _movements = []; }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error loading report: \$e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';

    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context)),
        middle: Text('Briefing Diario', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text('Briefing', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('Ejecutivo.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 8),
                  Text(dateStr, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                  const SizedBox(height: 24),

                  // KPIs - editorial monochrome
                  Text('RESUMEN DE OPERACIONES', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  Row(children: [
                    _metricCard('$_activeVessels', 'Activos'),
                    const SizedBox(width: 10),
                    _metricCard('$_criticalAlerts', 'Alertas'),
                    const SizedBox(width: 10),
                    _metricCard('98%', 'Eficiencia'),
                  ]),
                  const SizedBox(height: 28),

                  // Movements
                  Text('MOVIMIENTOS RECIENTES', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  ..._movements.map((m) => _movementRow(m)),
                  if (_movements.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Center(child: Text('Sin movimientos registrados', style: GoogleFonts.inter(color: AppColors.textSecondary))),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _metricCard(String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(children: [
          Text(value, style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
        ]),
      ),
    );
  }

  Widget _movementRow(Map<String, dynamic> m) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Container(width: 5, height: 5, decoration: const BoxDecoration(color: AppColors.textPrimary, shape: BoxShape.circle)),
        const SizedBox(width: 10),
        Expanded(child: Text(m['vessel'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary))),
        Text(m['status'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
        const SizedBox(width: 10),
        Text(m['dest'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
      ]),
    );
  }
}
