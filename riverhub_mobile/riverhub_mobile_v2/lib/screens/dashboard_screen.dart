import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
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
    _secureFcmTokenUpdate(showSuccessDialog: false);
  }

  /// Fase 3: Isolated Token Acquisition
  Future<void> _secureFcmTokenUpdate({bool showSuccessDialog = false}) async {
    try {
      final supabase = Supabase.instance.client;
      final session = supabase.auth.currentSession;
      
      // Ensure we only try if user natively authenticated
      if (session == null || session.user.id.isEmpty) return;

      final messaging = FirebaseMessaging.instance;
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized || 
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        
        final fcmToken = await messaging.getToken();
        debugPrint('🔥 Nuevo FCM Token Obtenido Nativamente: $fcmToken');
        
        if (fcmToken != null) {
          // Verify profile first
          final profileExists = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();

          if (profileExists != null) {
            final fcmSave = await supabase
                .from('profiles')
                .update({'fcm_token': fcmToken})
                .eq('id', session.user.id)
                .select();
            debugPrint('✅ FCM Token guardado explícitamente. Rows Affected: ${fcmSave.length}');
            
            // Lanza una alerta visible SOLO PARA TI, para demostrar que se guardó
            if (mounted && showSuccessDialog) {
              showCupertinoDialog(
                context: context,
                builder: (ctx) => CupertinoAlertDialog(
                  title: const Text('¡Cerebro Conectado!'),
                  content: const Text('Tu token nativo ha sido sincronizado con Supabase y n8n exitosamente.'),
                  actions: [
                    CupertinoDialogAction(child: const Text('OK'), onPressed: () => Navigator.of(ctx).pop())
                  ],
                ),
              );
            }
          } else {
             debugPrint('⚠️ No se pudo guardar FCM, el prefil aun no existe.');
          }
        }
      }
    } catch (e) {
      debugPrint('🚨 Safe FCM update error: $e');
    }
  }

  Future<void> _fetchFleetStats() async {
    try {
      final response = await Supabase.instance.client
          .from('vessels')
          .select('status');

      int active = 0;
      int docked = 0;
      int maint = 0;

      for (var vessel in response) {
        final status = (vessel['status'] ?? '').toString().toLowerCase();
        if (status == 'en viaje' || status == 'active') {
          active++;
        } else if (status == 'mantenimiento' || status == 'maintenance') {
          maint++;
        } else {
          docked++; // Default to docked/in port
        }
      }

      final logs = await Supabase.instance.client
          .from('logs')
          .select('action_type')
          .eq('action_type', 'alert')
          .limit(10); // Check recent alerts

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
      backgroundColor: CupertinoColors.systemGroupedBackground,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CupertinoColors.white.withValues(alpha: 0.85),
        border: null,
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.bars, size: 28),
          onPressed: () {
            rootScaffoldKey.currentState?.openDrawer();
          },
        ),
        middle: Text(
          'RiverHub Elite',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.bell),
          onPressed: () async {
            // Reintentar push manual
            await _secureFcmTokenUpdate(showSuccessDialog: true);
          },
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 16))
            : ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20.0,
                  vertical: 16.0,
                ),
                children: [
                  Text(
                    'Resumen de Flota',
                    style: GoogleFonts.inter(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: CupertinoColors.black,
                    ),
                  ),
                  const SizedBox(height: 20),
                  // iOS Style Widget Grid
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard(
                          context,
                          'En Viaje',
                          _activeVessels.toString(),
                          CupertinoIcons.location_solid,
                          CupertinoColors.activeGreen,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildMetricCard(
                          context,
                          'En Puerto',
                          _dockedVessels.toString(),
                          CupertinoIcons.play_rectangle_fill,
                          CupertinoColors.activeBlue,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard(
                          context,
                          'Mantenimiento',
                          _maintenance.toString(),
                          CupertinoIcons.wrench_fill,
                          CupertinoColors.systemOrange,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildMetricCard(
                          context,
                          'Alertas',
                          _alerts.toString(),
                          CupertinoIcons.exclamationmark_triangle_fill,
                          _alerts > 0
                              ? CupertinoColors.systemRed
                              : CupertinoColors.systemGrey,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Información General',
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: CupertinoColors.black,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildLargeCard(
                    title: 'Estado del Combustible',
                    subtitle: 'Consumo promedio en tiempo real: 1,200L/hr',
                    icon: CupertinoIcons.drop_fill,
                    iconColor: CupertinoColors.systemIndigo,
                  ),
                  const SizedBox(height: 16),
                  _buildLargeCard(
                    title: 'Próximos Viajes',
                    subtitle: 'Consultando manifiestos...',
                    icon: CupertinoIcons.calendar,
                    iconColor: CupertinoColors.systemTeal,
                  ),
                  const SizedBox(height: 16),
                  _buildLargeCard(
                    title: 'Meteorología (Rosario)',
                    subtitle: 'Soleado, 24°C - Viento 10km/h SE',
                    icon: CupertinoIcons.sun_max_fill,
                    iconColor: CupertinoColors.systemYellow,
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildMetricCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color iconColor,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.systemGrey.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: CupertinoColors.black,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: CupertinoColors.systemGrey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLargeCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.systemGrey.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: CupertinoColors.black,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: CupertinoColors.systemGrey,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            CupertinoIcons.chevron_right,
            color: CupertinoColors.systemGrey3,
            size: 20,
          ),
        ],
      ),
    );
  }
}
