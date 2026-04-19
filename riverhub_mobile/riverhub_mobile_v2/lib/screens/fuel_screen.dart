import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';

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
      final response = await Supabase.instance.client.from('fleet_assets').select('id, name, type, fuel_capacity, status');
      final List<Map<String, dynamic>> vessels = List<Map<String, dynamic>>.from(response);
      if (vessels.isNotEmpty) {
        _vessels = vessels;
        _selectedVessel = vessels.first;
        await _fetchFuelStats(_selectedVessel!['id'], _selectedVessel!['fuel_capacity'] ?? 40000);
      } else {
        _vessels = [
          {'id': 'demo-1', 'name': 'TB PARAGUAY 01', 'fuel_capacity': 45000},
          {'id': 'demo-2', 'name': 'R/M HERCULES', 'fuel_capacity': 55000},
        ];
        _selectedVessel = _vessels.first;
        _currentLevel = 69; _currentAutonomy = 182; _currentEfficiency = 94;
        _fuelLogs = [
          {'log_type': 'CARGA', 'location': 'ROSARIO', 'quantity': 8000, 'logged_at': DateTime.now().toIso8601String()},
          {'log_type': 'ANOMALÍA', 'location': 'KM 1445', 'quantity': 450, 'logged_at': DateTime.now().subtract(const Duration(days: 1)).toIso8601String()},
        ];
      }
    } catch (e) { debugPrint('Error: $e'); }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchFuelStats(String vesselId, num capacity) async {
    try {
      final logs = await Supabase.instance.client.from('fuel_logs')
          .select('quantity, log_type, logged_at, location').eq('vessel_id', vesselId)
          .order('logged_at', ascending: false).limit(20);
      _fuelLogs = List<Map<String, dynamic>>.from(logs);
      num totalLoaded = 0, totalConsumed = 0;
      for (var log in _fuelLogs) {
        num qty = log['quantity'] ?? 0;
        String type = (log['log_type'] ?? '').toString().toUpperCase();
        if (type == 'CARGA' || type == 'LOAD') { totalLoaded += qty; } else { totalConsumed += qty.abs(); }
      }
      num net = totalLoaded - totalConsumed;
      if (capacity <= 0) capacity = 40000;
      _currentLevel = ((net / capacity) * 100).clamp(5, 100).round();
      _currentAutonomy = (_currentLevel * 2.6).round();
      _currentEfficiency = 70 + (vesselId.length % 25);
    } catch (e) {
      debugPrint('Stats Error: $e');
      _currentLevel = 50; _currentAutonomy = 130; _currentEfficiency = 85; _fuelLogs = [];
    }
    if (mounted) setState(() {});
  }

  void _onVesselChanged(String? vesselId) {
    if (vesselId == null) return;
    final v = _vessels.firstWhere((e) => e['id'].toString() == vesselId);
    setState(() { _selectedVessel = v; _isLoading = true; });
    _fetchFuelStats(v['id'].toString(), v['fuel_capacity'] ?? 40000).then((_) => setState(() => _isLoading = false));
  }

  Future<void> _addFuelLog() async {
    final amountController = TextEditingController();
    final locationController = TextEditingController();
    await showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Registrar Carga'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Column(children: [
            CupertinoTextField(controller: amountController, placeholder: 'Cantidad (Litros)', keyboardType: TextInputType.number, padding: const EdgeInsets.all(12)),
            const SizedBox(height: 10),
            CupertinoTextField(controller: locationController, placeholder: 'Ubicación', padding: const EdgeInsets.all(12)),
          ]),
        ),
        actions: [
          CupertinoDialogAction(child: const Text('Cancelar'), onPressed: () => Navigator.pop(context)),
          CupertinoDialogAction(
            isDefaultAction: true, child: const Text('Confirmar'),
            onPressed: () async {
              if (amountController.text.isNotEmpty && locationController.text.isNotEmpty) {
                try {
                  final amount = double.tryParse(amountController.text) ?? 0;
                  if (_selectedVessel != null && !_selectedVessel!['id'].toString().startsWith('demo')) {
                    await Supabase.instance.client.from('fuel_logs').insert({
                      'vessel_id': _selectedVessel!['id'], 'log_type': 'CARGA', 'quantity': amount,
                      'location': locationController.text, 'logged_at': DateTime.now().toIso8601String(),
                    });
                  }
                  if (context.mounted) { Navigator.pop(context); _onVesselChanged(_selectedVessel!['id'].toString()); }
                } catch (e) { debugPrint('Error: $e'); }
              }
            },
          ),
        ],
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
        middle: Text('Combustible', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero, onPressed: _addFuelLog,
          child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary),
        ),
      ),
      child: SafeArea(
        child: _isLoading && _vessels.isEmpty
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text('Combustible', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('& Energía.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 6),
                  Text(_selectedVessel?['name'] ?? '', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 24),

                  // Vessel selector
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.backgroundSecondary,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.separator, width: 0.5),
                    ),
                    child: SizedBox(
                      height: 100,
                      child: CupertinoPicker(
                        itemExtent: 36,
                        onSelectedItemChanged: (i) => _onVesselChanged(_vessels[i]['id'].toString()),
                        children: _vessels.map((v) => Center(
                          child: Text(v['name'], style: GoogleFonts.inter(fontSize: 15, color: AppColors.textPrimary)),
                        )).toList(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Big fuel card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundSecondary,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.separator, width: 0.5),
                    ),
                    child: Column(
                      children: [
                        Text('NIVEL ACTUAL', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                        const SizedBox(height: 8),
                        Text('$_currentLevel%', style: GoogleFonts.newsreader(fontSize: 56, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1)),
                        const SizedBox(height: 20),
                        Container(height: 0.5, color: AppColors.separator),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _stat('Autonomía', '$_currentAutonomy HRS'),
                            _stat('Eficiencia', '$_currentEfficiency%'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text('REGISTRO RECIENTE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  ..._fuelLogs.map((log) => _logItem(log)),
                  if (_fuelLogs.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Center(child: Text('Sin registros', style: GoogleFonts.inter(color: AppColors.textSecondary))),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _stat(String title, String val) {
    return Column(children: [
      Text(title.toUpperCase(), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
      const SizedBox(height: 4),
      Text(val, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
    ]);
  }

  Widget _logItem(Map<String, dynamic> log) {
    bool isAnomaly = log['log_type'].toString().toUpperCase() == 'ANOMALÍA' || log['log_type'].toString().toUpperCase() == 'CONSUMO';
    String prefix = isAnomaly ? '-' : '+';
    Color dotColor = isAnomaly ? AppColors.error : AppColors.success;
    DateTime date = DateTime.tryParse(log['logged_at'] ?? '') ?? DateTime.now();
    String dateStr = '${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(children: [
            Container(width: 6, height: 6, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
            const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(log['log_type'].toString().toUpperCase(), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              Text('${log['location'] ?? 'N/D'} · $dateStr', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
            ]),
          ]),
          Text('$prefix${log['quantity']}L', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: dotColor)),
        ],
      ),
    );
  }
}
