import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final List<Map<String, dynamic>> _notifs = [
    {
      'title': 'Alerta Hidrológica',
      'msg': 'Nivel del río en baja en Puerto Rosario (-0.5m en 24hs).',
      'type': 'warning',
      'time': 'Hace 10 min',
      'read': false,
    },
    {
      'title': 'Mantenimiento Vencido',
      'msg': 'Motor Auxiliar #2 (R/M HERCULES) requiere service inmediato.',
      'type': 'critical',
      'time': 'Hace 2 horas',
      'read': false,
    },
    {
      'title': 'Carga Completada',
      'msg': 'B/M TITAN finalizó operación de carga de Soja (1,500 TN).',
      'type': 'success',
      'time': 'Hace 4 horas',
      'read': true,
    },
    {
      'title': 'Nuevo Tripulante',
      'msg': 'Juan Acosta fue asignado a TQ ENERGY.',
      'type': 'info',
      'time': 'Hace 6 horas',
      'read': true,
    },
    {
      'title': 'Geofence Alert',
      'msg': 'B/G SOJA KING ingresó a zona restringida Km 1285.',
      'type': 'critical',
      'time': 'Ayer',
      'read': true,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final unread = _notifs.where((n) => !(n['read'] as bool)).length;
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Notificaciones',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF0A0E1A).withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: Color(0xFF00E5FF)),
          onPressed: () => Navigator.pop(context),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Text(
            'Limpiar',
            style: TextStyle(color: Color(0xFF00E5FF), fontSize: 13),
          ),
          onPressed: () => setState(() => _notifs.clear()),
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: _notifs.isEmpty
            ? const Center(
                child: Text(
                  'No hay notificaciones',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 16),
                ),
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (unread > 0)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        '$unread sin leer',
                        style: const TextStyle(
                          color: Color(0xFF00E5FF),
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ..._notifs.map((n) => _notifCard(n)),
                ],
              ),
      ),
    );
  }

  Widget _notifCard(Map<String, dynamic> n) {
    Color typeColor;
    IconData icon;
    switch (n['type']) {
      case 'critical':
        typeColor = const Color(0xFFEF4444);
        icon = CupertinoIcons.exclamationmark_triangle_fill;
        break;
      case 'warning':
        typeColor = const Color(0xFFF59E0B);
        icon = CupertinoIcons.exclamationmark_circle_fill;
        break;
      case 'success':
        typeColor = const Color(0xFF10B981);
        icon = CupertinoIcons.checkmark_circle_fill;
        break;
      default:
        typeColor = const Color(0xFF3B82F6);
        icon = CupertinoIcons.info_circle_fill;
    }
    final unread = !(n['read'] as bool);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: unread
            ? typeColor.withValues(alpha: 0.05)
            : const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: unread
              ? typeColor.withValues(alpha: 0.3)
              : const Color(0xFF1E293B),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: typeColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: typeColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      n['title'],
                      style: TextStyle(
                        color: material.Colors.white,
                        fontWeight: unread
                            ? FontWeight.bold
                            : FontWeight.normal,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      n['time'],
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  n['msg'],
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
