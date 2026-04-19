import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart'
    show DropdownButton, DropdownMenuItem, DropdownButtonHideUnderline;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';

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
          .select('*, fleet_assets(name, type)').order('created_at', ascending: false);
      final vesselsResponse = await Supabase.instance.client.from('fleet_assets')
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

  void _showAddTripModal() {
    String? selectedVesselId = _vessels.isNotEmpty ? _vessels.first['id'].toString() : null;
    final originCtrl = TextEditingController();
    final destCtrl = TextEditingController();
    final cargoCtrl = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 3));

    showCupertinoModalPopup(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateModal) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.85,
            padding: const EdgeInsets.only(top: 16),
            decoration: const BoxDecoration(
              color: AppColors.backgroundSecondary,
              borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  Text('Crear Nuevo Viaje', style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                  const SizedBox(height: 16),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      children: [
                        Text('EMBARCACIÓN', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLow,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.separator, width: 0.5),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              isExpanded: true, value: selectedVesselId,
                              items: _vessels.map((v) => DropdownMenuItem<String>(
                                value: v['id'].toString(),
                                child: Text(v['name'], style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14)),
                              )).toList(),
                              onChanged: (val) => setStateModal(() => selectedVesselId = val),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _formField(originCtrl, 'Puerto de Origen'),
                        const SizedBox(height: 12),
                        _formField(destCtrl, 'Puerto de Destino'),
                        const SizedBox(height: 12),
                        _formField(cargoCtrl, 'Tipo de Carga'),
                        const SizedBox(height: 16),
                        Text('ETA', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                        SizedBox(
                          height: 150,
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
                    child: SizedBox(
                      width: double.infinity,
                      child: CupertinoButton(
                        color: AppColors.textPrimary,
                        borderRadius: BorderRadius.circular(12),
                        onPressed: () async {
                          if (selectedVesselId == null || originCtrl.text.isEmpty || destCtrl.text.isEmpty) return;
                          Navigator.pop(context);
                          await _submitNewTrip(selectedVesselId!, originCtrl.text, destCtrl.text, cargoCtrl.text, selectedDate);
                        },
                        child: Text('PROCESAR VIAJE', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.textOnAccent, fontSize: 14)),
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

  Widget _formField(TextEditingController ctrl, String placeholder) {
    return CupertinoTextField(
      controller: ctrl,
      placeholder: placeholder,
      padding: const EdgeInsets.all(14),
      placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
      style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
    );
  }

  Future<void> _submitNewTrip(String vesselId, String origin, String dest, String cargo, DateTime eta) async {
    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.from('voyages').insert({
        'vessel_id': int.parse(vesselId),
        'voyage_number': 'V-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        'origin_port': origin, 'destination_port': dest, 'cargo_type': cargo,
        'eta': eta.toIso8601String(), 'status': 'planned', 'company_id': 'DEMO_TENANT',
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
        middle: Text('Viajes', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero, onPressed: _showAddTripModal,
          child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : _trips.isEmpty
            ? Center(child: Text('No hay viajes activos', style: GoogleFonts.inter(color: AppColors.textSecondary)))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text('Gestión de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('Viajes.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 6),
                  Text('${_trips.length} MANIFIESTOS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 24),
                  ..._trips.map((t) => _tripCard(t)),
                ],
              ),
      ),
    );
  }

  Widget _tripCard(Map<String, dynamic> trip) {
    final vessel = trip['fleet_assets'] ?? {};
    final vesselName = vessel['name'] ?? 'Desconocido';
    final origin = trip['origin_port'] ?? 'N/A';
    final dest = trip['destination_port'] ?? 'N/A';
    final status = trip['status'] ?? 'pending';
    final etaStr = trip['eta'] != null ? trip['eta'].toString().split('T').first : '--';

    Color dotColor = AppColors.textSecondary;
    String statusLabel = 'PENDIENTE';
    if (status == 'active' || status == 'live') { dotColor = AppColors.accent; statusLabel = 'EN VIVO'; }
    else if (status == 'completed') { dotColor = AppColors.success; statusLabel = 'COMPLETADO'; }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(vesselName, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
              Row(children: [
                Container(width: 6, height: 6, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
                const SizedBox(width: 6),
                Text(statusLabel, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
              ]),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('ORIGEN', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                Text(origin, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
              ]),
              Icon(CupertinoIcons.arrow_right, color: AppColors.separator, size: 16),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text('DESTINO', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                Text(dest, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
              ]),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(10)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('CARGA', style: GoogleFonts.inter(fontSize: 9, color: AppColors.textSecondary, fontWeight: FontWeight.w700)),
                  Text(trip['cargo_type'] ?? 'General', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                ]),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('ETA', style: GoogleFonts.inter(fontSize: 9, color: AppColors.textSecondary, fontWeight: FontWeight.w700)),
                  Text(etaStr, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
