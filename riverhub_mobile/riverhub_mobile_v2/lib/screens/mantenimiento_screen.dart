import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';

class MantenimientoScreen extends StatefulWidget {
  const MantenimientoScreen({super.key});

  @override
  State<MantenimientoScreen> createState() => _MantenimientoScreenState();
}

class _MantenimientoScreenState extends State<MantenimientoScreen> {
  List<Map<String, dynamic>> _tasks = [];
  List<Map<String, dynamic>> _vesselsData = [];

  String _viewMode = 'list';

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    final data = await SupabaseService.getMaintenanceTasks();
    final v = await SupabaseService.getVessels();
    if (mounted) {
      setState(() {
        if (data.isNotEmpty) {
          _tasks = data
              .map(
                (t) => {
                  'title': t['title'] ?? t['description'] ?? 'Sin título',
                  'vessel': t['vessel']?['name'] ?? t['vessel_name'] ?? '-',
                  'priority': t['priority'] ?? 'medium',
                  'status': t['status'] ?? 'pendiente',
                  'dueDate': t['scheduled_date'] ?? t['due_date'] ?? '-',
                },
              )
              .toList();
        } else {
          _tasks = [];
        }
        _vesselsData = v;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = _tasks.where((t) => t['status'] == 'pendiente').toList();
    final inProgress = _tasks
        .where((t) => t['status'] == 'en_progreso')
        .toList();
    final completed = _tasks.where((t) => t['status'] == 'completado').toList();

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Mantenimiento',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF0A0E1A).withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: Color(0xFF00E5FF)),
          onPressed: () => Navigator.pop(context),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CupertinoButton(
              padding: EdgeInsets.zero,
              child: Icon(
                _viewMode == 'list'
                    ? CupertinoIcons.square_grid_2x2
                    : CupertinoIcons.list_bullet,
                color: const Color(0xFF00E5FF),
                size: 20,
              ),
              onPressed: () => setState(
                () => _viewMode = _viewMode == 'list' ? 'board' : 'list',
              ),
            ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: _showCreateModal,
              child: Row(
                mainAxisSize: material.MainAxisSize.min,
                children: const [
                  Text('Nuevo ', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 13, fontWeight: FontWeight.bold)),
                  Icon(CupertinoIcons.add_circled, color: Color(0xFF00E5FF), size: 20),
                ],
              ),
            ),
          ],
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: _viewMode == 'list'
            ? ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // KPIs
                  Row(
                    children: [
                      _kpi(
                        'Pendientes',
                        '${pending.length}',
                        const Color(0xFFF59E0B),
                      ),
                      const SizedBox(width: 10),
                      _kpi(
                        'En Progreso',
                        '${inProgress.length}',
                        const Color(0xFF3B82F6),
                      ),
                      const SizedBox(width: 10),
                      _kpi(
                        'Completados',
                        '${completed.length}',
                        const Color(0xFF10B981),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ..._tasks.map((t) => _taskCard(t)),
                ],
              )
            : _boardView(pending, inProgress, completed),
      ),
    );
  }

  Widget _boardView(
    List<Map<String, dynamic>> pending,
    List<Map<String, dynamic>> inProgress,
    List<Map<String, dynamic>> completed,
  ) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _boardColumn('PENDIENTE', pending, const Color(0xFFF59E0B)),
          const SizedBox(width: 12),
          _boardColumn('EN PROGRESO', inProgress, const Color(0xFF3B82F6)),
          const SizedBox(width: 12),
          _boardColumn('COMPLETADO', completed, const Color(0xFF10B981)),
        ],
      ),
    );
  }

  Widget _boardColumn(
    String title,
    List<Map<String, dynamic>> tasks,
    Color color,
  ) {
    return Container(
      width: 260,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Text(
                  '${tasks.length}',
                  style: TextStyle(color: color, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          ...tasks.map(
            (t) => Padding(
              padding: const EdgeInsets.all(8),
              child: _taskCard(t, compact: true),
            ),
          ),
          if (tasks.isEmpty)
            const Padding(
              padding: EdgeInsets.all(20),
              child: Center(
                child: Text(
                  'Sin tareas',
                  style: TextStyle(color: Color(0xFF475569), fontSize: 12),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showCreateModal() {
    final titleController = TextEditingController();
    String? selectedVesselId;

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        height: 350,
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
                const Text(
                  'Nueva Orden de Trabajo',
                  style: TextStyle(
                    color: material.Colors.white,
                    fontSize: 18,
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
            CupertinoTextField(
              controller: titleController,
              placeholder: 'Título de la tarea',
              style: const TextStyle(color: material.Colors.white),
              placeholderStyle: const TextStyle(color: Color(0xFF64748B)),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.all(12),
            ),
            const SizedBox(height: 12),
            StatefulBuilder(
              builder: (ctx, setModalState) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: material.DropdownButton<String>(
                  value: selectedVesselId,
                  hint: const Text(
                    'Seleccione buque asignado...',
                    style: TextStyle(color: Color(0xFF64748B)),
                  ),
                  dropdownColor: const Color(0xFF1E293B),
                  isExpanded: true,
                  underline: const SizedBox(),
                  style: const TextStyle(color: material.Colors.white),
                  items: _vesselsData
                      .map(
                        (v) => material.DropdownMenuItem(
                          value: v['id'] as String,
                          child: Text(v['name'] ?? '-'),
                        ),
                      )
                      .toList(),
                  onChanged: (val) =>
                      setModalState(() => selectedVesselId = val),
                 ),
              )
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: CupertinoButton.filled(
                child: const Text('Crear Orden'),
                onPressed: () async {
                  final title = titleController.text;
                  if (title.isEmpty || selectedVesselId == null) return;

                  final payload = {
                    'description': title,
                    'vessel_id': selectedVesselId,
                    'status': 'pendiente',
                    'priority': 'medium',
                    'scheduled_date': DateTime.now().add(const Duration(days: 7)).toIso8601String().split('T')[0],
                  };

                  await SupabaseService.insertMaintenanceTask(payload);
                  
                  if (context.mounted) Navigator.pop(ctx);
                  _loadTasks();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String value, Color color) {
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
                fontSize: 24,
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

  Widget _taskCard(Map<String, dynamic> t, {bool compact = false}) {
    Color prioColor;
    switch (t['priority']) {
      case 'critical':
        prioColor = const Color(0xFFEF4444);
        break;
      case 'high':
        prioColor = const Color(0xFFF59E0B);
        break;
      case 'medium':
        prioColor = const Color(0xFF3B82F6);
        break;
      default:
        prioColor = const Color(0xFF10B981);
    }

    return Container(
      margin: compact ? EdgeInsets.zero : const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: compact ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(10),
        border: Border(left: BorderSide(color: prioColor, width: 3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t['title'],
            style: const TextStyle(
              color: material.Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(
                CupertinoIcons.helm,
                color: Color(0xFF64748B),
                size: 13,
              ),
              const SizedBox(width: 4),
              Text(
                t['vessel'],
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const Spacer(),
              Text(
                t['dueDate'],
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
