import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show DropdownButton, DropdownMenuItem, DropdownButtonHideUnderline, MainAxisSize;
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

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
  void initState() { super.initState(); _loadTasks(); }

  Future<void> _loadTasks() async {
    final data = await SupabaseService.getMaintenanceTasks();
    final v = await SupabaseService.getVessels();
    if (mounted) {
      setState(() {
        if (data.isNotEmpty) {
          _tasks = data.map((t) => {
            'title': t['title'] ?? t['description'] ?? 'Sin título',
            'vessel': t['vessel']?['name'] ?? t['vessel_name'] ?? '-',
            'priority': t['priority'] ?? 'medium',
            'status': t['status'] ?? 'pendiente',
            'dueDate': t['scheduled_date'] ?? t['due_date'] ?? '-',
          }).toList();
        } else { _tasks = []; }
        _vesselsData = v;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = _tasks.where((t) => t['status'] == 'pendiente').toList();
    final inProgress = _tasks.where((t) => t['status'] == 'en_progreso').toList();
    final completed = _tasks.where((t) => t['status'] == 'completado').toList();

    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context)),
        middle: Text('Mantenimiento', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          CupertinoButton(
            padding: EdgeInsets.zero,
            child: Icon(_viewMode == 'list' ? CupertinoIcons.square_grid_2x2 : CupertinoIcons.list_bullet, color: AppColors.textSecondary, size: 20),
            onPressed: () => setState(() => _viewMode = _viewMode == 'list' ? 'board' : 'list'),
          ),
          CupertinoButton(
            padding: EdgeInsets.zero, onPressed: _showCreateModal,
            child: Icon(CupertinoIcons.plus, color: AppColors.textPrimary, size: 22),
          ),
        ]),
      ),
      child: SafeArea(
        child: _viewMode == 'list'
            ? ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text('Órdenes de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('Mantenimiento.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 24),

                  Row(children: [
                    _kpi('${pending.length}', 'Pendientes'),
                    const SizedBox(width: 10),
                    _kpi('${inProgress.length}', 'En Progreso'),
                    const SizedBox(width: 10),
                    _kpi('${completed.length}', 'Completados'),
                  ]),
                  const SizedBox(height: 20),
                  ..._tasks.map((t) => _taskCard(t)),
                  if (_tasks.isEmpty)
                    Padding(padding: const EdgeInsets.all(20), child: Center(child: Text('Sin tareas', style: GoogleFonts.inter(color: AppColors.textSecondary)))),
                ],
              )
            : _boardView(pending, inProgress, completed),
      ),
    );
  }

  Widget _boardView(List<Map<String, dynamic>> pending, List<Map<String, dynamic>> inProgress, List<Map<String, dynamic>> completed) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(20),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _boardColumn('PENDIENTE', pending),
        const SizedBox(width: 12),
        _boardColumn('EN PROGRESO', inProgress),
        const SizedBox(width: 12),
        _boardColumn('COMPLETADO', completed),
      ]),
    );
  }

  Widget _boardColumn(String title, List<Map<String, dynamic>> tasks) {
    return Container(
      width: 260,
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLow,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
          ),
          child: Row(children: [
            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.textPrimary, shape: BoxShape.circle)),
            const SizedBox(width: 8),
            Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 11, color: AppColors.textPrimary, letterSpacing: 1)),
            const Spacer(),
            Text('${tasks.length}', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.textSecondary)),
          ]),
        ),
        ...tasks.map((t) => Padding(padding: const EdgeInsets.all(8), child: _taskCard(t, compact: true))),
        if (tasks.isEmpty)
          Padding(padding: const EdgeInsets.all(20), child: Center(child: Text('Sin tareas', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)))),
      ]),
    );
  }

  void _showCreateModal() {
    final titleController = TextEditingController();
    String? selectedVesselId;

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        height: 360, padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 18),
          Text('Nueva Orden', style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
          const SizedBox(height: 18),
          CupertinoTextField(
            controller: titleController, placeholder: 'Título de la tarea',
            style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
            placeholderStyle: GoogleFonts.inter(color: AppColors.textSecondary),
            decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.separator, width: 0.5)),
            padding: const EdgeInsets.all(14),
          ),
          const SizedBox(height: 12),
          StatefulBuilder(builder: (ctx, setModalState) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.separator, width: 0.5)),
            child: DropdownButtonHideUnderline(child: DropdownButton<String>(
              value: selectedVesselId, isExpanded: true,
              hint: Text('Seleccione buque...', style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 14)),
              dropdownColor: AppColors.backgroundSecondary,
              style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
              items: _vesselsData.map((v) => DropdownMenuItem(value: v['id'] as String, child: Text(v['name'] ?? '-'))).toList(),
              onChanged: (val) => setModalState(() => selectedVesselId = val),
            )),
          )),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, child: CupertinoButton(
            color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12),
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text('CREAR ORDEN', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textOnAccent)),
            onPressed: () async {
              if (titleController.text.isEmpty || selectedVesselId == null) return;
              final payload = {
                'description': titleController.text, 'vessel_id': selectedVesselId,
                'status': 'pendiente', 'priority': 'medium',
                'scheduled_date': DateTime.now().add(const Duration(days: 7)).toIso8601String().split('T')[0],
              };
              await SupabaseService.insertMaintenanceTask(payload);
              if (context.mounted) Navigator.pop(ctx);
              _loadTasks();
            },
          )),
        ]),
      ),
    );
  }

  Widget _kpi(String val, String label) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(children: [
        Text(val, style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
      ]),
    ),
  );

  Widget _taskCard(Map<String, dynamic> t, {bool compact = false}) {
    return Container(
      margin: compact ? EdgeInsets.zero : const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: compact ? AppColors.surfaceContainerLow : AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(t['title'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
        const SizedBox(height: 6),
        Row(children: [
          Icon(CupertinoIcons.helm, color: AppColors.textSecondary, size: 13),
          const SizedBox(width: 4),
          Text(t['vessel'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
          const Spacer(),
          Text(t['dueDate'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        ]),
      ]),
    );
  }
}
