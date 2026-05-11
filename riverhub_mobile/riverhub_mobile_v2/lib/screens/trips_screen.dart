import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class TripsScreen extends StatefulWidget {
  const TripsScreen({super.key});

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _trips = [];
  List<Map<String, dynamic>> _vessels = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final tripsResponse = await Supabase.instance.client.from('voyages')
          .select('*').order('created_at', ascending: false);
      final vesselsResponse = await Supabase.instance.client.from('vessels')
          .select('id, name, type').order('name', ascending: true);
      if (mounted) {
        setState(() {
          _trips = List<Map<String, dynamic>>.from(tripsResponse);
          _vessels = List<Map<String, dynamic>>.from(vesselsResponse);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching trips: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showVesselPicker(Map<String, dynamic>? current, ValueChanged<Map<String, dynamic>> onSelect) {
    if (_vessels.isEmpty) {
      showCupertinoDialog(
        context: context,
        builder: (_) => CupertinoAlertDialog(
          title: Text(LocaleService.t('trips_no_vessels'), style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          content: Text(LocaleService.t('trips_no_vessels_desc'), style: GoogleFonts.inter()),
          actions: [CupertinoDialogAction(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
        ),
      );
      return;
    }

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.45),
        decoration: BoxDecoration(
          color: AppColors.backgroundPrimary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
              child: Row(
                children: [
                  Text(LocaleService.t('trips_select_vessel'), style: GoogleFonts.newsreader(fontSize: 20, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.pop(ctx),
                    child: Icon(CupertinoIcons.xmark_circle_fill, color: AppColors.textTertiary, size: 24),
                  ),
                ],
              ),
            ),
            Container(height: 0.5, color: AppColors.separator),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _vessels.length,
                itemBuilder: (_, i) {
                  final v = _vessels[i];
                  final isSelected = current != null && current['id'].toString() == v['id'].toString();
                  return GestureDetector(
                    onTap: () {
                      Navigator.pop(ctx);
                      onSelect(v);
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.textPrimary.withValues(alpha: 0.06) : AppColors.backgroundSecondary,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? AppColors.textPrimary : AppColors.separator,
                          width: isSelected ? 1.0 : 0.5,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(CupertinoIcons.helm, size: 20, color: AppColors.textPrimary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(v['name'] ?? LocaleService.t('common_no_name'), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                                Text(v['type'] ?? '', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                              ],
                            ),
                          ),
                          if (isSelected) Icon(CupertinoIcons.checkmark_circle_fill, color: AppColors.textPrimary, size: 20),
                        ],
                      ),
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

  void _showAddTripModal() {
    Map<String, dynamic>? selectedVessel = _vessels.isNotEmpty ? _vessels.first : null;
    final originCtrl = TextEditingController();
    final destCtrl = TextEditingController();
    final cargoCtrl = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 3));

    showCupertinoModalPopup(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateModal) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.78,
            padding: const EdgeInsets.only(top: 16),
            decoration: const BoxDecoration(
              color: AppColors.backgroundPrimary,
              borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
                  const SizedBox(height: 16),
                  Text(LocaleService.t('trips_create_title'), style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                  Text(LocaleService.t('trips_manifest'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 20),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      children: [
                        Text(LocaleService.t('trips_vessel_section'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                        const SizedBox(height: 6),
                        GestureDetector(
                          onTap: () => _showVesselPicker(selectedVessel, (v) {
                            setStateModal(() => selectedVessel = v);
                          }),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.backgroundSecondary,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.separator, width: 0.5),
                            ),
                            child: Row(
                              children: [
                                Icon(CupertinoIcons.helm, size: 18, color: selectedVessel != null ? AppColors.textPrimary : AppColors.textTertiary),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    selectedVessel?['name'] ?? LocaleService.t('trips_select_hint'),
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      color: selectedVessel != null ? AppColors.textPrimary : AppColors.textTertiary,
                                      fontWeight: selectedVessel != null ? FontWeight.w600 : FontWeight.w400,
                                    ),
                                  ),
                                ),
                                Icon(CupertinoIcons.chevron_down, size: 16, color: AppColors.textSecondary),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        Text(LocaleService.t('trips_route_section'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                        const SizedBox(height: 6),
                        _formField(originCtrl, LocaleService.t('trips_origin'), CupertinoIcons.location),
                        const SizedBox(height: 10),
                        _formField(destCtrl, LocaleService.t('trips_dest'), CupertinoIcons.location_solid),
                        const SizedBox(height: 16),

                        Text(LocaleService.t('trips_cargo_label'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                        const SizedBox(height: 6),
                        _formField(cargoCtrl, LocaleService.t('trips_cargo'), CupertinoIcons.cube_box),
                        const SizedBox(height: 16),

                        Text('ETA', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                        const SizedBox(height: 6),
                        Container(
                          height: 150,
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.separator, width: 0.5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: CupertinoDatePicker(
                            initialDateTime: selectedDate,
                            mode: CupertinoDatePickerMode.date,
                            onDateTimeChanged: (date) => selectedDate = date,
                          ),
                        ),
                      ],
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: GestureDetector(
                      onTap: () async {
                        if (selectedVessel == null || originCtrl.text.isEmpty || destCtrl.text.isEmpty) return;
                        Navigator.pop(context);
                        await _submitNewTrip(selectedVessel!['id'].toString(), originCtrl.text, destCtrl.text, cargoCtrl.text, selectedDate);
                      },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: AppColors.textPrimary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(LocaleService.t('trips_process'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.backgroundPrimary, fontSize: 14, letterSpacing: 0.5)),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _formField(TextEditingController ctrl, String placeholder, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: CupertinoTextField(
              controller: ctrl,
              placeholder: placeholder,
              placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
              style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
              decoration: const BoxDecoration(),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitNewTrip(String vesselId, String origin, String dest, String cargo, DateTime eta) async {
    setState(() => _isLoading = true);
    try {
      final vesselData = _vessels.firstWhere((v) => v['id'].toString() == vesselId, orElse: () => {});
      await Supabase.instance.client.from('voyages').insert({
        'vessel_id': int.tryParse(vesselId) ?? vesselId,
        'vessel_name': vesselData['name'] ?? '',
        'voyage_number': 'V-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        'origin_port': origin, 'destination_port': dest, 'cargo_type': cargo,
        'eta': eta.toIso8601String(), 'status': 'planned',
      });
      _fetchData();
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
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
        middle: Text(LocaleService.t('trips_nav_title'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero, onPressed: _showAddTripModal,
          child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : _trips.isEmpty
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(CupertinoIcons.map, size: 40, color: AppColors.textTertiary),
                    const SizedBox(height: 12),
                    Text(LocaleService.t('trips_empty'), style: GoogleFonts.newsreader(fontSize: 18, color: AppColors.textSecondary)),
                    const SizedBox(height: 4),
                    Text(LocaleService.t('trips_add_desc'), style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary)),
                  ],
                ),
              )
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text(LocaleService.t('trips_header1'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text(LocaleService.t('trips_header2'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 6),
                  Text('${_trips.length} ${LocaleService.t('trips_manifests')}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 24),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 0.78,
                    children: _trips.map((t) => _tripCard(t)).toList(),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _tripCard(Map<String, dynamic> trip) {
    final vesselName = trip['vessel_name'] ?? LocaleService.t('common_no_name');
    final origin = trip['origin_port'] ?? 'N/A';
    final dest = trip['destination_port'] ?? 'N/A';
    final status = trip['status'] ?? 'pending';
    final etaStr = trip['eta'] != null ? trip['eta'].toString().split('T').first : '--';
    final cargo = trip['cargo_type'] ?? LocaleService.t('dyn_key_222');

    String statusLabel;
    if (status == 'active' || status == 'live') {
      statusLabel = LocaleService.t('trips_live_label');
    } else if (status == 'completed') {
      statusLabel = LocaleService.t('trips_done_label');
    } else if (status == 'planned') {
      statusLabel = LocaleService.t('trips_planned_label');
    } else {
      statusLabel = LocaleService.t('trips_pending_label');
    }

    Color statusColor;
    if (status == 'active' || status == 'live') {
      statusColor = AppColors.success;
    } else if (status == 'completed') {
      statusColor = AppColors.accent;
    } else if (status == 'planned') {
      statusColor = AppColors.purple;
    } else {
      statusColor = AppColors.orange;
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Vessel name + status
                  Row(
                    children: [
                      Expanded(child: Text(vesselName, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.textPrimary), overflow: TextOverflow.ellipsis)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(5),
                          border: Border.all(color: statusColor.withValues(alpha: 0.3), width: 0.5),
                        ),
                        child: Text(statusLabel, style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: statusColor, letterSpacing: 0.3)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Origin
                  Text('ORIGEN', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 0.5)),
                  Text(origin, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary), overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(children: [
                    Icon(CupertinoIcons.arrow_down, color: statusColor, size: 12),
                    const SizedBox(width: 4),
                    Expanded(child: Container(height: 0.5, color: AppColors.separator)),
                  ]),
                  const SizedBox(height: 4),
                  // Dest
                  Text('DESTINO', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 0.5)),
                  Text(dest, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary), overflow: TextOverflow.ellipsis),
                  const Spacer(),
                  // Bottom info
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('CARGA', style: GoogleFonts.inter(fontSize: 7, color: AppColors.textTertiary, fontWeight: FontWeight.w700)),
                          Text(cargo, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textPrimary), overflow: TextOverflow.ellipsis),
                        ]),
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text('ETA', style: GoogleFonts.inter(fontSize: 7, color: AppColors.textTertiary, fontWeight: FontWeight.w700)),
                          Text(etaStr, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                        ]),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
