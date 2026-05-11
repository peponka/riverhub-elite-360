import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

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
          _crew = data.map((c) => {
            'id': c['id'],
            'name': c['full_name'] ?? c['name'] ?? LocaleService.t('common_no_name'),
            'role': c['role'] ?? c['position'] ?? '-',
            'vessel': c['vessel_name'] ?? c['vessel'] ?? '-',
            'status': c['status'] ?? 'active',
            'phone': c['phone'] ?? '',
            'document': c['document'] ?? c['dni'] ?? '',
          }).toList();
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
              Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              Text(
                existing != null ? LocaleService.t('crew_edit') : LocaleService.t('crew_add'),
                style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary),
              ),
              Text(
                LocaleService.t('crew_management'),
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5),
              ),
              const SizedBox(height: 24),
              _formField(LocaleService.t('crew_name'), nameCtrl, CupertinoIcons.person),
              const SizedBox(height: 12),
              _formField(LocaleService.t('crew_role'), roleCtrl, CupertinoIcons.briefcase),
              const SizedBox(height: 12),
              _formField(LocaleService.t('crew_phone'), phoneCtrl, CupertinoIcons.phone, keyboard: TextInputType.phone),
              const SizedBox(height: 12),
              _formField(LocaleService.t('crew_doc'), docCtrl, CupertinoIcons.doc_text),
              const SizedBox(height: 20),
              Text(LocaleService.t('crew_status'), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _statusOption('active', LocaleService.t('crew_status_onboard'), status, (v) => setModalState(() => status = v)),
                  const SizedBox(width: 8),
                  _statusOption('leave', LocaleService.t('crew_status_leave'), status, (v) => setModalState(() => status = v)),
                  const SizedBox(width: 8),
                  _statusOption('inactive', LocaleService.t('crew_status_inactive'), status, (v) => setModalState(() => status = v)),
                ],
              ),
              const SizedBox(height: 28),
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
                  decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                  child: Center(
                    child: Text(
                      existing != null ? LocaleService.t('crew_save_changes') : LocaleService.t('crew_add_member'),
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

  void _confirmDelete(Map<String, dynamic> c) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(LocaleService.t('crew_delete_title'), style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        message: Text('${LocaleService.t('crew_delete_msg_part1')}${c['name']}${LocaleService.t('crew_delete_msg_part2')}', style: GoogleFonts.inter()),
        actions: [
          CupertinoActionSheetAction(
            isDestructiveAction: true,
            child: Text(LocaleService.t('crew_delete_action'), style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                if (c['id'] != null) {
                  await SupabaseService.deleteCrewMember(c['id'].toString());
                }
                _loadCrew();
              } catch (e) {
                debugPrint('Error deleting crew: $e');
              }
            },
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          child: Text(LocaleService.t('common_cancel'), style: GoogleFonts.inter()),
          onPressed: () => Navigator.pop(ctx),
        ),
      ),
    );
  }

  Widget _formField(String placeholder, TextEditingController ctrl, IconData icon, {TextInputType keyboard = TextInputType.text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(border: Border.all(color: AppColors.separator, width: 0.5), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: CupertinoTextField(
              controller: ctrl, placeholder: placeholder,
              placeholderStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textTertiary),
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
              keyboardType: keyboard, decoration: const BoxDecoration(),
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
            child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? AppColors.backgroundPrimary : AppColors.textSecondary)),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final active = _crew.where((c) => c['status'] == 'active').length;
    final onLeave = _crew.where((c) => c['status'] == 'leave').length;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text(LocaleService.t('crew_title'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: () => _showCrewForm(), child: Icon(CupertinoIcons.person_add, size: 22, color: AppColors.textPrimary)),
      ),
      backgroundColor: AppColors.backgroundPrimary,
      child: SafeArea(
        child: _loading
            ? const Center(child: CupertinoActivityIndicator())
            : ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Row(
                    children: [
                      _kpi(LocaleService.t('crew_kpi_onboard'), '$active', color: AppColors.success),
                      const SizedBox(width: 10),
                      _kpi(LocaleService.t('crew_kpi_leave'), '$onLeave', color: AppColors.orange),
                      const SizedBox(width: 10),
                      _kpi(LocaleService.t('crew_kpi_total'), '${_crew.length}'),
                    ],
                  ),
                  const SizedBox(height: 20),

                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _chip(LocaleService.t('crew_all'), 'all'),
                        _chip(LocaleService.t('crew_filter_onboard'), 'active'),
                        _chip(LocaleService.t('crew_filter_leave'), 'leave'),
                        _chip(LocaleService.t('crew_filter_inactive'), 'inactive'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  Row(
                    children: [
                      Text(LocaleService.t('crew_personnel'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                      const Spacer(),
                      Text('${_filtered.length} ${LocaleService.t('crew_records')}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (_filtered.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(CupertinoIcons.person_2, size: 40, color: AppColors.textTertiary),
                          const SizedBox(height: 12),
                          Text(LocaleService.t('crew_empty'), style: GoogleFonts.newsreader(fontSize: 18, color: AppColors.textSecondary)),
                          const SizedBox(height: 4),
                          Text(LocaleService.t('crew_add_hint'), style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary)),
                        ],
                      ),
                    )
                  else
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 0.82,
                      children: _filtered.map((c) => _crewCard(c)).toList(),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _kpi(String label, String val, {Color? color}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.separator, width: 0.5)),
        child: Column(
          children: [
            Text(val, style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: color ?? AppColors.textPrimary)),
            const SizedBox(height: 2),
            Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 1)),
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
            color: sel ? AppColors.textPrimary : AppColors.backgroundPrimary,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? AppColors.textPrimary : AppColors.separator, width: 0.5),
          ),
          child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: sel ? AppColors.backgroundPrimary : AppColors.textSecondary)),
        ),
      ),
    );
  }

  Widget _crewCard(Map<String, dynamic> c) {
    String statusText;
    Color statusColor;
    switch (c['status']) {
      case 'active':
        statusText = LocaleService.t('crew_active_label');
        statusColor = AppColors.success;
        break;
      case 'leave':
        statusText = LocaleService.t('crew_leave_label');
        statusColor = AppColors.orange;
        break;
      default:
        statusText = LocaleService.t('crew_inactive_label');
        statusColor = AppColors.error;
    }

    final initials = c['name'].toString().split(' ').map((w) => w.isNotEmpty ? w[0] : '').take(2).join().toUpperCase();
    final hasPhone = c['phone'] != null && c['phone'].toString().isNotEmpty;
    final hasVessel = c['vessel'] != null && c['vessel'] != '-' && c['vessel'].toString().isNotEmpty;

    return GestureDetector(
      onTap: () => _showCrewForm(existing: c),
      onLongPress: () => _confirmDelete(c),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(
          children: [
            // Top accent bar
            Container(
              height: 4,
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(14), topRight: Radius.circular(14)),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    // Avatar
                    Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                        border: Border.all(color: statusColor.withValues(alpha: 0.3), width: 1.5),
                      ),
                      child: Center(child: Text(initials, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: statusColor))),
                    ),
                    const SizedBox(height: 8),
                    // Name
                    Text(c['name'], style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    // Role
                    Text(c['role'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary), textAlign: TextAlign.center, overflow: TextOverflow.ellipsis),
                    const Spacer(),
                    // Vessel chip
                    if (hasVessel) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(6)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(CupertinoIcons.helm, size: 10, color: AppColors.accent),
                          const SizedBox(width: 4),
                          Flexible(child: Text(c['vessel'], style: GoogleFonts.inter(fontSize: 9, color: AppColors.accent, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
                        ]),
                      ),
                      const SizedBox(height: 6),
                    ],
                    // Phone chip
                    if (hasPhone) ...[
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(CupertinoIcons.phone, size: 10, color: AppColors.textTertiary),
                        const SizedBox(width: 4),
                        Flexible(child: Text(c['phone'], style: GoogleFonts.inter(fontSize: 9, color: AppColors.textTertiary), overflow: TextOverflow.ellipsis)),
                      ]),
                      const SizedBox(height: 6),
                    ],
                    // Status badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: statusColor.withValues(alpha: 0.25), width: 0.5),
                      ),
                      child: Text(statusText, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: statusColor, letterSpacing: 0.5)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
