import '../services/locale_service.dart';
import 'package:flutter/cupertino.dart';
import '../services/supabase_service.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class MonitoringScreen extends StatefulWidget {
  const MonitoringScreen({super.key});

  @override
  State<MonitoringScreen> createState() => _MonitoringScreenState();
}

class _MonitoringScreenState extends State<MonitoringScreen> {
  List<Map<String, dynamic>> _alerts = [];
  List<Map<String, dynamic>> _geofences = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final alertsData = await SupabaseService.getAlerts();
    final geoData = await SupabaseService.getGeofences();
    if (!mounted) return;
    setState(() {
      _alerts = alertsData.isNotEmpty
          ? alertsData
                .map(
                  (a) => {
                    'type': a['type'] ?? 'ALERT',
                    'vessel': a['vessel_name'] ?? '-',
                    'loc': a['location'] ?? '-',
                    'draft': a['draft'] ?? 0,
                    'depth': a['depth'] ?? 0,
                    'time': a['created_at']?.toString().substring(11, 16) ?? '-',
                    'severity': a['severity'] ?? 'info',
                  },
                )
                .toList()
          : [];

      _geofences = geoData.isNotEmpty
          ? geoData
                .map(
                  (g) => {
                    'name': g['name'] ?? LocaleService.t('dyn_key_113'),
                    'minDepth': g['min_depth'] ?? 0,
                    'status': g['status'] ?? 'active',
                  },
                )
                .toList()
          : [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(
          LocaleService.t('dyn_key_175'),
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
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Status summary
            Row(
              children: [
                _statusCard(
                  LocaleService.t('dyn_key_92'),
                  '${_alerts.length}',
                  CupertinoIcons.exclamationmark_triangle_fill,
                  AppColors.error,
                ),
                const SizedBox(width: 10),
                _statusCard(
                  'Geofences',
                  '${_geofences.where((g) => g['status'] == 'active').length}',
                  CupertinoIcons.map_pin_ellipse,
                  AppColors.success,
                ),
                const SizedBox(width: 10),
                _statusCard(
                  'Polling',
                  '30s',
                  CupertinoIcons.antenna_radiowaves_left_right,
                  AppColors.blue,
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Alerts
            Text(
              LocaleService.t('dyn_key_174'),
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ..._alerts.map((a) => _alertCard(a)),
            const SizedBox(height: 20),
            // Geofences
            Text(
              LocaleService.t('dyn_key_177'),
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ..._geofences.map((g) => _geofenceCard(g)),
            const SizedBox(height: 20),
            // UKC Calculator
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.separator),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    LocaleService.t('dyn_key_179'),
                    style: TextStyle(
                      color: AppColors.accent,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _infoRow(LocaleService.t('dyn_key_176'), '3.2 m')),
                      const SizedBox(width: 10),
                      Expanded(child: _infoRow(LocaleService.t('dyn_key_178'), '3.5 m')),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.exclamationmark_triangle_fill,
                          color: AppColors.warning,
                          size: 18,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'PELIGRO: BAJO UKC (0.3m)',
                          style: TextStyle(
                            color: AppColors.warning,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
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

  Widget _statusCard(String label, String value, IconData icon, Color color) {
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
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label,
              style: const TextStyle(color: AppColors.textTertiary, fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }

  Widget _alertCard(Map<String, dynamic> a) {
    Color sevColor;
    IconData icon;
    switch (a['severity']) {
      case 'critical':
        sevColor = AppColors.error;
        icon = CupertinoIcons.exclamationmark_triangle_fill;
        break;
      case 'warning':
        sevColor = AppColors.warning;
        icon = CupertinoIcons.exclamationmark_circle_fill;
        break;
      default:
        sevColor = AppColors.blue;
        icon = CupertinoIcons.info_circle_fill;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: sevColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: sevColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: sevColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  a['type'],
                  style: TextStyle(
                    color: sevColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                Text(
                  a['vessel'],
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Text(
                  a['loc'],
                  style: const TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            a['time'],
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
          ),
        ],
      ),
    );
  }

  Widget _geofenceCard(Map<String, dynamic> g) {
    final active = g['status'] == 'active';
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
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: active ? AppColors.success : AppColors.textSecondary,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              g['name'],
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
              ),
            ),
          ),
          Text(
            'Min: ${g['minDepth']}m',
            style: const TextStyle(color: AppColors.textTertiary, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.separator,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
