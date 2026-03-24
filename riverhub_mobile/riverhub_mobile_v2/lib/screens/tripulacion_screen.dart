import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';

class TripulacionScreen extends StatefulWidget {
  const TripulacionScreen({super.key});

  @override
  State<TripulacionScreen> createState() => _TripulacionScreenState();
}

class _TripulacionScreenState extends State<TripulacionScreen> {
  List<Map<String, dynamic>> _crew = [];

  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _loadCrew();
  }

  Future<void> _loadCrew() async {
    final data = await SupabaseService.getCrewMembers();
    setState(() {
      if (data.isNotEmpty) {
        _crew = data
            .map(
              (c) => {
                'name': c['full_name'] ?? c['name'] ?? 'Sin nombre',
                'role': c['role'] ?? c['position'] ?? '-',
                'vessel': c['vessel_name'] ?? c['vessel'] ?? '-',
                'status': c['status'] ?? 'active',
              },
            )
            .toList();
      } else {
        _crew = [];
      }
    });
  }

  List<Map<String, dynamic>> get _filtered {
    if (_filter == 'all') return _crew;
    return _crew.where((c) => c['status'] == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final active = _crew.where((c) => c['status'] == 'active').length;
    final onLeave = _crew.where((c) => c['status'] == 'leave').length;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Tripulación',
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
          onPressed: () {},
          child: Row(
            mainAxisSize: material.MainAxisSize.min,
            children: const [
              Text('Nuevo ', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 13, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.person_add, color: Color(0xFF00E5FF), size: 22),
            ],
          ),
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                _kpi('Embarcados', '$active', const Color(0xFF10B981)),
                const SizedBox(width: 10),
                _kpi('De Franco', '$onLeave', const Color(0xFFF59E0B)),
                const SizedBox(width: 10),
                _kpi('Total', '${_crew.length}', const Color(0xFF3B82F6)),
              ],
            ),
            const SizedBox(height: 14),
            // Filters
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _chip('Todos', 'all'),
                  _chip('Activos', 'active'),
                  _chip('Franco', 'leave'),
                  _chip('Inactivos', 'inactive'),
                ],
              ),
            ),
            const SizedBox(height: 14),
            ..._filtered.map((c) => _crewCard(c)),
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
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, String value) {
    final sel = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _filter = value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: sel ? const Color(0xFF00E5FF) : const Color(0xFF1E293B),
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

  Widget _crewCard(Map<String, dynamic> c) {
    Color statusColor;
    String statusText;
    switch (c['status']) {
      case 'active':
        statusColor = const Color(0xFF10B981);
        statusText = 'EMBARCADO';
        break;
      case 'leave':
        statusColor = const Color(0xFFF59E0B);
        statusText = 'FRANCO';
        break;
      default:
        statusColor = const Color(0xFF64748B);
        statusText = 'INACTIVO';
    }

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
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                c['name'].toString().substring(0, 1),
                style: const TextStyle(
                  color: Color(0xFF00E5FF),
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  c['name'],
                  style: const TextStyle(
                    color: material.Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      c['role'],
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 12,
                      ),
                    ),
                    const Text(
                      ' • ',
                      style: TextStyle(color: Color(0xFF475569)),
                    ),
                    Text(
                      c['vessel'],
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              statusText,
              style: TextStyle(
                color: statusColor,
                fontSize: 9,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
