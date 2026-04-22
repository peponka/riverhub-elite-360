import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';

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
      final response = await Supabase.instance.client.from('fleet_assets')
          .select('id, name, type, fuel_capacity, status');
      final List<Map<String, dynamic>> vessels = List<Map<String, dynamic>>.from(response);
      if (vessels.isNotEmpty) {
        _vessels = vessels;
        _selectedVessel = vessels.first;
        await _fetchFuelStats(_selectedVessel!['id'], _selectedVessel!['fuel_capacity'] ?? 40000);
      } else {
        // Demo data when no vessels exist
        _vessels = [
          {'id': 'demo-1', 'name': 'TB PARAGUAY 01', 'fuel_capacity': 45000, 'type': 'Remolcador'},
          {'id': 'demo-2', 'name': 'R/M HERCULES', 'fuel_capacity': 55000, 'type': 'Remolcador'},
          {'id': 'demo-3', 'name': 'BZ ITAIPÚ', 'fuel_capacity': 8000, 'type': 'Barcaza'},
        ];
        _selectedVessel = _vessels.first;
        _currentLevel = 69; _currentAutonomy = 182; _currentEfficiency = 94;
        _fuelLogs = [
          {'log_type': 'CARGA', 'location': 'Puerto Rosario', 'quantity': 8000, 'logged_at': DateTime.now().toIso8601String()},
          {'log_type': 'CONSUMO', 'location': 'KM 1445 — Navegación', 'quantity': 450, 'logged_at': DateTime.now().subtract(const Duration(hours: 6)).toIso8601String()},
          {'log_type': 'CARGA', 'location': 'Puerto Asunción', 'quantity': 12000, 'logged_at': DateTime.now().subtract(const Duration(days: 2)).toIso8601String()},
          {'log_type': 'CONSUMO', 'location': 'KM 1380 — Convoy', 'quantity': 980, 'logged_at': DateTime.now().subtract(const Duration(days: 3)).toIso8601String()},
        ];
      }
    } catch (e) {
      debugPrint('Error: $e');
      // Fallback demo
      _vessels = [{'id': 'demo-1', 'name': 'TB PARAGUAY 01', 'fuel_capacity': 45000, 'type': 'Remolcador'}];
      _selectedVessel = _vessels.first;
      _currentLevel = 69; _currentAutonomy = 182; _currentEfficiency = 94; _fuelLogs = [];
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchFuelStats(dynamic vesselId, num capacity) async {
    try {
      final logs = await Supabase.instance.client.from('fuel_logs')
          .select('quantity, log_type, logged_at, location')
          .eq('vessel_id', vesselId)
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
      _currentLevel = _fuelLogs.isEmpty ? 0 : ((net / capacity) * 100).clamp(5, 100).round();
      _currentAutonomy = (_currentLevel * 2.6).round();
      _currentEfficiency = _fuelLogs.isEmpty ? 0 : (totalLoaded > 0 ? ((1 - (totalConsumed / totalLoaded)) * 100).clamp(0, 100).round() : 0);
    } catch (e) {
      debugPrint('Stats Error: $e');
      _currentLevel = 0; _currentAutonomy = 0; _currentEfficiency = 0; _fuelLogs = [];
    }
    if (mounted) setState(() {});
  }

  void _selectVessel() {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.4),
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
                  Text('Embarcación', style: GoogleFonts.newsreader(fontSize: 20, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                  const Spacer(),
                  GestureDetector(onTap: () => Navigator.pop(ctx), child: Icon(CupertinoIcons.xmark_circle_fill, color: AppColors.textTertiary, size: 24)),
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
                  final isSelected = _selectedVessel?['id'].toString() == v['id'].toString();
                  return GestureDetector(
                    onTap: () {
                      Navigator.pop(ctx);
                      setState(() { _selectedVessel = v; _isLoading = true; });
                      _fetchFuelStats(v['id'], v['fuel_capacity'] ?? 40000)
                          .then((_) => setState(() => _isLoading = false));
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.textPrimary.withValues(alpha: 0.06) : AppColors.backgroundSecondary,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isSelected ? AppColors.textPrimary : AppColors.separator, width: isSelected ? 1.0 : 0.5),
                      ),
                      child: Row(
                        children: [
                          Icon(CupertinoIcons.helm, size: 20, color: AppColors.textPrimary),
                          const SizedBox(width: 12),
                          Expanded(child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(v['name'] ?? '', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                              Text(v['type'] ?? 'Embarcación', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                            ],
                          )),
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

  // ─── ADD FUEL LOG ──────────────────────────────────────────────────
  void _addFuelLog() {
    final amountCtrl = TextEditingController();
    final locationCtrl = TextEditingController();
    String logType = 'CARGA';

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.65),
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
              Text('Registrar Combustible', style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
              Text(_selectedVessel?['name'] ?? '', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
              const SizedBox(height: 24),

              // Type selector
              Text('TIPO', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _typeOption('CARGA', logType, (v) => setModalState(() => logType = v)),
                  const SizedBox(width: 8),
                  _typeOption('CONSUMO', logType, (v) => setModalState(() => logType = v)),
                ],
              ),
              const SizedBox(height: 16),

              _inputField('Cantidad (litros)', amountCtrl, CupertinoIcons.drop, keyboard: TextInputType.number),
              const SizedBox(height: 12),
              _inputField('Ubicación / Puerto', locationCtrl, CupertinoIcons.location),
              const SizedBox(height: 28),

              GestureDetector(
                onTap: () async {
                  if (amountCtrl.text.isEmpty || locationCtrl.text.isEmpty) return;
                  Navigator.pop(ctx);
                  final amount = double.tryParse(amountCtrl.text) ?? 0;
                  try {
                    if (_selectedVessel != null && !_selectedVessel!['id'].toString().startsWith('demo')) {
                      await Supabase.instance.client.from('fuel_logs').insert({
                        'vessel_id': _selectedVessel!['id'],
                        'log_type': logType,
                        'quantity': amount,
                        'location': locationCtrl.text,
                        'logged_at': DateTime.now().toIso8601String(),
                      });
                    } else {
                      // Demo mode — add locally
                      _fuelLogs.insert(0, {
                        'log_type': logType, 'location': locationCtrl.text,
                        'quantity': amount, 'logged_at': DateTime.now().toIso8601String(),
                      });
                      if (logType == 'CARGA') {
                        _currentLevel = (_currentLevel + (amount / 450).round()).clamp(0, 100);
                      } else {
                        _currentLevel = (_currentLevel - (amount / 450).round()).clamp(0, 100);
                      }
                      _currentAutonomy = (_currentLevel * 2.6).round();
                    }
                    setState(() {});
                    if (_selectedVessel != null && !_selectedVessel!['id'].toString().startsWith('demo')) {
                      _fetchFuelStats(_selectedVessel!['id'], _selectedVessel!['fuel_capacity'] ?? 40000);
                    }
                  } catch (e) { debugPrint('Error: $e'); }
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                  child: Center(child: Text('Confirmar Registro', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.backgroundPrimary))),
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _typeOption(String value, String current, ValueChanged<String> onTap) {
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
          child: Center(child: Text(value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: selected ? AppColors.backgroundPrimary : AppColors.textSecondary, letterSpacing: 0.5))),
        ),
      ),
    );
  }

  Widget _inputField(String placeholder, TextEditingController ctrl, IconData icon, {TextInputType keyboard = TextInputType.text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(border: Border.all(color: AppColors.separator, width: 0.5), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(child: CupertinoTextField(
            controller: ctrl, placeholder: placeholder, keyboardType: keyboard,
            placeholderStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textTertiary),
            style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
            decoration: const BoxDecoration(), padding: const EdgeInsets.symmetric(vertical: 12),
          )),
        ],
      ),
    );
  }

  // ─── BUILD ─────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text('Combustible', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: _addFuelLog, child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: _isLoading && _vessels.isEmpty
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text('Combustible', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('& Energía.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 20),

                  // ── Vessel selector (tap to open) ──────────────
                  GestureDetector(
                    onTap: _selectVessel,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundSecondary,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.separator, width: 0.5),
                      ),
                      child: Row(
                        children: [
                          Icon(CupertinoIcons.helm, size: 18, color: AppColors.textPrimary),
                          const SizedBox(width: 12),
                          Expanded(child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_selectedVessel?['name'] ?? 'Seleccionar...', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                              Text(_selectedVessel?['type'] ?? '', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                            ],
                          )),
                          Icon(CupertinoIcons.chevron_down, size: 16, color: AppColors.textSecondary),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Fuel Level Gauge ───────────────────────────
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
                        const SizedBox(height: 12),
                        // Visual gauge bar
                        _buildFuelGauge(_currentLevel),
                        const SizedBox(height: 16),
                        Text('$_currentLevel%', style: GoogleFonts.newsreader(fontSize: 52, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1)),
                        const SizedBox(height: 4),
                        Text(
                          _currentLevel > 70 ? 'ÓPTIMO' : _currentLevel > 30 ? 'NORMAL' : _currentLevel > 0 ? 'BAJO' : 'SIN DATOS',
                          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1),
                        ),
                        const SizedBox(height: 20),
                        Container(height: 0.5, color: AppColors.separator),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _stat('AUTONOMÍA', '$_currentAutonomy hrs'),
                            Container(width: 0.5, height: 30, color: AppColors.separator),
                            _stat('EFICIENCIA', '$_currentEfficiency%'),
                            Container(width: 0.5, height: 30, color: AppColors.separator),
                            _stat('CAPACIDAD', '${((_selectedVessel?['fuel_capacity'] ?? 40000) / 1000).round()}k L'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // ── Fuel Logs ──────────────────────────────────
                  Row(
                    children: [
                      Text('REGISTRO', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                      const Spacer(),
                      Text('${_fuelLogs.length} entradas', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_fuelLogs.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(CupertinoIcons.drop, size: 36, color: AppColors.textTertiary),
                          const SizedBox(height: 12),
                          Text('Sin registros', style: GoogleFonts.newsreader(fontSize: 18, color: AppColors.textSecondary)),
                          const SizedBox(height: 4),
                          Text('Agregá una carga con el botón +', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary)),
                        ],
                      ),
                    )
                  else
                    ..._fuelLogs.map((log) => _logItem(log)),
                ],
              ),
      ),
    );
  }

  // ── Visual fuel gauge bar ──────────────────────────────────────────
  Widget _buildFuelGauge(int level) {
    final double fraction = level / 100.0;
    return Container(
      height: 12,
      decoration: BoxDecoration(
        color: AppColors.textPrimary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(6),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          return Stack(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 600),
                curve: Curves.easeOutCubic,
                width: constraints.maxWidth * fraction,
                height: 12,
                decoration: BoxDecoration(
                  color: level > 50
                      ? AppColors.textPrimary
                      : level > 20
                          ? AppColors.textSecondary
                          : AppColors.error,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _stat(String title, String val) {
    return Column(children: [
      Text(title, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
      const SizedBox(height: 4),
      Text(val, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
    ]);
  }

  Widget _logItem(Map<String, dynamic> log) {
    String type = (log['log_type'] ?? '').toString().toUpperCase();
    bool isLoad = type == 'CARGA' || type == 'LOAD';
    String prefix = isLoad ? '+' : '-';
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
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: AppColors.textPrimary.withValues(alpha: isLoad ? 0.08 : 0.04),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(child: Icon(
              isLoad ? CupertinoIcons.arrow_down : CupertinoIcons.arrow_up,
              size: 16, color: AppColors.textPrimary,
            )),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(type, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              Text('${log['location'] ?? 'N/D'} · $dateStr', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
            ],
          )),
          Text('$prefix${log['quantity']}L', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
