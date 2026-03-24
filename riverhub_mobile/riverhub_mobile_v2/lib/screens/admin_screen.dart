import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;

class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Panel Admin',
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
            // KPIs
            Row(
              children: [
                _kpi(
                  'Clientes',
                  '12',
                  CupertinoIcons.building_2_fill,
                  const Color(0xFF3B82F6),
                ),
                const SizedBox(width: 10),
                _kpi(
                  'Usuarios',
                  '48',
                  CupertinoIcons.person_2_fill,
                  const Color(0xFF8B5CF6),
                ),
                const SizedBox(width: 10),
                _kpi(
                  'Flota Total',
                  '32',
                  CupertinoIcons.helm,
                  const Color(0xFF10B981),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Menu items
            const Text(
              'Administración',
              style: TextStyle(
                color: material.Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _menuItem(
              'Gestión de Clientes',
              CupertinoIcons.building_2_fill,
              const Color(0xFF3B82F6),
              '12 empresas registradas',
            ),
            _menuItem(
              'Usuarios del Sistema',
              CupertinoIcons.person_2_fill,
              const Color(0xFF8B5CF6),
              '48 usuarios activos',
            ),
            _menuItem(
              'Flota Global',
              CupertinoIcons.helm,
              const Color(0xFF10B981),
              '32 embarcaciones',
            ),
            _menuItem(
              'Tenants (Multi-org)',
              CupertinoIcons.square_stack_3d_up_fill,
              const Color(0xFFF59E0B),
              '3 organizaciones',
            ),
            _menuItem(
              'Órdenes de Servicio',
              CupertinoIcons.doc_text_fill,
              const Color(0xFF00E5FF),
              '156 este mes',
            ),
            _menuItem(
              'Facturación Global',
              CupertinoIcons.creditcard_fill,
              const Color(0xFFEF4444),
              '\$45,200 facturado',
            ),
            _menuItem(
              'Logs de Auditoría',
              CupertinoIcons.shield_fill,
              const Color(0xFF64748B),
              '2,340 eventos',
            ),
            const SizedBox(height: 20),
            // System info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Sistema',
                    style: TextStyle(
                      color: Color(0xFF00E5FF),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 10),
                  _InfoRow(label: 'Versión', value: 'v3.2.1 (Elite 360)'),
                  _InfoRow(
                    label: 'Base de Datos',
                    value: 'Supabase (PostgreSQL 15)',
                  ),
                  _InfoRow(label: 'Hosting', value: 'Supabase Edge'),
                  _InfoRow(label: 'Último Deploy', value: '09/03/2026 12:00'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String val, IconData icon, Color color) {
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
              val,
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

  Widget _menuItem(String title, IconData icon, Color color, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: material.Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            CupertinoIcons.chevron_right,
            color: Color(0xFF475569),
            size: 16,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
          ),
          Text(
            value,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
          ),
        ],
      ),
    );
  }
}
