import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
import '../services/locale_service.dart';

class IntegracionesScreen extends StatelessWidget {
  IntegracionesScreen({super.key});

  final List<Map<String, dynamic>> _apis = [
    {'name': 'MarineTraffic', 'desc': 'AIS & Tracking Global', 'status': 'online', 'latency': '45ms'},
    {'name': 'Open-Meteo', 'desc': LocaleService.t('dyn_key_143'), 'status': 'online', 'latency': '120ms'},
    {'name': 'Datalastic', 'desc': 'Ship Database', 'status': 'offline', 'latency': '-'},
    {'name': 'WhatsApp API', 'desc': LocaleService.t('dyn_key_142'), 'status': 'online', 'latency': '80ms'},
    {'name': 'Supabase', 'desc': LocaleService.t('dyn_key_3'), 'status': 'online', 'latency': '35ms'},
  ];

  @override
  Widget build(BuildContext context) {
    final onlineCount = _apis.where((a) => a['status'] == 'online').length;
    final offlineCount = _apis.length - onlineCount;

    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context)),
        middle: Text(LocaleService.t('integraciones_integraciones'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text(LocaleService.t('integraciones_integraciones'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text(LocaleService.t('integraciones_api'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 24),

            Row(children: [
              _kpi('$onlineCount', LocaleService.t('dyn_key_141')),
              const SizedBox(width: 10),
              _kpi('$offlineCount', 'Offline'),
            ]),
            const SizedBox(height: 24),

            Text(LocaleService.t('integraciones_servicios_conectados'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 12),
            ..._apis.map((a) => _apiCard(a)),
            const SizedBox(height: 24),

            Text(LocaleService.t('integraciones_api_key'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Column(children: [
                Row(children: [
                  Expanded(child: Text(LocaleService.t('integraciones_sk_live'), style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary))),
                  Icon(CupertinoIcons.eye, color: AppColors.textSecondary, size: 18),
                ]),
                const SizedBox(height: 14),
                SizedBox(width: double.infinity, child: CupertinoButton(
                  color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Text(LocaleService.t('integraciones_generar_nueva_key'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textOnAccent)),
                  onPressed: () {},
                )),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String val, String label) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(children: [
        Text(val, style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
      ]),
    ),
  );

  Widget _apiCard(Map<String, dynamic> a) {
    final online = a['status'] == 'online';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: online ? AppColors.textPrimary : AppColors.separator, shape: BoxShape.circle)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(a['name'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          Text(a['desc'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(online ? 'ONLINE' : 'OFFLINE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: online ? AppColors.textPrimary : AppColors.textSecondary, letterSpacing: 0.5)),
          Text(a['latency'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        ]),
      ]),
    );
  }
}
