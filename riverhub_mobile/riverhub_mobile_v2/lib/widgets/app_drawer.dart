import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
// Existing screens
import '../screens/fuel_screen.dart';
import '../screens/draft_screen.dart';
import '../screens/quote_screen.dart';
import '../screens/convoys_screen.dart';
import '../screens/trips_screen.dart';
import '../screens/nexobot_screen.dart';
// NEW screens
import '../screens/map_screen.dart';
import '../screens/fleet_manager_screen.dart';
import '../screens/comunicaciones_screen.dart';
import '../screens/daily_report_screen.dart';
import '../screens/hidrologia_screen.dart';
import '../screens/incidentes_screen.dart';
import '../screens/loadmaster_screen.dart';
import '../screens/mantenimiento_screen.dart';
import '../screens/monitoring_screen.dart';
import '../screens/panol_screen.dart';
import '../screens/tripulacion_screen.dart';
import '../screens/reportes_screen.dart';
import '../screens/tracking_screen.dart';
import '../screens/commercial_screen.dart';
import '../screens/auditoria_screen.dart';
import '../screens/docs_screen.dart';
import '../screens/financial_risk_screen.dart';
import '../screens/integraciones_screen.dart';
import '../screens/billing_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/admin_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final userEmail =
        Supabase.instance.client.auth.currentUser?.email ?? 'Usuario';

    return material.Drawer(
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFF1E293B))),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF00E5FF), Color(0xFF3B82F6)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      CupertinoIcons.person_solid,
                      color: material.Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          userEmail,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: material.Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'Elite 360 • Capitán',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Menu
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _sectionHeader('OPERACIONES'),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.map_fill,
                    iconColor: const Color(0xFF10B981),
                    title: 'Mapa de Flota',
                    destination: const MapScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.helm,
                    iconColor: const Color(0xFF00E5FF),
                    title: 'Gestión de Flota',
                    destination: const FleetManagerScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.drop_fill,
                    iconColor: const Color(0xFF8B5CF6),
                    title: 'Combustible',
                    destination: const FuelScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.arrow_up_down_square_fill,
                    iconColor: const Color(0xFF3B82F6),
                    title: 'Calados e Hidrometría',
                    destination: const DraftScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.waveform_path,
                    iconColor: const Color(0xFF06B6D4),
                    title: 'Hidrología',
                    destination: const HidrologiaScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.link,
                    iconColor: const Color(0xFF10B981),
                    title: 'Convoyes',
                    destination: const ConvoysScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.cube_box_fill,
                    iconColor: const Color(0xFFF59E0B),
                    title: 'Load Master',
                    destination: const LoadMasterScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.location_fill,
                    iconColor: const Color(0xFFEF4444),
                    title: 'Tracking de Cargas',
                    destination: const TrackingScreen(),
                  ),

                  _sectionHeader('LOGÍSTICA'),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.doc_text_fill,
                    iconColor: const Color(0xFFF97316),
                    title: 'Manifiestos y Viajes',
                    destination: const TripsScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.money_dollar_circle_fill,
                    iconColor: const Color(0xFF10B981),
                    title: 'Cotizador Logístico',
                    destination: const QuoteScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.briefcase_fill,
                    iconColor: const Color(0xFF8B5CF6),
                    title: 'Módulo Comercial',
                    destination: const CommercialScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.doc_on_clipboard_fill,
                    iconColor: const Color(0xFF3B82F6),
                    title: 'Documentación',
                    destination: const DocsScreen(),
                  ),

                  _sectionHeader('MANTENIMIENTO'),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.wrench_fill,
                    iconColor: const Color(0xFFF59E0B),
                    title: 'Mantenimiento',
                    destination: const MantenimientoScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.archivebox_fill,
                    iconColor: const Color(0xFF06B6D4),
                    title: 'Pañol (Inventario)',
                    destination: const PanolScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.exclamationmark_triangle_fill,
                    iconColor: const Color(0xFFEF4444),
                    title: 'Incidentes & Forense',
                    destination: const IncidentesScreen(),
                  ),

                  _sectionHeader('TRIPULACIÓN'),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.person_3_fill,
                    iconColor: const Color(0xFF10B981),
                    title: 'Tripulación',
                    destination: const TripulacionScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.radiowaves_right,
                    iconColor: const Color(0xFF00E5FF),
                    title: 'Comunicaciones VHF',
                    destination: const ComunicacionesScreen(),
                  ),

                  _sectionHeader('INTELIGENCIA'),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.chat_bubble_2_fill,
                    iconColor: const Color(0xFF8B5CF6),
                    title: 'NexoBot IA / Chat',
                    destination: const NexoBotScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.eye_fill,
                    iconColor: const Color(0xFF3B82F6),
                    title: 'Torre de Control',
                    destination: const MonitoringScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.chart_pie_fill,
                    iconColor: const Color(0xFFF97316),
                    title: 'Reportes & Analytics',
                    destination: const ReportesScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.news_solid,
                    iconColor: const Color(0xFF06B6D4),
                    title: 'Briefing Diario',
                    destination: const DailyReportScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.graph_circle_fill,
                    iconColor: const Color(0xFFEF4444),
                    title: 'Riesgo Financiero',
                    destination: const FinancialRiskScreen(),
                  ),

                  _sectionHeader('SISTEMA'),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.bell_fill,
                    iconColor: const Color(0xFFF59E0B),
                    title: 'Notificaciones',
                    destination: const NotificationsScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.arrow_right_arrow_left,
                    iconColor: const Color(0xFF10B981),
                    title: 'Integraciones API',
                    destination: const IntegracionesScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.creditcard_fill,
                    iconColor: const Color(0xFF3B82F6),
                    title: 'Facturación',
                    destination: const BillingScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.shield_fill,
                    iconColor: const Color(0xFF64748B),
                    title: 'Auditoría',
                    destination: const AuditoriaScreen(),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: CupertinoIcons.gear_alt_fill,
                    iconColor: const Color(0xFF8B5CF6),
                    title: 'Panel Admin',
                    destination: const AdminScreen(),
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 6),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF475569),
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    Widget? destination,
  }) {
    return material.ListTile(
      dense: true,
      visualDensity: const material.VisualDensity(vertical: -1),
      leading: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: iconColor, size: 18),
      ),
      title: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: material.Colors.white,
        ),
      ),
      trailing: const Icon(
        CupertinoIcons.chevron_right,
        size: 14,
        color: Color(0xFF475569),
      ),
      onTap: () {
        material.Scaffold.of(context).closeDrawer();
        if (destination != null) {
          Navigator.of(
            context,
          ).push(CupertinoPageRoute(builder: (context) => destination));
        }
      },
    );
  }
}
