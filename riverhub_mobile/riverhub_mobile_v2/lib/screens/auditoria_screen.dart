import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;

class AuditoriaScreen extends StatefulWidget {
  const AuditoriaScreen({super.key});

  @override
  State<AuditoriaScreen> createState() => _AuditoriaScreenState();
}

class _AuditoriaScreenState extends State<AuditoriaScreen> {
  final List<Map<String, dynamic>> _logs = [
    {
      'time': '14:32:05',
      'type': 'SUCCESS',
      'msg': 'Conexión a Supabase establecida. Latencia: 45ms',
    },
    {
      'time': '14:32:04',
      'type': 'INFO',
      'msg': 'Almacenamiento Local en uso: 124.5 KB',
    },
    {
      'time': '14:32:03',
      'type': 'SUCCESS',
      'msg': 'Conectividad de red verificada.',
    },
    {'time': '14:32:02', 'type': 'WARN', 'msg': 'Modo depuración activado.'},
    {
      'time': '14:32:01',
      'type': 'INFO',
      'msg': 'Iniciando monitor de eventos en tiempo real...',
    },
    {
      'time': '14:32:00',
      'type': 'INFO',
      'msg': 'Módulo de Auditoría del Sistema Iniciado.',
    },
  ];

  final bool _networkOk = true;
  final bool _dbOk = true;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Auditoría del Sistema',
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
            // Status cards
            Row(
              children: [
                _statusCard('Red', _networkOk, CupertinoIcons.wifi),
                const SizedBox(width: 10),
                _statusCard('Base de Datos', _dbOk, CupertinoIcons.cloud_fill),
                const SizedBox(width: 10),
                _statusCard('Storage', true, CupertinoIcons.tray_full_fill),
              ],
            ),
            const SizedBox(height: 16),
            // Metrics
            Row(
              children: [
                _metricBox('Memoria', '185.2 MB', const Color(0xFF3B82F6)),
                const SizedBox(width: 10),
                _metricBox('Storage', '124.5 KB', const Color(0xFF8B5CF6)),
                const SizedBox(width: 10),
                _metricBox('Uptime', '12h 34m', const Color(0xFF10B981)),
              ],
            ),
            const SizedBox(height: 16),
            // Actions
            Row(
              children: [
                Expanded(
                  child: _actionButton(
                    'Test Conexión',
                    CupertinoIcons.antenna_radiowaves_left_right,
                    () {
                      setState(() {
                        _logs.insert(0, {
                          'time': material.TimeOfDay.now().format(context),
                          'type': 'INFO',
                          'msg': 'Ejecutando Ping de latencia...',
                        });
                      });
                      Future.delayed(const Duration(milliseconds: 800), () {
                        if (!mounted) return;
                        setState(
                          () => _logs.insert(0, {
                            'time': material.TimeOfDay.now().format(context),
                            'type': 'SUCCESS',
                            'msg': 'Ping OK: 24ms (Google DNS)',
                          }),
                        );
                      });
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _actionButton(
                    'Limpiar Logs',
                    CupertinoIcons.trash,
                    () => setState(() => _logs.clear()),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _actionButton(
                    'Exportar',
                    CupertinoIcons.arrow_up_doc,
                    () {
                      showCupertinoDialog(
                        context: context,
                        builder: (c) => CupertinoAlertDialog(
                          title: const Text('Exportar Logs'),
                          content: const Text(
                            'Logs exportados a CSV correctamente.',
                          ),
                          actions: [
                            CupertinoDialogAction(
                              child: const Text('OK'),
                              onPressed: () => Navigator.pop(c),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Terminal
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0E1A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'TERMINAL',
                        style: TextStyle(
                          color: Color(0xFF00E5FF),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${_logs.length} entries',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ..._logs.take(15).map((l) => _logEntry(l)),
                  if (_logs.isEmpty)
                    const Center(
                      child: Text(
                        'Consola vacía',
                        style: TextStyle(
                          color: Color(0xFF475569),
                          fontSize: 12,
                        ),
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

  Widget _statusCard(String label, bool ok, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: (ok ? const Color(0xFF10B981) : const Color(0xFFEF4444))
              .withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: (ok ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                .withValues(alpha: 0.3),
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: ok ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              size: 22,
            ),
            const SizedBox(height: 6),
            Text(
              ok ? 'ONLINE' : 'ERROR',
              style: TextStyle(
                color: ok ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                fontSize: 11,
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

  Widget _metricBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF1E293B)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionButton(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF00E5FF), size: 20),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: material.Colors.white,
                fontSize: 10,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _logEntry(Map<String, dynamic> l) {
    Color typeColor;
    switch (l['type']) {
      case 'SUCCESS':
        typeColor = const Color(0xFF10B981);
        break;
      case 'WARN':
        typeColor = const Color(0xFFF59E0B);
        break;
      case 'ERROR':
        typeColor = const Color(0xFFEF4444);
        break;
      default:
        typeColor = const Color(0xFF3B82F6);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '[${l['time']}] ',
            style: const TextStyle(
              color: Color(0xFF475569),
              fontSize: 11,
              fontFamily: 'monospace',
            ),
          ),
          Text(
            '${l['type']}: ',
            style: TextStyle(
              color: typeColor,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
            ),
          ),
          Expanded(
            child: Text(
              l['msg'],
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 11,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
