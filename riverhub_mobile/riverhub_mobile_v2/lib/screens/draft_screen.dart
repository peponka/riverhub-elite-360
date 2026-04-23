import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class DraftScreen extends StatefulWidget {
  const DraftScreen({super.key});

  @override
  State<DraftScreen> createState() => _DraftScreenState();
}

class _DraftScreenState extends State<DraftScreen> {
  List<Map<String, dynamic>> _vessels = [];
  List<Map<String, dynamic>> _draftHistory = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      // Fetch vessels from CORRECT table
      final vesselResponse = await Supabase.instance.client.from('vessels')
          .select('id, name, status').order('name');
      _vessels = List<Map<String, dynamic>>.from(vesselResponse);

      // Fetch draft readings from logs
      final logsResponse = await Supabase.instance.client.from('logs')
          .select('*')
          .eq('action_type', 'DRAFT_READING')
          .order('created_at', ascending: false)
          .limit(50);
      _draftHistory = List<Map<String, dynamic>>.from(logsResponse);

      // Assign current draft to vessels from most recent reading
      for (var vessel in _vessels) {
        final vName = vessel['name'] ?? '';
        final recentLog = _draftHistory.cast<Map<String, dynamic>?>().firstWhere(
          (l) => l != null && (l['vessel_name'] == vName),
          orElse: () => null,
        );
        if (recentLog != null) {
          try {
            final details = recentLog['details'];
            if (details is String) {
              final parsed = Uri.splitQueryString(details.replaceAll('{', '').replaceAll('}', '').replaceAll('"', ''));
              vessel['current_draft'] = double.tryParse(parsed['draft'] ?? '0') ?? 0.0;
              vessel['max_draft'] = double.tryParse(parsed['max_draft'] ?? '3.5') ?? 3.5;
            } else if (details is Map) {
              vessel['current_draft'] = (details['draft'] ?? 0.0).toDouble();
              vessel['max_draft'] = (details['max_draft'] ?? 3.5).toDouble();
            }
          } catch (_) {}
        }
        vessel['current_draft'] ??= 0.0;
        vessel['max_draft'] ??= 3.5;
      }
    } catch (e) {
      debugPrint('Draft fetch error: $e');
    }

    // Fallback if no vessels
    if (_vessels.isEmpty) {
      _vessels = [
        {'id': 'demo-1', 'name': 'TB PARAGUAY 01', 'max_draft': 3.5, 'current_draft': 2.45},
        {'id': 'demo-2', 'name': 'R/M HERCULES', 'max_draft': 4.0, 'current_draft': 3.80},
      ];
    }

    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _addDraftReading() async {
    int selectedIndex = 0;
    final draftCtrl = TextEditingController();
    final maxDraftCtrl = TextEditingController(text: '3.50');
    final notesCtrl = TextEditingController();

    await showCupertinoModalPopup(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Container(
          height: MediaQuery.of(ctx).size.height * 0.65,
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          decoration: BoxDecoration(
            color: AppColors.backgroundSecondary,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Column(children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 40, height: 4,
              decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                CupertinoButton(padding: EdgeInsets.zero, child: Text('Cancelar', style: GoogleFonts.inter(color: AppColors.textSecondary)), onPressed: () => Navigator.pop(ctx)),
                Text('Registrar Calado', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16, color: AppColors.textPrimary)),
                CupertinoButton(padding: EdgeInsets.zero, child: Text('Guardar', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.accent)), onPressed: () async {
                  if (draftCtrl.text.isNotEmpty) {
                    try {
                      final vessel = _vessels[selectedIndex];
                      final draftVal = double.tryParse(draftCtrl.text) ?? 0.0;
                      final maxVal = double.tryParse(maxDraftCtrl.text) ?? 3.5;
                      final companyId = Supabase.instance.client.auth.currentUser?.userMetadata?['company_id'];

                      await Supabase.instance.client.from('logs').insert({
                        'title': 'Lectura de calado: ${vessel['name']}',
                        'vessel_name': vessel['name'],
                        'action_type': 'DRAFT_READING',
                        'description': notesCtrl.text.isEmpty
                            ? 'Calado: ${draftVal.toStringAsFixed(2)}m / Max: ${maxVal.toStringAsFixed(2)}m'
                            : notesCtrl.text,
                        'details': '{"draft": $draftVal, "max_draft": $maxVal}',
                        'company_id': ?companyId,
                      });
                    } catch (e) {
                      debugPrint('Draft save error: $e');
                    }
                    if (ctx.mounted) Navigator.pop(ctx);
                    _fetchData();
                  }
                }),
              ]),
            ),
            Container(height: 0.5, color: AppColors.separator),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                children: [
                  // Vessel picker
                  Text('EMBARCACIÓN', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1)),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () {
                      showCupertinoModalPopup(
                        context: ctx,
                        builder: (pickerCtx) => Container(
                          height: 250,
                          color: AppColors.backgroundSecondary,
                          child: Column(children: [
                            SizedBox(
                              height: 44,
                              child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                                CupertinoButton(child: const Text('Listo'), onPressed: () => Navigator.pop(pickerCtx)),
                              ]),
                            ),
                            Expanded(
                              child: CupertinoPicker(
                                itemExtent: 36,
                                scrollController: FixedExtentScrollController(initialItem: selectedIndex),
                                onSelectedItemChanged: (i) => setModal(() => selectedIndex = i),
                                children: _vessels.map((v) => Center(child: Text(v['name'] ?? '--', style: GoogleFonts.inter(fontSize: 16)))).toList(),
                              ),
                            ),
                          ]),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.separator, width: 0.5),
                      ),
                      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Text(_vessels.isNotEmpty ? _vessels[selectedIndex]['name'] ?? '--' : '--', style: GoogleFonts.inter(fontSize: 15, color: AppColors.textPrimary)),
                        Icon(CupertinoIcons.chevron_down, size: 14, color: AppColors.textSecondary),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text('CALADO ACTUAL (METROS)', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1)),
                  const SizedBox(height: 6),
                  CupertinoTextField(controller: draftCtrl, placeholder: '2.45', keyboardType: const TextInputType.numberWithOptions(decimal: true), padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.separator, width: 0.5))),
                  const SizedBox(height: 18),
                  Text('CALADO MÁXIMO (METROS)', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1)),
                  const SizedBox(height: 6),
                  CupertinoTextField(controller: maxDraftCtrl, placeholder: '3.50', keyboardType: const TextInputType.numberWithOptions(decimal: true), padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.separator, width: 0.5))),
                  const SizedBox(height: 18),
                  Text('OBSERVACIONES', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1)),
                  const SizedBox(height: 6),
                  CupertinoTextField(controller: notesCtrl, placeholder: 'Condiciones, ubicación...', padding: const EdgeInsets.all(14), maxLines: 3, decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.separator, width: 0.5))),
                ],
              ),
            ),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        middle: Text('Calados', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero, onPressed: _addDraftReading,
          child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text('Calados &', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('Hidrometría.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 24),
                  ..._vessels.map((v) => _vesselDraftCard(v)),
                  const SizedBox(height: 28),
                  Text('HISTORIAL DE LECTURAS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  ..._draftHistory.map((h) => _historyItem(h)),
                  if (_draftHistory.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Center(child: Text('Sin lecturas recientes', style: GoogleFonts.inter(color: AppColors.textSecondary))),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _vesselDraftCard(Map<String, dynamic> vessel) {
    double current = (vessel['current_draft'] ?? 0.0).toDouble();
    double maxD = (vessel['max_draft'] ?? 3.5).toDouble();
    if (maxD <= 0) maxD = 3.5;
    double percent = ((current / maxD) * 100).clamp(0, 100);

    Color dotColor = AppColors.accent;
    String status = 'ÓPTIMO';
    if (percent > 90) { dotColor = AppColors.error; status = 'CRÍTICO'; }
    else if (percent > 75) { dotColor = AppColors.warning; status = 'ALERTA'; }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Text(vessel['name'] ?? '--', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary), overflow: TextOverflow.ellipsis)),
            Row(children: [
              Container(width: 6, height: 6, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Text(status, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
            ]),
          ]),
          const SizedBox(height: 14),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('ACTUAL', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
              Text('${current.toStringAsFixed(2)}m', style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
            ]),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('MÁXIMO', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
              Text('${maxD.toStringAsFixed(2)}m', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
            ]),
          ]),
          const SizedBox(height: 12),
          Container(
            height: 4, width: double.infinity,
            decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(2)),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft, widthFactor: percent / 100,
              child: Container(decoration: BoxDecoration(color: dotColor, borderRadius: BorderRadius.circular(2))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _historyItem(Map<String, dynamic> log) {
    DateTime date = DateTime.tryParse(log['created_at'] ?? '') ?? DateTime.now();
    String dateStr = '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';

    double draft = 0.0;
    String vName = log['vessel_name'] ?? 'Desconocido';
    try {
      final details = log['details'];
      if (details is String && details.contains('draft')) {
        final match = RegExp(r'"draft"\s*:\s*([\d.]+)').firstMatch(details);
        if (match != null) draft = double.tryParse(match.group(1)!) ?? 0.0;
      } else if (details is Map) {
        draft = (details['draft'] ?? 0.0).toDouble();
      }
    } catch (_) {}

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(vName, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(log['description'] ?? '-', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${draft.toStringAsFixed(2)}m', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
          Text(dateStr, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        ]),
      ]),
    );
  }
}
