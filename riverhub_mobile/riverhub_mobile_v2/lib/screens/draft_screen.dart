import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart'
    show DropdownButton, DropdownMenuItem, DropdownButtonHideUnderline;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';

class DraftScreen extends StatefulWidget {
  const DraftScreen({super.key});

  @override
  State<DraftScreen> createState() => _DraftScreenState();
}

class _DraftScreenState extends State<DraftScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _vessels = [];
  List<Map<String, dynamic>> _draftHistory = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final vesselResponse = await Supabase.instance.client.from('fleet_assets')
          .select('id, name, max_draft').order('name');
      _vessels = List<Map<String, dynamic>>.from(vesselResponse);

      final logsResponse = await Supabase.instance.client.from('logs')
          .select('id, created_at, description, location_data, vessel_id, fleet_assets:vessel_id(name)')
          .eq('action_type', 'DRAFT_READING').order('created_at', ascending: false).limit(50);
      _draftHistory = List<Map<String, dynamic>>.from(logsResponse);

      for (var vessel in _vessels) {
        final recentLog = _draftHistory.firstWhere((l) => l['vessel_id'] == vessel['id'], orElse: () => {});
        vessel['current_draft'] = (recentLog.isNotEmpty && recentLog['location_data'] != null)
            ? recentLog['location_data']['draft'] ?? 0.0 : 0.0;
      }

      if (_vessels.isEmpty) {
        _vessels = [
          {'id': 'demo-1', 'name': 'TB PARAGUAY 01', 'max_draft': 3.5, 'current_draft': 2.45},
          {'id': 'demo-2', 'name': 'R/M HERCULES', 'max_draft': 4.0, 'current_draft': 3.80},
        ];
      }
    } catch (e) { debugPrint('Error: $e'); }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _addDraftReading() async {
    if (_vessels.isEmpty) return;
    Map<String, dynamic> selectedVessel = _vessels.first;
    final draftCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

    await showCupertinoDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => CupertinoAlertDialog(
          title: const Text('Registrar Calado'),
          content: Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.separator, width: 0.5),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    isExpanded: true, value: selectedVessel['id'].toString(),
                    dropdownColor: AppColors.backgroundSecondary,
                    items: _vessels.map((v) => DropdownMenuItem<String>(
                      value: v['id'].toString(), child: Text(v['name'], style: GoogleFonts.inter(fontSize: 14)),
                    )).toList(),
                    onChanged: (val) => setModal(() {
                      selectedVessel = _vessels.firstWhere((v) => v['id'].toString() == val);
                      draftCtrl.text = (selectedVessel['current_draft'] ?? 0).toString();
                    }),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              CupertinoTextField(controller: draftCtrl, placeholder: 'Calado (metros)', keyboardType: const TextInputType.numberWithOptions(decimal: true), padding: const EdgeInsets.all(12)),
              const SizedBox(height: 10),
              CupertinoTextField(controller: notesCtrl, placeholder: 'Observaciones', padding: const EdgeInsets.all(12)),
            ]),
          ),
          actions: [
            CupertinoDialogAction(child: const Text('Cancelar'), onPressed: () => Navigator.pop(ctx)),
            CupertinoDialogAction(isDefaultAction: true, child: const Text('Guardar'), onPressed: () async {
              if (draftCtrl.text.isNotEmpty) {
                try {
                  final draftVal = double.tryParse(draftCtrl.text) ?? 0.0;
                  if (!selectedVessel['id'].toString().startsWith('demo')) {
                    await Supabase.instance.client.from('logs').insert({
                      'vessel_id': selectedVessel['id'], 'action_type': 'DRAFT_READING',
                      'description': notesCtrl.text.isEmpty ? 'Actualización de calado' : notesCtrl.text,
                      'location_data': {'draft': draftVal},
                      'user_id': Supabase.instance.client.auth.currentUser?.id,
                    });
                  }
                  if (ctx.mounted) { Navigator.pop(ctx); _fetchData(); }
                } catch (e) { debugPrint('Error: $e'); }
              }
            }),
          ],
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
    double max = (vessel['max_draft'] ?? 3.5).toDouble();
    if (max <= 0) max = 3.5;
    double percent = ((current / max) * 100).clamp(0, 100);

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
            Text(vessel['name'], style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
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
              Text('${max.toStringAsFixed(2)}m', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
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
    double draft = log['location_data']?['draft']?.toDouble() ?? 0.0;
    String vName = log['fleet_assets']?['name'] ?? 'Desconocido';

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
