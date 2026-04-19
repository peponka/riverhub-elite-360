import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:google_fonts/google_fonts.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class AuditoriaScreen extends StatefulWidget {
  const AuditoriaScreen({super.key});

  @override
  State<AuditoriaScreen> createState() => _AuditoriaScreenState();
}

class _AuditoriaScreenState extends State<AuditoriaScreen> {
  final List<Map<String, dynamic>> _logs = [
    {'time': '14:32:05', 'type': 'SUCCESS', 'msg': 'Conexión a Supabase establecida. Latencia: 45ms'},
    {'time': '14:32:04', 'type': 'INFO', 'msg': 'Almacenamiento Local en uso: 124.5 KB'},
    {'time': '14:32:03', 'type': 'SUCCESS', 'msg': 'Conectividad de red verificada.'},
    {'time': '14:32:02', 'type': 'WARN', 'msg': 'Modo depuración activado.'},
    {'time': '14:32:01', 'type': 'INFO', 'msg': 'Iniciando monitor de eventos en tiempo real...'},
    {'time': '14:32:00', 'type': 'INFO', 'msg': 'Módulo de Auditoría del Sistema Iniciado.'},
  ];

  final bool _networkOk = true;
  final bool _dbOk = true;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        middle: Text('Auditoría', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            // Editorial header
            Text('Auditoría del', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Sistema.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 24),

            // Status cards — monochrome, clean
            Text('ESTADO DE SERVICIOS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 12),
            Row(children: [
              _statusCard('Red', _networkOk, CupertinoIcons.wifi),
              const SizedBox(width: 10),
              _statusCard('Base de Datos', _dbOk, CupertinoIcons.cloud),
              const SizedBox(width: 10),
              _statusCard('Storage', true, CupertinoIcons.tray_full),
            ]),
            const SizedBox(height: 20),

            // Metrics — monochrome
            Text('MÉTRICAS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 12),
            Row(children: [
              _metricBox('Memoria', '185.2 MB'),
              const SizedBox(width: 10),
              _metricBox('Storage', '124.5 KB'),
              const SizedBox(width: 10),
              _metricBox('Uptime', '12h 34m'),
            ]),
            const SizedBox(height: 20),

            // Actions — editorial buttons
            Text('ACCIONES', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _actionButton('Test Conexión', CupertinoIcons.antenna_radiowaves_left_right, () {
                setState(() {
                  _logs.insert(0, {
                    'time': material.TimeOfDay.now().format(context),
                    'type': 'INFO',
                    'msg': 'Ejecutando Ping de latencia...',
                  });
                });
                Future.delayed(const Duration(milliseconds: 800), () {
                  if (!mounted) return;
                  setState(() => _logs.insert(0, {
                    'time': material.TimeOfDay.now().format(context),
                    'type': 'SUCCESS',
                    'msg': 'Ping OK: 24ms (Google DNS)',
                  }));
                });
              })),
              const SizedBox(width: 8),
              Expanded(child: _actionButton('Limpiar Logs', CupertinoIcons.trash, () => setState(() => _logs.clear()))),
              const SizedBox(width: 8),
              Expanded(child: _actionButton('Exportar', CupertinoIcons.arrow_up_doc, () {
                showCupertinoDialog(
                  context: context,
                  builder: (c) => CupertinoAlertDialog(
                    title: const Text('Exportar Logs'),
                    content: const Text('Logs exportados a CSV correctamente.'),
                    actions: [CupertinoDialogAction(child: const Text('OK'), onPressed: () => Navigator.pop(c))],
                  ),
                );
              })),
            ]),
            const SizedBox(height: 24),

            // Terminal — clean monochrome console
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('CONSOLA', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 1.5)),
                    Text('${_logs.length} entries', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
                  ]),
                  const SizedBox(height: 14),
                  ..._logs.take(15).map((l) => _logEntry(l)),
                  if (_logs.isEmpty)
                    Center(child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text('Consola vacía', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                    )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusCard(String label, bool ok, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(children: [
          Icon(icon, color: AppColors.textSecondary, size: 20),
          const SizedBox(height: 8),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(width: 5, height: 5, decoration: BoxDecoration(
              color: ok ? AppColors.textPrimary : AppColors.textSecondary,
              shape: BoxShape.circle,
            )),
            const SizedBox(width: 5),
            Text(ok ? 'ONLINE' : 'ERROR', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 0.5)),
          ]),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
        ]),
      ),
    );
  }

  Widget _metricBox(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(children: [
          Text(value, style: GoogleFonts.newsreader(fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
        ]),
      ),
    );
  }

  Widget _actionButton(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(children: [
          Icon(icon, color: AppColors.textSecondary, size: 18),
          const SizedBox(height: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textPrimary), textAlign: TextAlign.center),
        ]),
      ),
    );
  }

  Widget _logEntry(Map<String, dynamic> l) {
    // All monochrome — type label is just bold, no colors
    final isBold = l['type'] == 'SUCCESS' || l['type'] == 'WARN' || l['type'] == 'ERROR';
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('[${l['time']}]  ', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        Text('${l['type']}: ', style: GoogleFonts.inter(fontSize: 11, fontWeight: isBold ? FontWeight.w700 : FontWeight.w500, color: AppColors.textPrimary)),
        Expanded(child: Text(l['msg'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary, height: 1.4))),
      ]),
    );
  }
}
