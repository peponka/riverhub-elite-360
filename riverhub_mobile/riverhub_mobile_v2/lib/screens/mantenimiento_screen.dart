import 'package:flutter/cupertino.dart';
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
    final descController = TextEditingController();
    Map<String, dynamic>? selectedVessel;
    String priority = 'medium';

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.backgroundPrimary,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
            ),
            child: ListView(
              shrinkWrap: true,
              children: [
                Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 18),
                Text('Nueva Orden', style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                Text('MANTENIMIENTO', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                const SizedBox(height: 20),

                // Title
                _modalField('Título de la tarea', titleController, CupertinoIcons.wrench),
                const SizedBox(height: 12),

                // Description
                _modalField('Descripción (opcional)', descController, CupertinoIcons.doc_text),
                const SizedBox(height: 16),

                // Vessel selector (tap to open)
                Text('EMBARCACIÓN', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                const SizedBox(height: 6),
                GestureDetector(
                  onTap: () {
                    if (_vesselsData.isEmpty) return;
                    showCupertinoModalPopup(
                      context: ctx,
                      builder: (innerCtx) => Container(
                        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.4),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundPrimary,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
                              child: Row(children: [
                                Text('Embarcación', style: GoogleFonts.newsreader(fontSize: 20, color: AppColors.textPrimary)),
                                const Spacer(),
                                GestureDetector(onTap: () => Navigator.pop(innerCtx), child: Icon(CupertinoIcons.xmark_circle_fill, color: AppColors.textTertiary, size: 24)),
                              ]),
                            ),
                            Flexible(child: ListView.builder(
                              shrinkWrap: true, padding: const EdgeInsets.symmetric(vertical: 8),
                              itemCount: _vesselsData.length,
                              itemBuilder: (_, i) {
                                final v = _vesselsData[i];
                                return GestureDetector(
                                  onTap: () { Navigator.pop(innerCtx); setModalState(() => selectedVessel = v); },
                                  child: Container(
                                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: AppColors.backgroundSecondary,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.separator, width: 0.5),
                                    ),
                                    child: Row(children: [
                                      Icon(CupertinoIcons.helm, size: 18, color: AppColors.textPrimary),
                                      const SizedBox(width: 12),
                                      Text(v['name'] ?? '-', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                                    ]),
                                  ),
                                );
                              },
                            )),
                          ],
                        ),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundSecondary,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.separator, width: 0.5),
                    ),
                    child: Row(children: [
                      Icon(CupertinoIcons.helm, size: 18, color: selectedVessel != null ? AppColors.textPrimary : AppColors.textTertiary),
                      const SizedBox(width: 12),
                      Expanded(child: Text(
                        selectedVessel?['name'] ?? 'Seleccionar embarcación...',
                        style: GoogleFonts.inter(fontSize: 14, color: selectedVessel != null ? AppColors.textPrimary : AppColors.textTertiary, fontWeight: selectedVessel != null ? FontWeight.w600 : FontWeight.w400),
                      )),
                      Icon(CupertinoIcons.chevron_down, size: 16, color: AppColors.textSecondary),
                    ]),
                  ),
                ),
                const SizedBox(height: 16),

                // Priority
                Text('PRIORIDAD', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                const SizedBox(height: 8),
                Row(children: [
                  _priorityOption('low', 'Baja', priority, (v) => setModalState(() => priority = v)),
                  const SizedBox(width: 8),
                  _priorityOption('medium', 'Media', priority, (v) => setModalState(() => priority = v)),
                  const SizedBox(width: 8),
                  _priorityOption('high', 'Alta', priority, (v) => setModalState(() => priority = v)),
                ]),
                const SizedBox(height: 24),

                // Submit
                GestureDetector(
                  onTap: () async {
                    if (titleController.text.isEmpty || selectedVessel == null) return;
                    final payload = {
                      'description': titleController.text,
                      'vessel_id': selectedVessel!['id'],
                      'status': 'pendiente',
                      'priority': priority,
                      'scheduled_date': DateTime.now().add(const Duration(days: 7)).toIso8601String().split('T')[0],
                    };
                    await SupabaseService.insertMaintenanceTask(payload);
                    if (ctx.mounted) Navigator.pop(ctx);
                    _loadTasks();
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                    child: Center(child: Text('CREAR ORDEN', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.backgroundPrimary, letterSpacing: 0.5))),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _modalField(String placeholder, TextEditingController ctrl, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(border: Border.all(color: AppColors.separator, width: 0.5), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Icon(icon, size: 18, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(child: CupertinoTextField(
          controller: ctrl, placeholder: placeholder,
          placeholderStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textTertiary),
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
          decoration: const BoxDecoration(), padding: const EdgeInsets.symmetric(vertical: 12),
        )),
      ]),
    );
  }

  Widget _priorityOption(String value, String label, String current, ValueChanged<String> onTap) {
    final selected = current == value;
    return Expanded(child: GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.textPrimary : AppColors.backgroundPrimary,
          border: Border.all(color: selected ? AppColors.textPrimary : AppColors.separator, width: 0.5),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? AppColors.backgroundPrimary : AppColors.textSecondary))),
      ),
    ));
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
