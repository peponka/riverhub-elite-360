import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _activeVessels = 0;
  int _dockedVessels = 0;
  int _maintenance = 0;
  int _alerts = 0;
  bool _isLoading = true;

  // Live data
  String _weatherText = 'Cargando clima...';
  String _fuelText = 'Consultando consumo...';
  String _viajesText = 'Consultando manifiestos...';

  @override
  void initState() {
    super.initState();
    _fetchFleetStats();
    _fetchWeather();
    _fetchFuelSummary();
    _fetchViajesSummary();
    if (!kIsWeb) _secureFcmTokenUpdate(showSuccessDialog: false);
  }

  /// Fase 3: Isolated Token Acquisition (mobile only)
  Future<void> _secureFcmTokenUpdate({bool showSuccessDialog = false}) async {
    if (kIsWeb) return; // Skip on web
    // Firebase messaging only works on mobile - handled at native level
    debugPrint('FCM token update skipped (web or unavailable)');
  }

  Future<void> _fetchFleetStats() async {
    try {
      final response = await Supabase.instance.client.from('vessels').select('status');
      int active = 0, docked = 0, maint = 0;

      for (var vessel in response) {
        final status = (vessel['status'] ?? '').toString().toLowerCase();
        if (status == 'en viaje' || status == 'active') {
          active++;
        } else if (status == 'mantenimiento' || status == 'maintenance') {
          maint++;
        } else {
          docked++;
        }
      }

      final logs = await Supabase.instance.client
          .from('logs').select('action_type').eq('action_type', 'alert').limit(10);

      if (mounted) {
        setState(() {
          _activeVessels = active;
          _dockedVessels = docked;
          _maintenance = maint;
          _alerts = logs.length;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching fleet stats: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchWeather() async {
    try {
      final url = Uri.parse(
        'https://api.open-meteo.com/v1/forecast'
        '?latitude=-25.286&longitude=-57.647'
        '&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m'
        '&timezone=America/Asuncion'
      );
      final res = await http.get(url);
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final c = data['current'];
        if (c != null && mounted) {
          const codes = {
            0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado',
            3: 'Nublado', 45: 'Niebla', 51: 'Llovizna', 61: 'Lluvia',
            80: 'Chaparrón', 95: 'Tormenta',
          };
          final desc = codes[c['weather_code']] ?? 'Variado';
          final temp = (c['temperature_2m'] ?? 0).round();
          final wind = (c['wind_speed_10m'] ?? 0).round();
          final hum = c['relative_humidity_2m'] ?? '--';
          setState(() => _weatherText = '$desc, $temp°C — Viento $wind km/h | Hum: $hum%');
        }
      }
    } catch (e) {
      debugPrint('Weather: $e');
    }
  }

  Future<void> _fetchFuelSummary() async {
    try {
      final r = await Supabase.instance.client.from('fuel_logs').select('liters').limit(50);
      if (r.isNotEmpty && mounted) {
        final total = r.fold<int>(0, (sum, x) => sum + ((x['liters'] ?? 0) as num).toInt());
        setState(() => _fuelText = 'Total registrado: ${total.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} L (${r.length} cargas)');
      } else {
        if (mounted) setState(() => _fuelText = 'Sin registros de consumo');
      }
    } catch (e) {
      debugPrint('Fuel: $e');
    }
  }

  Future<void> _fetchViajesSummary() async {
    try {
      final r = await Supabase.instance.client.from('voyages').select('status');
      if (r.isNotEmpty && mounted) {
        final nav = r.where((v) {
          final s = (v['status'] ?? '').toString().toLowerCase();
          return s == 'navegando' || s == 'en_curso' || s == 'en viaje';
        }).length;
        setState(() => _viajesText = '$nav en curso, ${r.length - nav} completados');
      } else {
        if (mounted) setState(() => _viajesText = 'Sin viajes registrados');
      }
    } catch (e) {
      debugPrint('Viajes: $e');
    }
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
            Text(
              'Fluvia',
              style: GoogleFonts.newsreader(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                fontStyle: FontStyle.italic,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Icon(CupertinoIcons.bell, size: 22, color: AppColors.textSecondary),
          onPressed: () => _secureFcmTokenUpdate(showSuccessDialog: true),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  // ─── Fluvia Title ─────────────────────────
                  Text(
                    'Panel de',
                    style: GoogleFonts.newsreader(
                      fontSize: 36,
                      fontWeight: FontWeight.w400,
                      color: AppColors.textPrimary,
                      height: 1.1,
                    ),
                  ),
                  Text(
                    'Control.',
                    style: GoogleFonts.newsreader(
                      fontSize: 36,
                      fontWeight: FontWeight.w300,
                      fontStyle: FontStyle.italic,
                      color: AppColors.textPrimary,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'HIDROVÍA PARAGUAY-PARANÁ · FLOTA ACTIVA',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 28),

                  // ─── KPI Cards ────────────────────────────
                  Row(
                    children: [
                      Expanded(child: _kpiCard('En Viaje', _activeVessels.toString(), AppColors.success)),
                      const SizedBox(width: 12),
                      Expanded(child: _kpiCard('En Puerto', _dockedVessels.toString(), AppColors.accent)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _kpiCard('Mantenim.', _maintenance.toString(), AppColors.warning)),
                      const SizedBox(width: 12),
                      Expanded(child: _kpiCard('Alertas', _alerts.toString(),
                          _alerts > 0 ? AppColors.error : AppColors.textSecondary)),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // ─── Section Title ────────────────────────
                  Text(
                    'Información',
                    style: GoogleFonts.newsreader(
                      fontSize: 24,
                      fontWeight: FontWeight.w400,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),

                  _infoCard(
                    icon: CupertinoIcons.drop_fill,
                    title: 'Estado del Combustible',
                    subtitle: _fuelText,
                  ),
                  const SizedBox(height: 10),
                  _infoCard(
                    icon: CupertinoIcons.calendar,
                    title: 'Viajes Activos',
                    subtitle: _viajesText,
                  ),
                  const SizedBox(height: 10),
                  _infoCard(
                    icon: CupertinoIcons.sun_max_fill,
                    title: 'Meteorología (ASU)',
                    subtitle: _weatherText,
                  ),
                ],
              ),
      ),
    );
  }

  Widget _kpiCard(String label, String value, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: accentColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            value,
            style: GoogleFonts.newsreader(
              fontSize: 36,
              fontWeight: FontWeight.w400,
              color: AppColors.textPrimary,
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Icon(CupertinoIcons.chevron_right, size: 14, color: AppColors.separator),
        ],
      ),
    );
  }
}
