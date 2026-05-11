import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class MonitoringScreen extends StatefulWidget {
  const MonitoringScreen({super.key});
  @override
  State<MonitoringScreen> createState() => _MonitoringScreenState();
}

class _MonitoringScreenState extends State<MonitoringScreen> {
  List<Map<String, dynamic>> _alerts = [];
  List<Map<String, dynamic>> _geofences = [];

  @override
  void initState() { super.initState(); _loadData(); }

  Future<void> _loadData() async {
    final alertsData = await SupabaseService.getAlerts();
    final geoData = await SupabaseService.getGeofences();
    if (!mounted) return;
    setState(() {
      _alerts = alertsData.isNotEmpty
          ? alertsData.map((a) => {
              'type': a['type'] ?? 'ALERT',
              'vessel': a['vessel_name'] ?? '-',
              'loc': a['location'] ?? '-',
              'draft': a['draft'] ?? 0,
              'depth': a['depth'] ?? 0,
              'time': a['created_at']?.toString().substring(11, 16) ?? '-',
              'severity': a['severity'] ?? 'info',
            }).toList()
          : [];
      _geofences = geoData.isNotEmpty
          ? geoData.map((g) => {
              'name': g['name'] ?? LocaleService.t('dyn_key_113'),
              'minDepth': g['min_depth'] ?? 0,
              'status': g['status'] ?? 'active',
            }).toList()
          : [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: const Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text(LocaleService.t('dyn_key_175'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Centro de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Monitoreo', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 6),
            Text('VIGILANCIA OPERATIVA', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 20),

            // KPIs
            Row(children: [
              _kpi('${_alerts.length}', LocaleService.t('dyn_key_92'), CupertinoIcons.exclamationmark_triangle_fill, AppColors.error),
              const SizedBox(width: 8),
              _kpi('${_geofences.where((g) => g['status'] == 'active').length}', 'GEOFENCES', CupertinoIcons.map_pin_ellipse, AppColors.success),
              const SizedBox(width: 8),
              _kpi('30s', 'POLLING', CupertinoIcons.antenna_radiowaves_left_right, AppColors.accent),
            ]),
            const SizedBox(height: 24),

            // Alerts
            _sectionTitle(LocaleService.t('dyn_key_174'), '${_alerts.length} activas'),
            const SizedBox(height: 12),
            if (_alerts.isEmpty)
              _emptyState(CupertinoIcons.checkmark_shield, 'Sin alertas activas', 'Todos los sistemas operativos')
            else
              ..._alerts.map((a) => _alertCard(a)),
            const SizedBox(height: 20),

            // Geofences
            _sectionTitle(LocaleService.t('dyn_key_177'), '${_geofences.length} zonas'),
            const SizedBox(height: 12),
            if (_geofences.isEmpty)
              _emptyState(CupertinoIcons.map, 'Sin geofences', 'Configure zonas de control')
            else
              ..._geofences.map((g) => _geofenceCard(g)),
            const SizedBox(height: 20),

            // UKC Calculator
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(LocaleService.t('dyn_key_179'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(child: _infoBox(LocaleService.t('dyn_key_176'), '3.2 m')),
                  const SizedBox(width: 10),
                  Expanded(child: _infoBox(LocaleService.t('dyn_key_178'), '3.5 m')),
                ]),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.warning.withValues(alpha: 0.2), width: 0.5),
                  ),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(CupertinoIcons.exclamationmark_triangle_fill, color: AppColors.warning, size: 16),
                    const SizedBox(width: 8),
                    Text('PELIGRO: BAJO UKC (0.3m)', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.warning)),
                  ]),
                ),
              ]),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String val, String label, IconData icon, Color color) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
          Icon(icon, size: 12, color: color.withValues(alpha: 0.5)),
        ]),
        const SizedBox(height: 8),
        Text(val, style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1)),
      ]),
    ));
  }

  Widget _sectionTitle(String title, String trailing) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(title, style: GoogleFonts.newsreader(fontSize: 20, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
      Text(trailing, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
    ]);
  }

  Widget _emptyState(IconData icon, String title, String sub) {
    return Container(
      padding: const EdgeInsets.all(30),
      child: Column(children: [
        Icon(icon, size: 40, color: AppColors.textTertiary),
        const SizedBox(height: 12),
        Text(title, style: GoogleFonts.newsreader(fontSize: 18, color: AppColors.textSecondary)),
        Text(sub, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary)),
      ]),
    );
  }

  Widget _alertCard(Map<String, dynamic> a) {
    Color sevColor;
    IconData icon;
    switch (a['severity']) {
      case 'critical': sevColor = AppColors.error; icon = CupertinoIcons.exclamationmark_triangle_fill; break;
      case 'warning': sevColor = AppColors.warning; icon = CupertinoIcons.exclamationmark_circle_fill; break;
      default: sevColor = AppColors.accent; icon = CupertinoIcons.info_circle_fill;
    }
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: sevColor.withValues(alpha: 0.2), width: 0.5),
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: sevColor.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: sevColor, size: 18),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(a['type'], style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: sevColor, letterSpacing: 0.5)),
          Text(a['vessel'], style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text(a['loc'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
        ])),
        Text(a['time'], style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
      ]),
    );
  }

  Widget _geofenceCard(Map<String, dynamic> g) {
    final active = g['status'] == 'active';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: active ? AppColors.success : AppColors.textSecondary, shape: BoxShape.circle)),
        const SizedBox(width: 12),
        Expanded(child: Text(g['name'], style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary))),
        Text('Min: ${g['minDepth']}m', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
      ]),
    );
  }

  Widget _infoBox(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.textPrimary.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(children: [
        Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.newsreader(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ]),
    );
  }
}
