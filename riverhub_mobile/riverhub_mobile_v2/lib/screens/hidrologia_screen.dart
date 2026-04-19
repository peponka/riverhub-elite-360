import 'package:flutter/cupertino.dart';
import 'dart:math';
import 'package:google_fonts/google_fonts.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class HidrologiaScreen extends StatefulWidget {
  const HidrologiaScreen({super.key});

  @override
  State<HidrologiaScreen> createState() => _HidrologiaScreenState();
}

class _HidrologiaScreenState extends State<HidrologiaScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  final List<Map<String, dynamic>> _stations = [
    {'name': 'Asunción', 'river': 'Río Paraguay', 'flow': 2450, 'median': 2800, 'trend': 'BAJANTE'},
    {'name': 'Rosario', 'river': 'Río Paraná', 'flow': 15200, 'median': 16500, 'trend': 'ESTABLE'},
    {'name': 'Corumbá', 'river': 'Alto Paraguay', 'flow': 980, 'median': 1100, 'trend': 'BAJANTE'},
  ];

  final List<double> _chartData = List.generate(30, (i) => 2000 + Random().nextDouble() * 1500);

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))..forward();
  }

  @override
  void dispose() { _animController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context)),
        middle: Text('Hidrología', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Pronóstico', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Hidrológico.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 24),

            // Weather summary - clean white card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Row(children: [
                Icon(CupertinoIcons.cloud_sun, color: AppColors.textSecondary, size: 32),
                const SizedBox(width: 16),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('28°C', style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                  Text('Parcialmente nublado', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                ]),
                const Spacer(),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('Viento: 15 km/h', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                  Text('Humedad: 72%', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                ]),
              ]),
            ),
            const SizedBox(height: 20),

            // Chart
            Text('CAUDAL: RÍO PARAGUAY (M³/S) — 30 DÍAS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 10),
            Container(
              height: 140, padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: AnimatedBuilder(
                animation: _animController,
                builder: (context, _) => CustomPaint(painter: _BarChartPainter(_chartData, _animController.value), size: Size.infinite),
              ),
            ),
            const SizedBox(height: 28),

            // Stations
            Text('ESTACIONES DE MONITOREO', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 12),
            ..._stations.map((s) => _stationCard(s)),
          ],
        ),
      ),
    );
  }

  Widget _stationCard(Map<String, dynamic> s) {
    final flow = s['flow'] as int;
    final median = s['median'] as int;
    final pct = ((flow - median) / median * 100).toStringAsFixed(1);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Icon(CupertinoIcons.waveform_path, color: AppColors.textSecondary, size: 22),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(s['name'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          Text(s['river'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('$flow m³/s', style: GoogleFonts.newsreader(fontWeight: FontWeight.w400, fontSize: 18, color: AppColors.textPrimary)),
          Row(children: [
            Container(width: 5, height: 5, decoration: BoxDecoration(
              color: flow < median ? AppColors.textSecondary : AppColors.textPrimary, shape: BoxShape.circle,
            )),
            const SizedBox(width: 4),
            Text('$pct%  ${s['trend']}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
          ]),
        ]),
      ]),
    );
  }
}

class _BarChartPainter extends CustomPainter {
  final List<double> data;
  final double progress;
  _BarChartPainter(this.data, this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    final maxVal = data.reduce(max) * 1.1;
    final barWidth = size.width / data.length - 2;
    for (int i = 0; i < data.length; i++) {
      final val = data[i];
      final pct = (val / maxVal) * progress;
      final height = pct * size.height;
      final x = i * (barWidth + 2);
      // Monochrome bars - darker for higher values
      final opacity = 0.15 + (val / maxVal) * 0.55;
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(x, size.height - height, barWidth, height), const Radius.circular(2)),
        Paint()..color = AppColors.textPrimary.withValues(alpha: opacity),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _BarChartPainter old) => old.progress != progress;
}
