import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show RefreshIndicator;
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  // Fleet KPIs
  int _activeVessels = 0;
  int _dockedVessels = 0;
  int _totalVessels = 0;
  int _maintenance = 0;
  int _alerts = 0;
  double _fuelTotal = 0;
  int _fuelRecords = 0;
  int _crewCount = 0;
  bool _isLoading = true;

  // Sync timer
  int _syncSeconds = 0;
  Timer? _syncTimer;

  // Weather
  String _weatherDesc = '...';
  int _temp = 0;
  int _wind = 0;
  int _humidity = 0;

  // Hydro
  final String _hydroASU = '--';
  final String _hydroPIL = '--';
  final String _hydroROS = '--';

  // Vessels list
  List<Map<String, dynamic>> _vessels = [];
  int _selectedVesselIdx = -1;

  // Activity
  List<Map<String, dynamic>> _activity = [];

  // Viajes
  int _viajesActivos = 0;
  int _viajesCompletados = 0;

  // Sync counter — use ValueNotifier to avoid full rebuild every second
  final ValueNotifier<int> _syncNotifier = ValueNotifier<int>(0);

  @override
  void initState() {
    super.initState();
    _loadAll();
    _syncTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _syncNotifier.value++;
    });
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    _syncNotifier.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    await Future.wait([
      _fetchFleetStats(),
      _fetchWeather(),
      _fetchFuelSummary(),
      _fetchViajesSummary(),
      _fetchActivity(),
      _fetchCrew(),
    ]);
    if (mounted) {
      setState(() {
      _isLoading = false;
      _syncNotifier.value = 0;
    });
    }
  }

  Future<void> _fetchFleetStats() async {
    try {
      final response = await Supabase.instance.client.from('vessels').select('*');
      int active = 0, docked = 0, maint = 0;
      for (var v in response) {
        final s = (v['status'] ?? '').toString().toLowerCase();
        if (s == LocaleService.t('dyn_key_94') || s == 'active' || s == 'navegando' || s == 'en_viaje') {
          active++;
        } else if (s.contains('manten')) maint++;
        else docked++;
      }
      final logs = await Supabase.instance.client
          .from('logs').select('action_type').eq('action_type', 'alert').limit(10);
      if (mounted) {
        setState(() {
        _activeVessels = active;
        _dockedVessels = docked;
        _totalVessels = response.length;
        _maintenance = maint;
        _alerts = logs.length;
        _vessels = List<Map<String, dynamic>>.from(response);
        if (_vessels.isNotEmpty) _selectedVesselIdx = 0;
      });
      }
    } catch (e) {
      debugPrint('Fleet: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchWeather() async {
    try {
      final url = Uri.parse('https://api.open-meteo.com/v1/forecast?latitude=-25.286&longitude=-57.647&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&timezone=America/Asuncion');
      final res = await http.get(url);
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final c = data['current'];
        if (c != null && mounted) {
          final codes = {0: LocaleService.t('dyn_key_95'), 1: 'Mayorm. despejado', 2: LocaleService.t('dyn_key_104'), 3: LocaleService.t('dyn_key_93'), 45: LocaleService.t('dyn_key_103'), 51: LocaleService.t('dyn_key_101'), 61: LocaleService.t('dyn_key_96'), 80: LocaleService.t('dyn_key_102'), 95: LocaleService.t('dyn_key_99')};
          setState(() {
            _weatherDesc = codes[c['weather_code']] ?? 'Variado';
            _temp = (c['temperature_2m'] ?? 0).round();
            _wind = (c['wind_speed_10m'] ?? 0).round();
            _humidity = (c['relative_humidity_2m'] ?? 0).round();
          });
        }
      }
    } catch (e) { debugPrint('Weather: $e'); }
  }

  Future<void> _fetchFuelSummary() async {
    try {
      final r = await Supabase.instance.client.from('fuel_logs').select('liters').limit(50);
      if (r.isNotEmpty && mounted) {
        final total = r.fold<double>(0, (sum, x) => sum + ((x['liters'] ?? 0) as num).toDouble());
        setState(() { _fuelTotal = total / 1000; _fuelRecords = r.length; });
      }
    } catch (e) { debugPrint('Fuel: $e'); }
  }

  Future<void> _fetchViajesSummary() async {
    try {
      final r = await Supabase.instance.client.from('voyages').select('status');
      if (mounted) {
        final nav = r.where((v) { final s = (v['status'] ?? '').toString().toLowerCase(); return s == 'navegando' || s == 'en_curso' || s == LocaleService.t('dyn_key_94'); }).length;
        setState(() { _viajesActivos = nav; _viajesCompletados = r.length - nav; });
      }
    } catch (e) { debugPrint('Viajes: $e'); }
  }

  Future<void> _fetchActivity() async {
    try {
      final r = await Supabase.instance.client.from('logs').select('*').order('created_at', ascending: false).limit(5);
      if (mounted) setState(() => _activity = List<Map<String, dynamic>>.from(r));
    } catch (e) { debugPrint('Activity: $e'); }
  }

  Future<void> _fetchCrew() async {
    try {
      final r = await Supabase.instance.client.from('crew').select('id').limit(100);
      if (mounted) setState(() => _crewCount = r.length);
    } catch (e) { debugPrint('Crew: $e'); }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary),
          onPressed: () => rootScaffoldKey.currentState?.openDrawer(),
        ),
        middle: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(CupertinoIcons.drop_fill, size: 14, color: AppColors.textPrimary),
            const SizedBox(width: 6),
            Text('ViaBarcazas', style: GoogleFonts.newsreader(fontSize: 18, fontWeight: FontWeight.w500, fontStyle: FontStyle.italic, color: AppColors.textPrimary)),
            // Language pill in nav bar
            const SizedBox(width: 6),
            GestureDetector(
              onTap: () { LocaleService.toggle(); },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(LocaleService.current.toUpperCase(), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.textSecondary, letterSpacing: 0.5)),
              ),
            ),
          ],
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Icon(CupertinoIcons.bell, size: 22, color: AppColors.textSecondary),
          onPressed: () {},
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : RefreshIndicator(
                onRefresh: _loadAll,
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  children: [
                    // ── Status Bar ──────────────────────────────
                    _buildStatusBar(),
                    const SizedBox(height: 16),

                    // ── 5 KPI Row 1 ────────────────────────────
                    Row(children: [
                      Expanded(child: _kpiCardNew(LocaleService.t('dash_active_fleet'), '$_activeVessels', '/ $_totalVessels', CupertinoIcons.paperplane_fill, AppColors.accent, '↑ ${_totalVessels > 0 ? ((_activeVessels / _totalVessels) * 100).round() : 0}% ${LocaleService.t('dash_disp')}')),
                      const SizedBox(width: 8),
                      Expanded(child: _kpiCardNew(LocaleService.t('dash_alarms'), _maintenance > 0 ? '$_maintenance' : '00', '', CupertinoIcons.exclamationmark_triangle_fill, AppColors.warning, LocaleService.t('dash_attention'))),
                    ]),
                    const SizedBox(height: 8),

                    // ── 5 KPI Row 2 ────────────────────────────
                    Row(children: [
                      Expanded(child: _kpiCardNew(LocaleService.t('dash_consumption'), _fuelTotal > 0 ? _fuelTotal.toStringAsFixed(1) : '42.5', 'kL', CupertinoIcons.flame_fill, Color(0xFFF97316), '$_fuelRecords ${LocaleService.t('dash_records')}')),
                      const SizedBox(width: 8),
                      Expanded(child: _kpiCardNew(LocaleService.t('dash_min_draft'), '10.2', LocaleService.t('dash_feet'), CupertinoIcons.arrow_down_to_line, AppColors.accent, '${LocaleService.t('dash_margin')} 0.4\'')),
                    ]),
                    const SizedBox(height: 8),

                    // ── Efficiency + Crew Row ──────────────────
                    Row(children: [
                      Expanded(child: _kpiCardNew(LocaleService.t('dash_efficiency'), '92', '%', CupertinoIcons.graph_circle_fill, AppColors.success, LocaleService.t('dash_best_month'))),
                      const SizedBox(width: 8),
                      Expanded(child: _kpiCardNew(LocaleService.t('dash_crew'), '$_crewCount', '', CupertinoIcons.person_2_fill, Color(0xFF06B6D4), LocaleService.t('dash_crew_active'))),
                    ]),

                    const SizedBox(height: 20),

                    // ── Weather + Hydro ────────────────────────
                    Row(children: [
                      Expanded(child: _weatherCard()),
                      const SizedBox(width: 8),
                      Expanded(child: _hydroCard()),
                    ]),

                    const SizedBox(height: 20),

                    // ── Live Vessels ──────────────────────────
                    _sectionTitle(LocaleService.t('dash_live_vessels'), '${_vessels.length} ${LocaleService.t('dash_monitored')}'),
                    const SizedBox(height: 10),
                    ..._vessels.take(6).toList().asMap().entries.map((e) => _vesselRow(e.key, e.value)),

                    // ── Selected Vessel Detail ────────────────
                    if (_selectedVesselIdx >= 0 && _selectedVesselIdx < _vessels.length) ...[
                      const SizedBox(height: 16),
                      _vesselDetail(_vessels[_selectedVesselIdx]),
                    ],

                    const SizedBox(height: 20),

                    // ── Quick Info Cards ─────────────────────
                    _sectionTitle(LocaleService.t('dash_operations'), ''),
                    const SizedBox(height: 10),
                    _infoCard(icon: CupertinoIcons.calendar, title: LocaleService.t('dash_active_trips'), subtitle: '$_viajesActivos ${LocaleService.t('dash_in_progress')}, $_viajesCompletados ${LocaleService.t('dash_completed')}'),
                    const SizedBox(height: 8),

                    // ── Activity Feed ────────────────────────
                    if (_activity.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _sectionTitle(LocaleService.t('dash_recent_activity'), ''),
                      const SizedBox(height: 10),
                      ..._activity.map(_activityItem),
                    ],
                    const SizedBox(height: 30),
                  ],
                ),
              ),
      ),
    );
  }

  // ── Status Bar ────────────────────────────────────────
  Widget _buildStatusBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: AppColors.success, shape: BoxShape.circle)),
        const SizedBox(width: 8),
        Expanded(
          child: ValueListenableBuilder<int>(
            valueListenable: _syncNotifier,
            builder: (context, syncSeconds, child) {
              return Text(
                '${LocaleService.t('dash_synced')} · ${syncSeconds}s',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5),
              );
            },
          ),
        ),
        Text(
          '${LocaleService.t('dash_week')} ${_weekNumber()}',
          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5),
        ),
      ]),
    );
  }

  int _weekNumber() {
    final now = DateTime.now();
    final start = DateTime(now.year, 1, 1);
    return ((now.difference(start).inDays + start.weekday) / 7).ceil();
  }

  // ── KPI Card New ──────────────────────────────────────
  Widget _kpiCardNew(String label, String value, String unit, IconData icon, Color color, String sub) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
            Icon(icon, size: 14, color: color.withValues(alpha: 0.5)),
          ]),
          const SizedBox(height: 8),
          Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
            Text(value, style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1)),
            if (unit.isNotEmpty) ...[
              const SizedBox(width: 4),
              Text(unit, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
            ],
          ]),
          const SizedBox(height: 6),
          Text(sub, style: GoogleFonts.inter(fontSize: 10, color: color, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  // ── Weather Card ──────────────────────────────────────
  Widget _weatherCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(CupertinoIcons.sun_max_fill, size: 20, color: Color(0xFFF59E0B)),
          const SizedBox(width: 8),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('METEO · ASU', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
            Text(_weatherDesc, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
        ]),
        const SizedBox(height: 10),
        Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
          _miniStat('🌡️', '$_temp°C'),
          _miniStat('💨', '$_wind km/h'),
          _miniStat('💧', '$_humidity%'),
        ]),
      ]),
    );
  }

  // ── Hydro Card ────────────────────────────────────────
  Widget _hydroCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(CupertinoIcons.drop_fill, size: 20, color: AppColors.accent),
          const SizedBox(width: 8),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(LocaleService.t('dyn_key_97'), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
            Text(LocaleService.t('dyn_key_98'), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
          ]),
        ]),
        const SizedBox(height: 10),
        Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
          _miniStat('ASU', '2.45m'),
          _miniStat('PIL', '3.12m'),
          _miniStat('ROS', '1.87m'),
        ]),
      ]),
    );
  }

  Widget _miniStat(String label, String val) {
    return Column(children: [
      Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
      const SizedBox(height: 2),
      Text(val, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
    ]);
  }

  // ── Section Title ─────────────────────────────────────
  Widget _sectionTitle(String title, String trailing) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(title, style: GoogleFonts.newsreader(fontSize: 20, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
      if (trailing.isNotEmpty) Text(trailing, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
    ]);
  }

  // ── Vessel Row ────────────────────────────────────────
  Widget _vesselRow(int idx, Map<String, dynamic> v) {
    final s = (v['status'] ?? '').toString().toLowerCase();
    final isActive = s == LocaleService.t('dyn_key_94') || s == 'active' || s == 'navegando' || s == 'en_viaje';
    final isMaint = s.contains('manten');
    final color = isActive ? AppColors.success : isMaint ? AppColors.warning : AppColors.accent;
    final statusLabel = isActive ? LocaleService.t('dash_navigating') : isMaint ? LocaleService.t('dash_attention_status') : LocaleService.t('dash_in_port_status');
    final name = v['name'] ?? v['vessel_name'] ?? 'Vessel';
    final type = (v['type'] ?? v['vessel_type'] ?? 'REM').toString();
    final loc = (v['location'] ?? v['current_position'] ?? 'ASU').toString();
    final isSelected = idx == _selectedVesselIdx;

    return GestureDetector(
      onTap: () => setState(() => _selectedVesselIdx = idx),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.06) : AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? color.withValues(alpha: 0.3) : AppColors.separator, width: isSelected ? 1 : 0.5),
        ),
        child: Row(children: [
          Container(width: 4, height: 32, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            const SizedBox(height: 2),
            Text('${type.length > 3 ? type.substring(0, 3).toUpperCase() : type.toUpperCase()} · ${loc.length > 3 ? loc.substring(0, 3).toUpperCase() : loc.toUpperCase()} · ${isActive ? '—' : '0 KN'}',
                style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
            child: Text(statusLabel, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5)),
          ),
        ]),
      ),
    );
  }

  // ── Vessel Detail ─────────────────────────────────────
  Widget _vesselDetail(Map<String, dynamic> v) {
    final s = (v['status'] ?? '').toString().toLowerCase();
    final isActive = s == LocaleService.t('dyn_key_94') || s == 'active' || s == 'navegando' || s == 'en_viaje';
    final name = v['name'] ?? v['vessel_name'] ?? '--';
    final loc = v['location'] ?? v['current_position'] ?? 'ASU';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('${LocaleService.t('dash_selected')} · IMO ${v['imo'] ?? v['id'] ?? '--'}',
            style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
        const SizedBox(height: 6),
        Text(name, style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        Text('$loc → ${v['destination'] ?? 'MPA'}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: _detailStat(LocaleService.t('dash_convoy'), isActive ? '4+1' : '--')),
          Expanded(child: _detailStat(LocaleService.t('dash_fuel'), isActive ? '68%' : '--')),
          Expanded(child: _detailStat(LocaleService.t('dash_eta'), isActive ? '+14h 22m' : LocaleService.t('dash_in_port'))),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: CupertinoButton(
            padding: const EdgeInsets.symmetric(vertical: 10),
            color: AppColors.backgroundPrimary,
            borderRadius: BorderRadius.circular(8),
            child: Text(LocaleService.t('dash_logbook'), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            onPressed: () {},
          )),
          const SizedBox(width: 8),
          Expanded(child: CupertinoButton(
            padding: const EdgeInsets.symmetric(vertical: 10),
            color: AppColors.backgroundPrimary,
            borderRadius: BorderRadius.circular(8),
            child: Text(LocaleService.t('dash_contact'), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            onPressed: () {},
          )),
        ]),
      ]),
    );
  }

  Widget _detailStat(String label, String value) {
    return Column(children: [
      Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
      const SizedBox(height: 4),
      Text(value, style: GoogleFonts.newsreader(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
    ]);
  }

  // ── Activity Item ─────────────────────────────────────
  Widget _activityItem(Map<String, dynamic> log) {
    final t = log['created_at'] != null ? DateTime.tryParse(log['created_at'].toString()) : null;
    final timeStr = t != null ? '${t.day}/${t.month} ${t.hour}:${t.minute.toString().padLeft(2, '0')}' : '';
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Container(
          width: 30, height: 30,
          decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(CupertinoIcons.bolt_fill, size: 14, color: AppColors.accent),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(log['title'] ?? log['action_type'] ?? LocaleService.t('dyn_key_100'), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
          Text(log['description'] ?? log['details'] ?? '', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
        ])),
        Text(timeStr, style: GoogleFonts.inter(fontSize: 9, color: AppColors.textSecondary)),
      ]),
    );
  }

  // ── Info Card ─────────────────────────────────────────
  Widget _infoCard({required IconData icon, required String title, required String subtitle}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Icon(icon, color: AppColors.textSecondary, size: 20),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        ])),
        Icon(CupertinoIcons.chevron_right, size: 14, color: AppColors.separator),
      ]),
    );
  }
}
