import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;

class IntegracionesScreen extends StatelessWidget {
  const IntegracionesScreen({super.key});

  final List<Map<String, dynamic>> _apis = const [
    {
      'name': 'MarineTraffic',
      'desc': 'AIS & Tracking Global',
      'status': 'online',
      'latency': '45ms',
    },
    {
      'name': 'Open-Meteo',
      'desc': 'Clima & Hidrología',
      'status': 'online',
      'latency': '120ms',
    },
    {
      'name': 'Datalastic',
      'desc': 'Ship Database',
      'status': 'offline',
      'latency': '-',
    },
    {
      'name': 'WhatsApp API',
      'desc': 'Notificaciones',
      'status': 'online',
      'latency': '80ms',
    },
    {
      'name': 'Supabase',
      'desc': 'Base de Datos',
      'status': 'online',
      'latency': '35ms',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Integraciones API',
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
            Row(
              children: [
                _kpi('APIs Activas', '4', const Color(0xFF10B981)),
                const SizedBox(width: 10),
                _kpi('Offline', '1', const Color(0xFFEF4444)),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Servicios Conectados',
              style: TextStyle(
                color: material.Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ..._apis.map((a) => _apiCard(a)),
            const SizedBox(height: 20),
            const Text(
              'Mi API Key',
              style: TextStyle(
                color: material.Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'sk_live_••••••••••••••••',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 13,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      const Icon(
                        CupertinoIcons.eye_fill,
                        color: Color(0xFF64748B),
                        size: 18,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButton(
                      color: const Color(0xFF1E293B),
                      child: const Text(
                        'Generar Nueva Key',
                        style: TextStyle(
                          color: Color(0xFF00E5FF),
                          fontSize: 13,
                        ),
                      ),
                      onPressed: () {},
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

  Widget _kpi(String l, String v, Color c) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(
            v,
            style: TextStyle(
              color: c,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            l,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
          ),
        ],
      ),
    ),
  );

  Widget _apiCard(Map<String, dynamic> a) {
    final online = a['status'] == 'online';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: online ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  a['name'],
                  style: const TextStyle(
                    color: material.Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Text(
                  a['desc'],
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                online ? 'ONLINE' : 'OFFLINE',
                style: TextStyle(
                  color: online
                      ? const Color(0xFF10B981)
                      : const Color(0xFFEF4444),
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                a['latency'],
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
