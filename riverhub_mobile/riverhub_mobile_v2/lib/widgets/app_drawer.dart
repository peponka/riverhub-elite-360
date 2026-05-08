import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
// Existing screens
import '../screens/fuel_screen.dart';
import '../screens/draft_screen.dart';
import '../screens/convoys_screen.dart';
import '../screens/trips_screen.dart';
import '../screens/nexobot_screen.dart';
import '../screens/map_screen.dart';
import '../screens/fleet_manager_screen.dart';
import '../screens/comunicaciones_screen.dart';
import '../screens/daily_report_screen.dart';
import '../screens/hidrologia_screen.dart';
import '../screens/mantenimiento_screen.dart';
import '../screens/panol_screen.dart';
import '../screens/tripulacion_screen.dart';
import '../screens/reportes_screen.dart';
import '../screens/tracking_screen.dart';
import '../screens/auditoria_screen.dart';
import '../screens/integraciones_screen.dart';
import '../screens/billing_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/bitacora_screen.dart';
import '../screens/liquidos_screen.dart';
import '../screens/contratos_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  Future<String> _getUserRole() async {
    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId == null) return 'USUARIO';
      final r = await Supabase.instance.client
          .from('user_profiles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
      return ((r?['role'] as String?) ?? 'user').toUpperCase();
    } catch (_) {
      return 'USUARIO';
    }
  }

  @override
  Widget build(BuildContext context) {
    final userEmail =
        Supabase.instance.client.auth.currentUser?.email ?? 'Usuario';

    return material.Drawer(
      backgroundColor: AppColors.backgroundSecondary,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(0)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // ─── Fluvia Header ───────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(CupertinoIcons.drop_fill, size: 18, color: AppColors.textPrimary),
                      const SizedBox(width: 8),
                      Text(
                        'Fluvia',
                        style: GoogleFonts.newsreader(
                          fontSize: 22,
                          fontWeight: FontWeight.w500,
                          fontStyle: FontStyle.italic,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'v4.2',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(
                          child: Text(
                            _initials(userEmail),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              userEmail.split('@').first,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            FutureBuilder<String>(
                              future: _getUserRole(),
                              builder: (ctx, snap) => Text(
                                '${snap.data ?? 'USUARIO'} · ASU',
                                style: GoogleFonts.inter(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // ─── Menu ────────────────────────────────────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 12),
                children: [
                  _sectionHeader('PRINCIPAL'),
                  _drawerTile(context, CupertinoIcons.map_fill, 'Mapa de Flota', const MapScreen()),
                  _drawerTile(context, CupertinoIcons.helm, 'Gestión de Flota', const FleetManagerScreen()),
                  _drawerTile(context, CupertinoIcons.chat_bubble_2_fill, 'Copiloto IA', const NexoBotScreen()),

                  _sectionHeader('OPERATIVA'),
                  _drawerTile(context, CupertinoIcons.link, 'Armador de Convoy', const ConvoysScreen()),
                  _drawerTile(context, CupertinoIcons.doc_text_fill, 'Gestión de Viajes', const TripsScreen()),
                  _drawerTile(context, CupertinoIcons.book_fill, 'Bitácora Digital', const BitacoraScreen()),
                  _drawerTile(context, CupertinoIcons.radiowaves_right, 'Comunicaciones', const ComunicacionesScreen()),

                  _sectionHeader('GESTIÓN'),
                  _drawerTile(context, CupertinoIcons.person_3_fill, 'Tripulación & Safety', const TripulacionScreen()),
                  _drawerTile(context, CupertinoIcons.drop_fill, 'Combustible', const FuelScreen()),
                  _drawerTile(context, CupertinoIcons.drop_triangle_fill, 'Líquidos (Tanques)', const LiquidosScreen()),
                  _drawerTile(context, CupertinoIcons.resize_v, 'Calados & Hidrometría', const DraftScreen()),
                  _drawerTile(context, CupertinoIcons.wrench_fill, 'Mantenimiento', const MantenimientoScreen()),
                  _drawerTile(context, CupertinoIcons.archivebox_fill, 'Pañol (Inventario)', const PanolScreen()),

                  _sectionHeader('INTELIGENCIA'),
                  _drawerTile(context, CupertinoIcons.waveform_path, 'Pronóstico Hidrovía', const HidrologiaScreen()),
                  _drawerTile(context, CupertinoIcons.chart_pie_fill, 'Reportes & Analytics', const ReportesScreen()),
                  _drawerTile(context, CupertinoIcons.news_solid, 'Briefing Diario', const DailyReportScreen()),
                  _drawerTile(context, CupertinoIcons.location_fill, 'Tracking de Cargas', const TrackingScreen()),

                  _sectionHeader('COMERCIAL'),
                  _drawerTile(context, CupertinoIcons.doc_on_doc_fill, 'Contratos de Flete', const ContratosScreen()),

                  _sectionHeader('SISTEMA'),
                  _drawerTile(context, CupertinoIcons.bell_fill, 'Notificaciones', const NotificationsScreen()),
                  _drawerTile(context, CupertinoIcons.creditcard_fill, 'Planes & Facturación', const BillingScreen()),
                  _drawerTile(context, CupertinoIcons.arrow_right_arrow_left, 'Integraciones API', const IntegracionesScreen()),
                  _drawerTile(context, CupertinoIcons.shield_fill, 'Auditoría', const AuditoriaScreen()),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _initials(String email) {
    final parts = email.split('@').first.split('.');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 6),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _drawerTile(BuildContext context, IconData icon, String title, Widget? destination) {
    return material.ListTile(
      dense: true,
      visualDensity: const material.VisualDensity(vertical: -2),
      contentPadding: const EdgeInsets.symmetric(horizontal: 24),
      leading: Icon(icon, color: AppColors.textSecondary, size: 18),
      title: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: AppColors.textPrimary,
        ),
      ),
      onTap: () {
        if (destination != null) {
          // Close drawer first
          Navigator.of(context).pop();
          // Push the screen using the ROOT navigator so back button returns to main + drawer accessible
          Navigator.of(context, rootNavigator: true).push(
            CupertinoPageRoute(builder: (_) => destination),
          ).then((_) {
            // When user comes back, re-open the drawer automatically
            Future.delayed(const Duration(milliseconds: 150), () {
              rootScaffoldKey.currentState?.openDrawer();
            });
          });
        }
      },
    );
  }
}
