import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;

class TrackingScreen extends StatelessWidget {
  const TrackingScreen({super.key});

  final List<Map<String, dynamic>> _shipments = const [
    {
      'vessel': 'TUG-ALPHA',
      'product': 'Soja',
      'qty': '2,000 TN',
      'origin': 'Asunción',
      'dest': 'Rosario',
      'status': 'En Tránsito',
      'eta': '18:00',
      'progress': 0.65,
    },
    {
      'vessel': 'BARGE-04',
      'product': 'Vacío',
      'qty': '-',
      'origin': 'Rosario',
      'dest': 'Asunción',
      'status': 'En Puerto',
      'eta': '-',
      'progress': 0.0,
    },
    {
      'vessel': 'BARGE-12',
      'product': 'Mineral',
      'qty': '1,500 TN',
      'origin': 'Corumbá',
      'dest': 'San Lorenzo',
      'status': 'Cargando',
      'eta': '12/03',
      'progress': 0.3,
    },
    {
      'vessel': 'TUG-BETA',
      'product': 'Clinker',
      'qty': '800 TN',
      'origin': 'Corrientes',
      'dest': 'Bs Aires',
      'status': 'En Tránsito',
      'eta': '20:30',
      'progress': 0.82,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Tracking de Cargas',
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
            // Summary
            Row(
              children: [
                _kpi('En Tránsito', '2', const Color(0xFF3B82F6)),
                const SizedBox(width: 10),
                _kpi('En Puerto', '1', const Color(0xFFF59E0B)),
                const SizedBox(width: 10),
                _kpi('Cargando', '1', const Color(0xFF10B981)),
              ],
            ),
            const SizedBox(height: 16),
            ..._shipments.map((s) => _shipmentCard(context, s)),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String val, Color color) {
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
              val,
              style: TextStyle(
                color: color,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }

  Widget _shipmentCard(BuildContext context, Map<String, dynamic> s) {
    Color statusColor;
    switch (s['status']) {
      case 'En Tránsito':
        statusColor = const Color(0xFF3B82F6);
        break;
      case 'En Puerto':
        statusColor = const Color(0xFFF59E0B);
        break;
      default:
        statusColor = const Color(0xFF10B981);
    }

    return GestureDetector(
      onTap: () => _showDetail(context, s),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF1E293B)),
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
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s['vessel'],
                          style: const TextStyle(
                            color: material.Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          '${s['product']} • ${s['qty']}',
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 12,
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
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    s['status'],
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
            // Route
            Row(
              children: [
                const Icon(
                  CupertinoIcons.location_solid,
                  color: Color(0xFF10B981),
                  size: 14,
                ),
                const SizedBox(width: 4),
                Text(
                  s['origin'],
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 12,
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(
                    CupertinoIcons.arrow_right,
                    color: Color(0xFF475569),
                    size: 14,
                  ),
                ),
                const Icon(
                  CupertinoIcons.location_solid,
                  color: Color(0xFFEF4444),
                  size: 14,
                ),
                const SizedBox(width: 4),
                Text(
                  s['dest'],
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Text(
                  'ETA: ${s['eta']}',
                  style: const TextStyle(
                    color: Color(0xFF00E5FF),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                height: 6,
                child: material.LinearProgressIndicator(
                  value: s['progress'] as double,
                  backgroundColor: const Color(0xFF1E293B),
                  valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetail(BuildContext context, Map<String, dynamic> s) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        height: 320,
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFF0F172A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  s['vessel'],
                  style: const TextStyle(
                    color: material.Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  child: const Icon(
                    CupertinoIcons.xmark_circle_fill,
                    color: Color(0xFF64748B),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _detailRow('Producto', s['product']),
            _detailRow('Cantidad', s['qty']),
            _detailRow('Origen', s['origin']),
            _detailRow('Destino', s['dest']),
            _detailRow('Estado', s['status']),
            _detailRow('ETA', s['eta']),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: CupertinoButton.filled(
                child: const Text('Descargar Manifiesto PDF'),
                onPressed: () {
                  Navigator.pop(ctx);
                  showCupertinoDialog(
                    context: context,
                    builder: (c) => CupertinoAlertDialog(
                      title: const Text('PDF Generado'),
                      content: Text(
                        'Manifiesto de ${s['vessel']} listo para descarga.',
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
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
          ),
          Text(
            value,
            style: const TextStyle(
              color: material.Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
