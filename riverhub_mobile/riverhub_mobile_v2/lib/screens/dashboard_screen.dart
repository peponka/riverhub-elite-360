import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
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

  @override
  void initState() {
    super.initState();
    _fetchFleetStats();
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
                    subtitle: 'Consumo promedio: 1,200 L/hr',
                  ),
                  const SizedBox(height: 10),
                  _infoCard(
                    icon: CupertinoIcons.calendar,
                    title: 'Próximos Viajes',
                    subtitle: 'Consultando manifiestos...',
                  ),
                  const SizedBox(height: 10),
                  _infoCard(
                    icon: CupertinoIcons.sun_max_fill,
                    title: 'Meteorología (ASU)',
                    subtitle: 'Soleado, 28°C — Viento 12 km/h SE',
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
