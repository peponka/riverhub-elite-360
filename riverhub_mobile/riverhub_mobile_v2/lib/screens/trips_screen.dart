import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart'
    show DropdownButton, DropdownMenuItem, DropdownButtonHideUnderline;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
      // 1. Fetch Voyages
      final tripsResponse = await Supabase.instance.client
          .from('voyages')
          .select('*, fleet_assets(name, type)')
          .order('created_at', ascending: false);

      // 2. Fetch Vessels for Modal
      final vesselsResponse = await Supabase.instance.client
          .from('fleet_assets')
          .select('id, name, type')
          .order('name', ascending: true);

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
    String? selectedVesselId = _vessels.isNotEmpty
        ? _vessels.first['id'].toString()
        : null;
    final originCtrl = TextEditingController();
    final destCtrl = TextEditingController();
    final cargoCtrl = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 3));

    showCupertinoModalPopup(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setStateModal) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              padding: const EdgeInsets.only(top: 16),
              decoration: const BoxDecoration(
                color: CupertinoColors.systemGroupedBackground,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    Text(
                      'Crear Nuevo Viaje',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          const Text(
                            'Embarcación',
                            style: TextStyle(
                              color: CupertinoColors.systemGrey,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: CupertinoColors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                isExpanded: true,
                                value: selectedVesselId,
                                items: _vessels.map((v) {
                                  return DropdownMenuItem<String>(
                                    value: v['id'].toString(),
                                    child: Text(v['name']),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  setStateModal(() => selectedVesselId = val);
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          CupertinoTextField(
                            controller: originCtrl,
                            placeholder: 'Puerto de Origen',
                            padding: const EdgeInsets.all(12),
                          ),
                          const SizedBox(height: 12),
                          CupertinoTextField(
                            controller: destCtrl,
                            placeholder: 'Puerto de Destino',
                            padding: const EdgeInsets.all(12),
                          ),
                          const SizedBox(height: 12),
                          CupertinoTextField(
                            controller: cargoCtrl,
                            placeholder:
                                'Tipo de Carga (ej. Combustible, Soja)',
                            padding: const EdgeInsets.all(12),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Fecha Estimada de Arribo (ETA)',
                            style: TextStyle(
                              color: CupertinoColors.systemGrey,
                              fontSize: 12,
                            ),
                          ),
                          SizedBox(
                            height: 150,
                            child: CupertinoDatePicker(
                              initialDateTime: selectedDate,
                              mode: CupertinoDatePickerMode.date,
                              onDateTimeChanged: (date) {
                                selectedDate = date;
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: CupertinoButton(
                        color: CupertinoColors.activeBlue,
                        onPressed: () async {
                          if (selectedVesselId == null ||
                              originCtrl.text.isEmpty ||
                              destCtrl.text.isEmpty) {
                            return; // Validation short-circuit
                          }
                          Navigator.pop(context);
                          await _submitNewTrip(
                            selectedVesselId!,
                            originCtrl.text,
                            destCtrl.text,
                            cargoCtrl.text,
                            selectedDate,
                          );
                        },
                        child: const Text(
                          'PROCESAR VIAJE',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _submitNewTrip(
    String vesselId,
    String origin,
    String dest,
    String cargo,
    DateTime eta,
  ) async {
    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.from('voyages').insert({
        'vessel_id': int.parse(vesselId),
        'voyage_number':
            'V-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        'origin_port': origin,
        'destination_port': dest,
        'cargo_type': cargo,
        'eta': eta.toIso8601String(),
        'status': 'planned',
        'company_id': 'DEMO_TENANT', // fallback
      });

      _fetchData();
    } catch (e) {
      debugPrint('Error Creating Trip: $e');
      setState(() => _isLoading = false);
    }
  }

  Widget _buildTripCard(Map<String, dynamic> trip) {
    final vessel = trip['fleet_assets'] ?? {};
    final vesselName = vessel['name'] ?? 'Desconocido';
    final type = vessel['type'] ?? 'Convoy';
    final origin = trip['origin_port'] ?? 'N/A';
    final dest = trip['destination_port'] ?? 'N/A';
    final status = trip['status'] ?? 'pending';
    final etaStr = trip['eta'] != null
        ? trip['eta'].toString().split('T').first
        : '--';

    Color statusColor = CupertinoColors.systemGrey;
    String statusLabel = 'PENDIENTE';
    IconData statusIcon = CupertinoIcons.clock;

    if (status == 'active' || status == 'live') {
      statusColor = CupertinoColors.activeBlue;
      statusLabel = 'EN VIVO';
      statusIcon = CupertinoIcons.antenna_radiowaves_left_right;
    } else if (status == 'completed') {
      statusColor = CupertinoColors.activeGreen;
      statusLabel = 'COMPLETADO';
      statusIcon = CupertinoIcons.check_mark_circled;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.systemGrey4.withValues(alpha: 0.5),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: CupertinoColors.activeBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      CupertinoIcons.compass,
                      color: CupertinoColors.activeBlue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        vesselName,
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        type.toString().toUpperCase(),
                        style: const TextStyle(
                          fontSize: 10,
                          color: CupertinoColors.systemGrey,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(statusIcon, color: statusColor, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ORIGEN',
                    style: TextStyle(
                      fontSize: 10,
                      color: CupertinoColors.systemGrey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    origin,
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const Icon(
                CupertinoIcons.arrow_right,
                color: CupertinoColors.systemGrey3,
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'DESTINO',
                    style: TextStyle(
                      fontSize: 10,
                      color: CupertinoColors.systemGrey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    dest,
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: CupertinoColors.systemGroupedBackground,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'CARGA',
                      style: TextStyle(
                        fontSize: 10,
                        color: CupertinoColors.systemGrey,
                      ),
                    ),
                    Text(
                      trip['cargo_type'] ?? 'General',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'ARRIBO ESTIMADO',
                      style: TextStyle(
                        fontSize: 10,
                        color: CupertinoColors.systemGrey,
                      ),
                    ),
                    Text(
                      etaStr,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: CupertinoColors.activeBlue,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
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
          'Manifiestos y Viajes',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _showAddTripModal,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text('Nuevo ', style: TextStyle(color: CupertinoColors.activeBlue, fontSize: 13, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.add),
            ],
          ),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator())
            : _trips.isEmpty
            ? Center(
                child: Text(
                  'No hay viajes activos',
                  style: GoogleFonts.inter(color: CupertinoColors.systemGrey),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _trips.length,
                itemBuilder: (context, index) {
                  return _buildTripCard(_trips[index]);
                },
              ),
      ),
    );
  }
}
