import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import '../theme/app_colors.dart';
import '../main.dart';

class TripulacionScreen extends StatefulWidget {
  const TripulacionScreen({super.key});

  @override
  State<TripulacionScreen> createState() => _TripulacionScreenState();
}

class _TripulacionScreenState extends State<TripulacionScreen> {
  List<Map<String, dynamic>> _crew = [];
  String _filter = 'all';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadCrew();
  }

  Future<void> _loadCrew() async {
    setState(() => _loading = true);
    try {
      final data = await SupabaseService.getCrewMembers();
      setState(() {
        if (data.isNotEmpty) {
          _crew = data
              .map((c) => {
                    'id': c['id'],
                    'name': c['full_name'] ?? c['name'] ?? 'Sin nombre',
                    'role': c['role'] ?? c['position'] ?? '-',
                    'vessel': c['vessel_name'] ?? c['vessel'] ?? '-',
                    'status': c['status'] ?? 'active',
                    'phone': c['phone'] ?? '',
                    'document': c['document'] ?? c['dni'] ?? '',
                  })
              .toList();
        } else {
          _crew = [];
        }
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_filter == 'all') return _crew;
    return _crew.where((c) => c['status'] == _filter).toList();
  }

  // ─── ADD / EDIT CREW MEMBER ─────────────────────────────────────────
  void _showCrewForm({Map<String, dynamic>? existing}) {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final roleCtrl = TextEditingController(text: existing?['role'] ?? '');
    final phoneCtrl = TextEditingController(text: existing?['phone'] ?? '');
    final docCtrl = TextEditingController(text: existing?['document'] ?? '');
    String status = existing?['status'] ?? 'active';

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
            children: [
              // Handle bar
              Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              Text(
                existing != null ? 'Editar Tripulante' : 'Nuevo Tripulante',
                style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary),
              ),
              Text(
                'GESTIÓN DE PERSONAL',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5),
              ),
              const SizedBox(height: 24),
              _formField('Nombre completo', nameCtrl, CupertinoIcons.person),
              const SizedBox(height: 12),
              _formField('Cargo / Rol', roleCtrl, CupertinoIcons.briefcase),
              const SizedBox(height: 12),
              _formField('Teléfono', phoneCtrl, CupertinoIcons.phone, keyboard: TextInputType.phone),
              const SizedBox(height: 12),
              _formField('Documento', docCtrl, CupertinoIcons.doc_text),
              const SizedBox(height: 20),
              // Status selector
              Text('Estado', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _statusOption('active', 'Embarcado', status, (v) => setModalState(() => status = v)),
                  const SizedBox(width: 8),
                  _statusOption('leave', 'Franco', status, (v) => setModalState(() => status = v)),
                  const SizedBox(width: 8),
                  _statusOption('inactive', 'Inactivo', status, (v) => setModalState(() => status = v)),
                ],
              ),
              const SizedBox(height: 28),
              // Save button
              GestureDetector(
                onTap: () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  try {
                    await SupabaseService.upsertCrewMember({
                      if (existing?['id'] != null) 'id': existing!['id'],
                      'full_name': nameCtrl.text.trim(),
                      'role': roleCtrl.text.trim(),
                      'phone': phoneCtrl.text.trim(),
                      'document': docCtrl.text.trim(),
                      'status': status,
                    });
                    _loadCrew();
                  } catch (e) {
                    debugPrint('Error saving crew: $e');
                  }
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.textPrimary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      existing != null ? 'Guardar Cambios' : 'Agregar Tripulante',
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.backgroundPrimary),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }

  // ─── DELETE CREW MEMBER ────────────────────────────────────────────
  void _confirmDelete(Map<String, dynamic> c) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text('Eliminar tripulante', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        message: Text('¿Eliminar a ${c['name']}? Esta acción no se puede deshacer.', style: GoogleFonts.inter()),
        actions: [
          CupertinoActionSheetAction(
            isDestructiveAction: true,
            child: Text('Eliminar', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                if (c['id'] != null) {
                  await SupabaseService.deleteCrewMember(c['id'].toString());
                }
                _loadCrew();
              } catch (e) {
                debugPrint('Error deleting crew: \$e');
              }
            },
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: Text('Cancelar', style: GoogleFonts.inter()),
          onPressed: () => Navigator.pop(ctx),
        ),
      ),
    );
  }

  Widget _formField(String placeholder, TextEditingController ctrl, IconData icon, {TextInputType keyboard = TextInputType.text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.separator, width: 0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: CupertinoTextField(
              controller: ctrl,
              placeholder: placeholder,
              placeholderStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textTertiary),
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
              keyboardType: keyboard,
              decoration: const BoxDecoration(),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusOption(String value, String label, String current, ValueChanged<String> onTap) {
    final selected = current == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.textPrimary : AppColors.backgroundPrimary,
            border: Border.all(color: selected ? AppColors.textPrimary : AppColors.separator, width: 0.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.backgroundPrimary : AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }



  // ─── BUILD ──────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final active = _crew.where((c) => c['status'] == 'active').length;
    final onLeave = _crew.where((c) => c['status'] == 'leave').length;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary),
                onPressed: () => Navigator.pop(context),
              )
            : CupertinoButton(
                padding: EdgeInsets.zero,
                child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary),
                onPressed: () => rootScaffoldKey.currentState?.openDrawer(),
              ),
        middle: Text('Tripulación', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () => _showCrewForm(),
          child: Icon(CupertinoIcons.person_add, size: 22, color: AppColors.textPrimary),
        ),
      ),
      backgroundColor: AppColors.backgroundPrimary,
      child: SafeArea(
        child: _loading
            ? const Center(child: CupertinoActivityIndicator())
            : ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  // ── KPI Row ────────────────────────────────────
                  Row(
                    children: [
                      _kpi('Embarcados', '$active'),
                      const SizedBox(width: 10),
                      _kpi('De Franco', '$onLeave'),
                      const SizedBox(width: 10),
                      _kpi('Total', '${_crew.length}'),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // ── Filter Chips ───────────────────────────────
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _chip('Todos', 'all'),
                        _chip('Embarcados', 'active'),
                        _chip('Franco', 'leave'),
                        _chip('Inactivos', 'inactive'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── Section Header ─────────────────────────────
                  Row(
                    children: [
                      Text(
                        'PERSONAL',
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5),
                      ),
                      const Spacer(),
                      Text(
                        '${_filtered.length} registros',
                        style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // ── Crew List ──────────────────────────────────
                  if (_filtered.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(CupertinoIcons.person_2, size: 40, color: AppColors.textTertiary),
                          const SizedBox(height: 12),
                          Text('Sin tripulantes', style: GoogleFonts.newsreader(fontSize: 18, color: AppColors.textSecondary)),
                          const SizedBox(height: 4),
                          Text('Agregá un miembro para comenzar', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary)),
                        ],
                      ),
                    )
                  else
                    ..._filtered.map((c) => _crewCard(c)),
                ],
              ),
      ),
    );
  }

  // ─── KPI CARD (Fluvia editorial style) ────────────────────────────
  Widget _kpi(String label, String val) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(
          children: [
            Text(
              val,
              style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 2),
            Text(
              label.toUpperCase(),
              style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 1),
            ),
          ],
        ),
      ),
    );
  }

  // ─── FILTER CHIP (Fluvia monochrome) ──────────────────────────────
  Widget _chip(String label, String value) {
    final sel = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _filter = value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: sel ? AppColors.textPrimary : AppColors.backgroundPrimary,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? AppColors.textPrimary : AppColors.separator, width: 0.5),
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: sel ? AppColors.backgroundPrimary : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  // ─── CREW CARD (Fluvia editorial style + swipe actions) ───────────
  Widget _crewCard(Map<String, dynamic> c) {
    String statusText;
    switch (c['status']) {
      case 'active':
        statusText = 'EMBARCADO';
        break;
      case 'leave':
        statusText = 'FRANCO';
        break;
      default:
        statusText = 'INACTIVO';
    }

    final initials = c['name'].toString().split(' ').map((w) => w.isNotEmpty ? w[0] : '').take(2).join().toUpperCase();

    return GestureDetector(
      onTap: () => _showCrewForm(existing: c),
      onLongPress: () => _confirmDelete(c),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Row(
          children: [
            // Avatar with initials
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.textPrimary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  initials,
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
              ),
            ),
            const SizedBox(width: 14),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    c['name'],
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${c['role']} · ${c['vessel']}',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            // Status badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.textPrimary.withValues(alpha: c['status'] == 'active' ? 0.08 : 0.04),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Text(
                statusText,
                style: GoogleFonts.inter(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: c['status'] == 'active' ? AppColors.textPrimary : AppColors.textTertiary,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
