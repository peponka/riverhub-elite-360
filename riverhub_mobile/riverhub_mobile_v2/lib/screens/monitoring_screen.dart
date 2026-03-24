import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';

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
                    'name': g['name'] ?? 'Sin nombre',
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
        middle: const Text(
          'Torre de Control',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF0A0E1A).withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: Color(0xFF00E5FF)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Status summary
            Row(
              children: [
                _statusCard(
                  'Alertas',
                  '${_alerts.length}',
                  CupertinoIcons.exclamationmark_triangle_fill,
                  const Color(0xFFEF4444),
                ),
                const SizedBox(width: 10),
                _statusCard(
                  'Geofences',
                  '${_geofences.where((g) => g['status'] == 'active').length}',
                  CupertinoIcons.map_pin_ellipse,
                  const Color(0xFF10B981),
                ),
                const SizedBox(width: 10),
                _statusCard(
                  'Polling',
                  '30s',
                  CupertinoIcons.antenna_radiowaves_left_right,
                  const Color(0xFF3B82F6),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Alerts
            const Text(
              'Alertas Activas',
              style: TextStyle(
                color: material.Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ..._alerts.map((a) => _alertCard(a)),
            const SizedBox(height: 20),
            // Geofences
            const Text(
              'Zonas Geofence',
              style: TextStyle(
                color: material.Colors.white,
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
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Verificador UKC Rápido',
                    style: TextStyle(
                      color: Color(0xFF00E5FF),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _infoRow('Calado convoy', '3.2 m')),
                      const SizedBox(width: 10),
                      Expanded(child: _infoRow('Prof. ubicación', '3.5 m')),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.exclamationmark_triangle_fill,
                          color: Color(0xFFF59E0B),
                          size: 18,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'PELIGRO: BAJO UKC (0.3m)',
                          style: TextStyle(
                            color: Color(0xFFF59E0B),
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
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
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
        sevColor = const Color(0xFFEF4444);
        icon = CupertinoIcons.exclamationmark_triangle_fill;
        break;
      case 'warning':
        sevColor = const Color(0xFFF59E0B);
        icon = CupertinoIcons.exclamationmark_circle_fill;
        break;
      default:
        sevColor = const Color(0xFF3B82F6);
        icon = CupertinoIcons.info_circle_fill;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
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
                    color: material.Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Text(
                  a['loc'],
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            a['time'],
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
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
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: active ? const Color(0xFF10B981) : const Color(0xFF64748B),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              g['name'],
              style: const TextStyle(
                color: material.Colors.white,
                fontSize: 13,
              ),
            ),
          ),
          Text(
            'Min: ${g['minDepth']}m',
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: material.Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
