import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart'
    show DropdownButton, DropdownMenuItem, DropdownButtonHideUnderline;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
      // Fetch vessels
      final vesselResponse = await Supabase.instance.client
          .from('fleet_assets')
          .select('id, name, max_draft')
          .order('name');

      _vessels = List<Map<String, dynamic>>.from(vesselResponse);

      // Fetch draft history from logs
      final logsResponse = await Supabase.instance.client
          .from('logs')
          .select(
            'id, created_at, description, location_data, vessel_id, fleet_assets:vessel_id(name)',
          )
          .eq('action_type', 'DRAFT_READING')
          .order('created_at', ascending: false)
          .limit(50);

      _draftHistory = List<Map<String, dynamic>>.from(logsResponse);

      // Calculate current draft for each vessel based on most recent log
      for (var vessel in _vessels) {
        final recentLog = _draftHistory.firstWhere(
          (log) => log['vessel_id'] == vessel['id'],
          orElse: () => {},
        );

        if (recentLog.isNotEmpty && recentLog['location_data'] != null) {
          vessel['current_draft'] = recentLog['location_data']['draft'] ?? 0.0;
        } else {
          vessel['current_draft'] = 0.0;
        }
      }

      if (_vessels.isEmpty) {
        _vessels = [
          {
            'id': 'demo-1',
            'name': 'TB PARAGUAY 01',
            'max_draft': 3.5,
            'current_draft': 2.45,
          },
          {
            'id': 'demo-2',
            'name': 'R/M HERCULES',
            'max_draft': 4.0,
            'current_draft': 3.80,
          },
        ];
      }
    } catch (e) {
      debugPrint('Error: $e');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _addDraftReading() async {
    if (_vessels.isEmpty) return;

    Map<String, dynamic> selectedVessel = _vessels.first;
    final draftController = TextEditingController();
    final notesController = TextEditingController();

    await showCupertinoDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return CupertinoAlertDialog(
            title: const Text('Registrar Calado'),
            content: Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: CupertinoColors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: CupertinoColors.systemGrey4),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: selectedVessel['id'].toString(),
                        dropdownColor: CupertinoColors.white,
                        items: _vessels.map((v) {
                          return DropdownMenuItem<String>(
                            value: v['id'].toString(),
                            child: Text(
                              v['name'],
                              style: GoogleFonts.inter(fontSize: 14),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setModalState(() {
                            selectedVessel = _vessels.firstWhere(
                              (v) => v['id'].toString() == val,
                            );
                            draftController.text =
                                (selectedVessel['current_draft'] ?? 0)
                                    .toString();
                          });
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  CupertinoTextField(
                    controller: draftController,
                    placeholder: 'Calado (metros)',
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    padding: const EdgeInsets.all(12),
                  ),
                  const SizedBox(height: 10),
                  CupertinoTextField(
                    controller: notesController,
                    placeholder: 'Observaciones',
                    padding: const EdgeInsets.all(12),
                  ),
                ],
              ),
            ),
            actions: [
              CupertinoDialogAction(
                child: const Text('Cancelar'),
                onPressed: () => Navigator.pop(context),
              ),
              CupertinoDialogAction(
                isDefaultAction: true,
                onPressed: () async {
                  if (draftController.text.isNotEmpty) {
                    try {
                      final draftVal =
                          double.tryParse(draftController.text) ?? 0.0;
                      if (!selectedVessel['id'].toString().startsWith('demo')) {
                        await Supabase.instance.client.from('logs').insert({
                          'vessel_id': selectedVessel['id'],
                          'action_type': 'DRAFT_READING',
                          'description': notesController.text.isEmpty
                              ? 'Actualización de calado'
                              : notesController.text,
                          'location_data': {'draft': draftVal},
                          'user_id':
                              Supabase.instance.client.auth.currentUser?.id,
                        });
                      }
                      if (context.mounted) {
                        Navigator.pop(context);
                        _fetchData();
                      }
                    } catch (e) {
                      debugPrint('Error saving draft: $e');
                    }
                  }
                },
                child: const Text('Guardar'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: CupertinoColors.systemGroupedBackground,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CupertinoColors.white.withValues(alpha: 0.85),
        middle: Text(
          'Calados e Hidrometría',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _addDraftReading,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text('Nuevo ', style: TextStyle(color: CupertinoColors.activeBlue, fontSize: 13, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.add_circled_solid, size: 28),
            ],
          ),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 16))
            : ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 20,
                ),
                children: [
                  Text(
                    'Estado de Flota',
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),

                  ..._vessels.map((v) => _buildVesselDraftCard(v)),

                  const SizedBox(height: 32),
                  Text(
                    'Historial de Lecturas',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),

                  ..._draftHistory.map((h) => _buildHistoryItem(h)),
                  if (_draftHistory.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(20.0),
                      child: Center(
                        child: Text(
                          'Sin lecturas recientes',
                          style: TextStyle(color: CupertinoColors.systemGrey),
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _buildVesselDraftCard(Map<String, dynamic> vessel) {
    double current = (vessel['current_draft'] ?? 0.0).toDouble();
    double max = (vessel['max_draft'] ?? 3.5).toDouble();
    if (max <= 0) max = 3.5;

    double percent = (current / max) * 100;
    percent = percent.clamp(0, 100);

    Color barColor = CupertinoColors.activeBlue;
    String status = 'Óptimo';

    if (percent > 90) {
      barColor = CupertinoColors.destructiveRed;
      status = 'Crítico';
    } else if (percent > 75) {
      barColor = CupertinoColors.systemOrange;
      status = 'Alerta';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.systemGrey.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                vessel['name'],
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: barColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: barColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Actual',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: CupertinoColors.systemGrey,
                    ),
                  ),
                  Text(
                    '${current.toStringAsFixed(2)}m',
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: CupertinoColors.black,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Máximo',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: CupertinoColors.systemGrey,
                    ),
                  ),
                  Text(
                    '${max.toStringAsFixed(2)}m',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: CupertinoColors.systemGrey,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress Bar
          Container(
            height: 8,
            width: double.infinity,
            decoration: BoxDecoration(
              color: CupertinoColors.systemGrey5,
              borderRadius: BorderRadius.circular(4),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: percent / 100,
              child: Container(
                decoration: BoxDecoration(
                  color: barColor,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(Map<String, dynamic> log) {
    DateTime date =
        DateTime.tryParse(log['created_at'] ?? '') ?? DateTime.now();
    String dateStr =
        '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';

    double draft = log['location_data']?['draft']?.toDouble() ?? 0.0;
    String vName = log['fleet_assets']?['name'] ?? 'Desconocido';

    return Container(
      margin: const EdgeInsets.only(bottom: 1),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      color: CupertinoColors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  vName,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  log['description'] ?? '-',
                  style: GoogleFonts.inter(
                    color: CupertinoColors.systemGrey,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${draft.toStringAsFixed(2)}m',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: CupertinoColors.activeBlue,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                dateStr,
                style: GoogleFonts.inter(
                  color: CupertinoColors.systemGrey,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
