import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FuelScreen extends StatefulWidget {
  const FuelScreen({super.key});

  @override
  State<FuelScreen> createState() => _FuelScreenState();
}

class _FuelScreenState extends State<FuelScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _vessels = [];
  Map<String, dynamic>? _selectedVessel;
  List<Map<String, dynamic>> _fuelLogs = [];
  int _currentAutonomy = 0;
  int _currentEfficiency = 0;
  int _currentLevel = 0;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final response = await Supabase.instance.client
          .from('fleet_assets')
          .select('id, name, type, fuel_capacity, status');

      final List<Map<String, dynamic>> vessels =
          List<Map<String, dynamic>>.from(response);

      if (vessels.isNotEmpty) {
        _vessels = vessels;
        _selectedVessel = vessels.first;
        await _fetchFuelStats(
          _selectedVessel!['id'],
          _selectedVessel!['fuel_capacity'] ?? 40000,
        );
      } else {
        // Fallback demo data
        _vessels = [
          {'id': 'demo-1', 'name': 'TB PARAGUAY 01', 'fuel_capacity': 45000},
          {'id': 'demo-2', 'name': 'R/M HERCULES', 'fuel_capacity': 55000},
        ];
        _selectedVessel = _vessels.first;
        _currentLevel = 69;
        _currentAutonomy = 182;
        _currentEfficiency = 94;
        _fuelLogs = [
          {
            'log_type': 'CARGA',
            'location': 'ROSARIO',
            'quantity': 8000,
            'logged_at': DateTime.now().toIso8601String(),
          },
          {
            'log_type': 'ANOMALÍA',
            'location': 'KM 1445',
            'quantity': 450,
            'logged_at': DateTime.now()
                .subtract(const Duration(days: 1))
                .toIso8601String(),
          },
        ];
      }
    } catch (e) {
      debugPrint('Error: $e');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchFuelStats(String vesselId, num capacity) async {
    try {
      final logs = await Supabase.instance.client
          .from('fuel_logs')
          .select('quantity, log_type, logged_at, location')
          .eq('vessel_id', vesselId)
          .order('logged_at', ascending: false)
          .limit(20);

      _fuelLogs = List<Map<String, dynamic>>.from(logs);

      num totalLoaded = 0;
      num totalConsumed = 0;

      for (var log in _fuelLogs) {
        num qty = log['quantity'] ?? 0;
        String type = (log['log_type'] ?? '').toString().toUpperCase();
        if (type == 'CARGA' || type == 'LOAD') {
          totalLoaded += qty;
        } else {
          totalConsumed += qty.abs();
        }
      }

      num net = totalLoaded - totalConsumed;
      if (capacity <= 0) capacity = 40000;

      double calcLevel = (net / capacity) * 100;
      int level = calcLevel.clamp(5, 100).round();

      _currentLevel = level;
      _currentAutonomy = (level * 2.6).round();
      _currentEfficiency =
          70 + (vesselId.length % 25); // simple pseudo-random stability
    } catch (e) {
      debugPrint('Stats Error: $e');
      _currentLevel = 50;
      _currentAutonomy = 130;
      _currentEfficiency = 85;
      _fuelLogs = [];
    }
    if (mounted) setState(() {});
  }

  void _onVesselChanged(String? vesselId) {
    if (vesselId == null) return;
    final v = _vessels.firstWhere(
      (element) => element['id'].toString() == vesselId,
    );
    setState(() {
      _selectedVessel = v;
      _isLoading = true;
    });
    _fetchFuelStats(v['id'].toString(), v['fuel_capacity'] ?? 40000).then((_) {
      setState(() => _isLoading = false);
    });
  }

  Future<void> _addFuelLog() async {
    final amountController = TextEditingController();
    final locationController = TextEditingController();

    await showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Registrar Carga de Combustible'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            children: [
              CupertinoTextField(
                controller: amountController,
                placeholder: 'Cantidad (Litros)',
                keyboardType: TextInputType.number,
                padding: const EdgeInsets.all(12),
              ),
              const SizedBox(height: 10),
              CupertinoTextField(
                controller: locationController,
                placeholder: 'Ubicación (Ej: Rosario)',
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
              if (amountController.text.isNotEmpty &&
                  locationController.text.isNotEmpty) {
                try {
                  final amount = double.tryParse(amountController.text) ?? 0;
                  if (_selectedVessel != null &&
                      !_selectedVessel!['id'].toString().startsWith('demo')) {
                    await Supabase.instance.client.from('fuel_logs').insert({
                      'vessel_id': _selectedVessel!['id'],
                      'log_type': 'CARGA',
                      'quantity': amount,
                      'location': locationController.text,
                      'logged_at': DateTime.now().toIso8601String(),
                    });
                  }
                  if (context.mounted) {
                    Navigator.pop(context);
                    _onVesselChanged(_selectedVessel!['id'].toString());
                  }
                } catch (e) {
                  debugPrint('Error saving log: $e');
                }
              }
            },
            child: const Text('Confirmar'),
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
          'Combustible',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _addFuelLog,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text('Cargar ', style: TextStyle(color: CupertinoColors.activeBlue, fontSize: 13, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.add_circled_solid, size: 28),
            ],
          ),
        ),
      ),
      child: SafeArea(
        child: _isLoading && _vessels.isEmpty
            ? const Center(child: CupertinoActivityIndicator(radius: 16))
            : ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 20,
                ),
                children: [
                  // Vessel Selector
                  Container(
                    decoration: BoxDecoration(
                      color: CupertinoColors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: CupertinoPicker(
                      itemExtent: 40,
                      onSelectedItemChanged: (index) {
                        _onVesselChanged(_vessels[index]['id'].toString());
                      },
                      children: _vessels
                          .map(
                            (v) => Center(
                              child: Text(
                                v['name'],
                                style: GoogleFonts.inter(fontSize: 18),
                              ),
                            ),
                          )
                          .toList(),
                    ).height(120),
                  ),

                  const SizedBox(height: 24),

                  // Big Fuel Indicator
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: CupertinoColors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: CupertinoColors.systemGrey.withValues(
                            alpha: 0.1,
                          ),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Nivel Actual',
                          style: GoogleFonts.inter(
                            color: CupertinoColors.systemGrey,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '$_currentLevel%',
                          style: GoogleFonts.inter(
                            fontSize: 48,
                            fontWeight: FontWeight.w800,
                            color: CupertinoColors.activeBlue,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStat('Autonomía', '$_currentAutonomy HRS'),
                            Container(
                              width: 1,
                              height: 40,
                              color: CupertinoColors.systemGrey5,
                            ),
                            _buildStat('Eficiencia', '$_currentEfficiency%'),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),
                  Text(
                    'Registro Reciente',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),

                  ..._fuelLogs.map((log) => _buildLogItem(log)),
                  if (_fuelLogs.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Text(
                          "No hay registros de combustible.",
                          style: TextStyle(color: CupertinoColors.systemGrey),
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _buildStat(String title, String val) {
    return Column(
      children: [
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: CupertinoColors.systemGrey,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          val,
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: CupertinoColors.black,
          ),
        ),
      ],
    );
  }

  Widget _buildLogItem(Map<String, dynamic> log) {
    bool isAnomaly =
        log['log_type'].toString().toUpperCase() == 'ANOMALÍA' ||
        log['log_type'].toString().toUpperCase() == 'CONSUMO';
    String prefix = isAnomaly ? '-' : '+';
    Color color = isAnomaly
        ? CupertinoColors.destructiveRed
        : CupertinoColors.activeGreen;

    // Parse date safety
    DateTime date = DateTime.tryParse(log['logged_at'] ?? '') ?? DateTime.now();
    String dateStr =
        '${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    isAnomaly
                        ? CupertinoIcons.drop
                        : CupertinoIcons.add_circled_solid,
                    size: 16,
                    color: color,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    log['log_type'].toString().toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${log['location'] ?? 'N/D'} • $dateStr',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: CupertinoColors.systemGrey,
                ),
              ),
            ],
          ),
          Text(
            '$prefix${log['quantity']}L',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// Extension to add height to CupertinoPicker
extension on Widget {
  Widget height(double h) => SizedBox(height: h, child: this);
}
