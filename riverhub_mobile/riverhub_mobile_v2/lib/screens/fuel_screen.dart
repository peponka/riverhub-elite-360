import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class FuelScreen extends StatefulWidget {
  const FuelScreen({super.key});

  @override
  State<FuelScreen> createState() => _FuelScreenState();
}

class _FuelScreenState extends State<FuelScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _vessels = [];
  List<Map<String, dynamic>> _fuelLogs = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      // Fetch all vessels
      final vesselRes = await Supabase.instance.client.from('vessels')
          .select('id, name, type, status');
      _vessels = List<Map<String, dynamic>>.from(vesselRes);

      // Fetch ALL fuel logs
      final logsRes = await Supabase.instance.client.from('fuel_logs')
          .select('id, vessel_id, vessel_name, quantity, log_type, location, logged_at')
          .order('logged_at', ascending: false)
          .limit(50);
      _fuelLogs = List<Map<String, dynamic>>.from(logsRes);

      // If no fuel logs exist, show demo data
      if (_fuelLogs.isEmpty && _vessels.isNotEmpty) {
        _fuelLogs = _buildDemoLogs();
      }
    } catch (e) {
      debugPrint('FuelScreen error: $e');
      _vessels = [];
      _fuelLogs = _buildDemoLogs();
    }
    if (mounted) setState(() => _isLoading = false);
  }

  List<Map<String, dynamic>> _buildDemoLogs() {
    return [
      {'vessel_name': 'R/M ATLAS', 'quantity': 12000, 'log_type': 'CARGA', 'logged_at': '2026-05-07T10:00:00Z'},
      {'vessel_name': 'B/T PARANÁ', 'quantity': 12000, 'log_type': 'CARGA', 'logged_at': '2026-05-07T10:00:00Z'},
      {'vessel_name': 'R/M DELTA', 'quantity': 15000, 'log_type': 'CARGA', 'logged_at': '2026-05-08T10:00:00Z'},
      {'vessel_name': 'B/T IGUAZÚ', 'quantity': 15000, 'log_type': 'CARGA', 'logged_at': '2026-05-08T10:00:00Z'},
      {'vessel_name': 'R/M HIDROVÍA', 'quantity': 8500, 'log_type': 'CARGA', 'logged_at': '2026-05-01T10:00:00Z'},
      {'vessel_name': 'R/M ATLAS', 'quantity': 8500, 'log_type': 'CARGA', 'logged_at': '2026-04-25T10:00:00Z'},
      {'vessel_name': 'B/T PARANÁ', 'quantity': 6000, 'log_type': 'CARGA', 'logged_at': '2026-05-01T10:00:00Z'},
      {'vessel_name': 'R/M DELTA', 'quantity': 6000, 'log_type': 'CARGA', 'logged_at': '2026-04-28T10:00:00Z'},
      {'vessel_name': 'B/T IGUAZÚ', 'quantity': 9200, 'log_type': 'CARGA', 'logged_at': '2026-04-28T10:00:00Z'},
      {'vessel_name': 'R/M HIDROVÍA', 'quantity': 9200, 'log_type': 'CARGA', 'logged_at': '2026-04-16T10:00:00Z'},
      {'vessel_name': 'R/M ATLAS', 'quantity': 11000, 'log_type': 'CARGA', 'logged_at': '2026-04-20T10:00:00Z'},
      {'vessel_name': 'B/T PARANÁ', 'quantity': 11000, 'log_type': 'CARGA', 'logged_at': '2026-04-20T10:00:00Z'},
      {'vessel_name': 'R/M DELTA', 'quantity': 7800, 'log_type': 'CARGA', 'logged_at': '2026-04-18T10:00:00Z'},
      {'vessel_name': 'B/T IGUAZÚ', 'quantity': 7800, 'log_type': 'CARGA', 'logged_at': '2026-04-18T10:00:00Z'},
      {'vessel_name': 'R/M HIDROVÍA', 'quantity': 13500, 'log_type': 'CARGA', 'logged_at': '2026-04-10T10:00:00Z'},
      {'vessel_name': 'R/M ATLAS', 'quantity': 13500, 'log_type': 'CARGA', 'logged_at': '2026-04-10T10:00:00Z'},
    ];
  }

  String _vesselNameFromLog(Map<String, dynamic> log) {
    // Try vessel_name first, then look up by vessel_id
    if (log['vessel_name'] != null && log['vessel_name'].toString().isNotEmpty) {
      return log['vessel_name'];
    }
    final vesselId = log['vessel_id'];
    if (vesselId != null) {
      final match = _vessels.where((v) => v['id'].toString() == vesselId.toString());
      if (match.isNotEmpty) return match.first['name'] ?? '-';
    }
    return '-';
  }

  void _addFuelLog() {
    final amountCtrl = TextEditingController();
    final locationCtrl = TextEditingController();
    String logType = 'CARGA';
    Map<String, dynamic>? selectedVessel = _vessels.isNotEmpty ? _vessels.first : null;

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
              Text(LocaleService.t('fuel_register'), style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
              Text('COMBUSTIBLE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
              const SizedBox(height: 20),

              // Vessel selector
              Text(LocaleService.t('fuel_select_vessel'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () {
                  if (_vessels.isEmpty) return;
                  showCupertinoModalPopup(
                    context: ctx,
                    builder: (innerCtx) => Container(
                      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.4),
                      decoration: BoxDecoration(color: AppColors.backgroundPrimary, borderRadius: const BorderRadius.vertical(top: Radius.circular(20))),
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
                          child: Row(children: [
                            Text(LocaleService.t('fuel_select_vessel'), style: GoogleFonts.newsreader(fontSize: 20, color: AppColors.textPrimary)),
                            const Spacer(),
                            GestureDetector(onTap: () => Navigator.pop(innerCtx), child: Icon(CupertinoIcons.xmark_circle_fill, color: AppColors.textTertiary, size: 24)),
                          ]),
                        ),
                        Flexible(child: ListView.builder(
                          shrinkWrap: true, itemCount: _vessels.length,
                          itemBuilder: (_, i) {
                            final v = _vessels[i];
                            return GestureDetector(
                              onTap: () { Navigator.pop(innerCtx); setModalState(() => selectedVessel = v); },
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.separator, width: 0.5)),
                                child: Row(children: [
                                  Icon(CupertinoIcons.helm, size: 18, color: AppColors.textPrimary),
                                  const SizedBox(width: 12),
                                  Text(v['name'] ?? '-', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                                ]),
                              ),
                            );
                          },
                        )),
                      ]),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.separator, width: 0.5)),
                  child: Row(children: [
                    Icon(CupertinoIcons.helm, size: 18, color: selectedVessel != null ? AppColors.textPrimary : AppColors.textTertiary),
                    const SizedBox(width: 12),
                    Expanded(child: Text(selectedVessel?['name'] ?? 'Seleccionar embarcación', style: GoogleFonts.inter(fontSize: 14, color: selectedVessel != null ? AppColors.textPrimary : AppColors.textTertiary))),
                    Icon(CupertinoIcons.chevron_down, size: 16, color: AppColors.textSecondary),
                  ]),
                ),
              ),
              const SizedBox(height: 16),

              Text(LocaleService.t('fuel_type_label'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
              const SizedBox(height: 8),
              Row(children: [
                _typeOption(LocaleService.t('fuel_load'), 'CARGA', logType, (v) => setModalState(() => logType = v)),
                const SizedBox(width: 8),
                _typeOption(LocaleService.t('fuel_consumption'), 'CONSUMO', logType, (v) => setModalState(() => logType = v)),
              ]),
              const SizedBox(height: 16),

              _inputField(LocaleService.t('fuel_quantity'), amountCtrl, CupertinoIcons.drop, keyboard: TextInputType.number),
              const SizedBox(height: 12),
              _inputField(LocaleService.t('fuel_location'), locationCtrl, CupertinoIcons.location),
              const SizedBox(height: 28),

              GestureDetector(
                onTap: () async {
                  if (amountCtrl.text.isEmpty || selectedVessel == null) return;
                  Navigator.pop(ctx);
                  final amount = double.tryParse(amountCtrl.text) ?? 0;
                  try {
                    if (!selectedVessel!['id'].toString().startsWith('demo')) {
                      await Supabase.instance.client.from('fuel_logs').insert({
                        'vessel_id': selectedVessel!['id'],
                        'vessel_name': selectedVessel!['name'] ?? '',
                        'log_type': logType,
                        'quantity': amount,
                        'location': locationCtrl.text,
                        'logged_at': DateTime.now().toIso8601String(),
                      });
                    }
                    _fetchData();
                  } catch (e) { debugPrint('Error: $e'); }
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                  child: Center(child: Text(LocaleService.t('fuel_confirm_register'), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.backgroundPrimary))),
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _typeOption(String label, String value, String current, ValueChanged<String> onTap) {
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
          child: Center(child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: selected ? AppColors.backgroundPrimary : AppColors.textSecondary, letterSpacing: 0.5))),
        ),
      ),
    );
  }

  Widget _inputField(String placeholder, TextEditingController ctrl, IconData icon, {TextInputType keyboard = TextInputType.text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(border: Border.all(color: AppColors.separator, width: 0.5), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Icon(icon, size: 18, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(child: CupertinoTextField(
          controller: ctrl, placeholder: placeholder, keyboardType: keyboard,
          placeholderStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textTertiary),
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
          decoration: const BoxDecoration(), padding: const EdgeInsets.symmetric(vertical: 12),
        )),
      ]),
    );
  }

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
        middle: Text(LocaleService.t('fuel_title'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: _addFuelLog, child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                children: [
                  // Header
                  Text(LocaleService.t('fuel_header1'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text(LocaleService.t('fuel_header2'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 8),
                  Text('${_fuelLogs.length} registros', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                  const SizedBox(height: 20),

                  // Grid of fuel cards — 2 columns like the web
                  if (_fuelLogs.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(40),
                      child: Column(children: [
                        Icon(CupertinoIcons.drop, size: 36, color: AppColors.textTertiary),
                        const SizedBox(height: 12),
                        Text(LocaleService.t('fuel_no_records'), style: GoogleFonts.newsreader(fontSize: 18, color: AppColors.textSecondary)),
                        const SizedBox(height: 4),
                        Text(LocaleService.t('fuel_add_hint'), style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary)),
                      ]),
                    )
                  else
                    ..._buildGrid(),
                ],
              ),
      ),
    );
  }

  List<Widget> _buildGrid() {
    final List<Widget> rows = [];
    for (int i = 0; i < _fuelLogs.length; i += 2) {
      rows.add(Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _fuelCard(_fuelLogs[i])),
          const SizedBox(width: 10),
          if (i + 1 < _fuelLogs.length)
            Expanded(child: _fuelCard(_fuelLogs[i + 1]))
          else
            const Expanded(child: SizedBox()),
        ],
      ));
      rows.add(const SizedBox(height: 10));
    }
    return rows;
  }

  Widget _fuelCard(Map<String, dynamic> log) {
    final String vesselName = _vesselNameFromLog(log);
    final num quantity = log['quantity'] ?? 0;
    final String logType = (log['log_type'] ?? 'CARGA').toString().toUpperCase();
    final DateTime date = DateTime.tryParse(log['logged_at'] ?? '') ?? DateTime.now();
    final String dateStr = '${date.day.toString().padLeft(2, '0')} ${_monthName(date.month)} ${date.year}';
    final bool isLoad = logType == 'CARGA' || logType == 'LOAD';

    // Format quantity with dots for thousands
    final String qtyStr = _formatNumber(quantity.toInt());

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Fuel icon
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 34, height: 34,
                decoration: BoxDecoration(
                  color: isLoad ? AppColors.accent.withValues(alpha: 0.1) : AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(child: Icon(
                  CupertinoIcons.drop_fill,
                  size: 16,
                  color: isLoad ? AppColors.accent : AppColors.error,
                )),
              ),
              Icon(CupertinoIcons.delete, size: 14, color: AppColors.textTertiary),
            ],
          ),
          const SizedBox(height: 14),

          // Vessel name with helm icon
          Row(children: [
            Icon(CupertinoIcons.helm, size: 12, color: AppColors.accent),
            const SizedBox(width: 5),
            Expanded(child: Text(
              vesselName,
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              overflow: TextOverflow.ellipsis,
            )),
          ]),
          const SizedBox(height: 8),

          // Quantity — large number
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(qtyStr, style: GoogleFonts.newsreader(fontSize: 26, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1)),
              const SizedBox(width: 4),
              Text('litros', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
            ],
          ),
          const SizedBox(height: 10),

          // Fuel type badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'DIESEL MARINE',
              style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.accent, letterSpacing: 0.5),
            ),
          ),
          const SizedBox(height: 8),

          // Date
          Row(children: [
            Icon(CupertinoIcons.calendar, size: 11, color: AppColors.textTertiary),
            const SizedBox(width: 4),
            Text(dateStr, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textTertiary)),
          ]),
        ],
      ),
    );
  }

  String _formatNumber(int n) {
    final str = n.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write('.');
      buffer.write(str[i]);
    }
    return buffer.toString();
  }

  String _monthName(int m) {
    const months = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return months[m.clamp(1, 12)];
  }
}
