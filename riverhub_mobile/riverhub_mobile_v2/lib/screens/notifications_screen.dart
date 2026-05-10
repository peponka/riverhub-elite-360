import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
import '../services/locale_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final List<Map<String, dynamic>> _notifs = [
    {'title': LocaleService.t('dyn_key_199'), 'msg': 'Nivel del río en baja en Puerto Rosario (-0.5m en 24hs).', 'type': 'warning', 'time': LocaleService.t('dyn_key_196'), 'read': false},
    {'title': LocaleService.t('dyn_key_198'), 'msg': 'Motor Auxiliar #2 (R/M HERCULES) requiere service inmediato.', 'type': 'critical', 'time': LocaleService.t('dyn_key_197'), 'read': false},
    {'title': LocaleService.t('dyn_key_193'), 'msg': 'B/M TITAN finalizó operación de carga de Soja (1,500 TN).', 'type': 'success', 'time': LocaleService.t('dyn_key_194'), 'read': true},
    {'title': LocaleService.t('dyn_key_201'), 'msg': 'Juan Acosta fue asignado a TQ ENERGY.', 'type': 'info', 'time': LocaleService.t('dyn_key_200'), 'read': true},
    {'title': 'Geofence Alert', 'msg': 'B/G SOJA KING ingresó a zona restringida Km 1285.', 'type': 'critical', 'time': LocaleService.t('dyn_key_195'), 'read': true},
  ];

  @override
  Widget build(BuildContext context) {
    final unread = _notifs.where((n) => !(n['read'] as bool)).length;
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context)),
        middle: Text(LocaleService.t('notifications_notificaciones'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Text(LocaleService.t('notifications_limpiar'), style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
          onPressed: () => setState(() => _notifs.clear()),
        ),
      ),
      child: SafeArea(
        child: _notifs.isEmpty
            ? Center(child: Text(LocaleService.t('notifications_no_hay_notificacione'), style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 15)))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text(LocaleService.t('notifications_notificaciones_1'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 6),
                  if (unread > 0)
                    Text('$unread sin leer', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  const SizedBox(height: 20),
                  ..._notifs.map((n) => _notifCard(n)),
                ],
              ),
      ),
    );
  }

  Widget _notifCard(Map<String, dynamic> n) {
    IconData icon;
    switch (n['type']) {
      case 'critical': icon = CupertinoIcons.exclamationmark_triangle; break;
      case 'warning': icon = CupertinoIcons.exclamationmark_circle; break;
      case 'success': icon = CupertinoIcons.checkmark_circle; break;
      default: icon = CupertinoIcons.info_circle;
    }
    final unread = !(n['read'] as bool);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: unread ? AppColors.surfaceContainerLow : AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: AppColors.textSecondary, size: 20),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Text(n['title'], style: GoogleFonts.inter(fontWeight: unread ? FontWeight.w700 : FontWeight.w500, fontSize: 14, color: AppColors.textPrimary))),
            Text(n['time'], style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
          ]),
          const SizedBox(height: 4),
          Text(n['msg'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, height: 1.4)),
        ])),
      ]),
    );
  }
}
