import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class FleetManagerScreen extends StatefulWidget {
  const FleetManagerScreen({super.key});

  @override
  State<FleetManagerScreen> createState() => _FleetManagerScreenState();
}

class _FleetManagerScreenState extends State<FleetManagerScreen> {
  List<Map<String, dynamic>> vessels = [];

  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _loadVessels();
  }

  Future<void> _loadVessels() async {
    final data = await SupabaseService.getVessels();
    if (!mounted) return;
    setState(() {
      if (data.isNotEmpty) {
        vessels = data
            .map(
              (v) => {
                'name': v['name'] ?? 'Sin nombre',
                'type': v['type'] ?? 'DESCONOCIDO',
                'status': v['status'] ?? 'active',
                'zone': v['current_location'] ?? v['zone'] ?? '-',
                'fuel': v['fuel_level'] ?? 0,
              },
            )
            .toList();
      } else {
        vessels = [];
      }
    });
  }

  List<Map<String, dynamic>> get _filteredVessels {
    if (_filter == 'all') return vessels;
    return vessels.where((v) => v['status'] == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final active = vessels.where((v) => v['status'] == 'active').length;
    final maintenance = vessels
        .where((v) => v['status'] == 'maintenance')
        .length;
    final transit = vessels.where((v) => v['status'] == 'transito').length;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Gestión de Flota',
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
            // KPI Cards
            Row(
              children: [
                _kpiCard('Operativos', '$active', AppColors.success),
                const SizedBox(width: 10),
                _kpiCard('En Taller', '$maintenance', AppColors.error),
                const SizedBox(width: 10),
                _kpiCard('En Ruta', '$transit', AppColors.blue),
              ],
            ),
            const SizedBox(height: 16),
            // Filter chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _filterChip('Todos', 'all'),
                  _filterChip('Activos', 'active'),
                  _filterChip('Taller', 'maintenance'),
                  _filterChip('En Ruta', 'transito'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Vessel cards
            ..._filteredVessels.map((v) => _vesselCard(v)),
          ],
        ),
      ),
    );
  }

  Widget _kpiCard(String label, String value, Color color) {
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
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 26,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: AppColors.textTertiary, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String label, String value) {
    final sel = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _filter = value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: sel ? AppColors.accent : AppColors.separator,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: sel ? material.Colors.black : material.Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _vesselCard(Map<String, dynamic> v) {
    Color statusColor;
    String statusText;
    switch (v['status']) {
      case 'active':
        statusColor = AppColors.success;
        statusText = 'OPERATIVO';
        break;
      case 'maintenance':
        statusColor = AppColors.error;
        statusText = 'TALLER';
        break;
      default:
        statusColor = AppColors.blue;
        statusText = 'EN RUTA';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      CupertinoIcons.helm,
                      color: statusColor,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        v['name'],
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        v['type'],
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: statusColor),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    CupertinoIcons.location_solid,
                    color: AppColors.textTertiary,
                    size: 14,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    v['zone'],
                    style: const TextStyle(
                      color: AppColors.textTertiary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  const Icon(
                    CupertinoIcons.drop_fill,
                    color: AppColors.warning,
                    size: 14,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${v['fuel']}%',
                    style: const TextStyle(
                      color: AppColors.warning,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
