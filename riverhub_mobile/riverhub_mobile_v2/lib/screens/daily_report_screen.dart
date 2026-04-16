import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
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
  void initState() {
    super.initState();
    _loadReportData();
  }

  Future<void> _loadReportData() async {
    try {
      // 1. Activos en Misión (vessels with status 'active')
      final vessels = await SupabaseService.getVessels();
      // 2. Alertas Críticas (system_alerts with severity 'critical' or 'high')
      final alerts = await SupabaseService.getAlerts();
      // 3. Movimientos (last service orders or voyages)
      final orders = await SupabaseService.getServiceOrders();

      if (mounted) {
        setState(() {
          _activeVessels = vessels.where((v) => v['status'] == 'active').length;
          _criticalAlerts = alerts
              .where((a) =>
                  a['severity'] == 'critical' || a['severity'] == 'high')
              .length;

          if (orders.isNotEmpty) {
            _movements = orders.take(5).map((o) => {
              'vessel': o['vessel_name'] ?? o['order_number'] ?? 'Desconocido',
              'status': o['status'] ?? 'En Curso',
              'cargo': '-', // Not always available directly here
              'dest': o['destination_port'] ?? 'En ruta',
              'color': AppColors.success
            }).toList().cast<Map<String, dynamic>>();
          } else {
             _movements = [];
          }

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
    final dateStr = '\${now.day}/\${now.month}/\${now.year}';
    final reportId = '#\${(1000 + now.millisecond * 9).toString().substring(0, 4)}';

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Briefing Diario',
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
        child: _isLoading 
        ? const Center(child: CupertinoActivityIndicator())
        : ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.separator, AppColors.backgroundSecondary],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.separatorLight),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'RiverHub',
                        style: TextStyle(
                          color: AppColors.accent,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'EXECUTIVE DAILY BRIEFING',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'FECHA: \$dateStr',
                        style: const TextStyle(
                          color: AppColors.textTertiary,
                          fontSize: 11,
                        ),
                      ),
                      Text(
                        'ID: \$reportId',
                        style: const TextStyle(
                          color: AppColors.textTertiary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Resumen de Operaciones',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _metricCard('\$_activeVessels', 'Activos (Misión)', AppColors.success),
                const SizedBox(width: 10),
                _metricCard('\$_criticalAlerts', 'Alertas Críticas', AppColors.error),
                const SizedBox(width: 10),
                _metricCard('98%', 'Eficiencia Flota', AppColors.blue),
              ],
            ),
            const SizedBox(height: 20),
            const Text(
              'Movimientos Recientes',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ..._movements.map((m) => _movementRow(
                  m['vessel'],
                  m['status'],
                  m['cargo'],
                  m['dest'],
                  m['color'],
            )),
          ],
        ),
      ),
    );
  }

  Widget _metricCard(String value, String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: AppColors.textTertiary, fontSize: 10), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _movementRow(String vessel, String status, String cargo, String dest, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.separator),
      ),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 10),
          Expanded(child: Text(vessel, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13))),
          Expanded(child: Text(status, style: TextStyle(color: color, fontSize: 12))),
          Expanded(child: Text(cargo, style: const TextStyle(color: AppColors.textTertiary, fontSize: 12))),
          Text(dest, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
        ],
      ),
    );
  }
}
