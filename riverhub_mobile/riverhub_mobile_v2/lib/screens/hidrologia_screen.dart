import 'package:flutter/cupertino.dart';
import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:google_fonts/google_fonts.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
import '../services/locale_service.dart';

class HidrologiaScreen extends StatefulWidget {
  const HidrologiaScreen({super.key});

  @override
  State<HidrologiaScreen> createState() => _HidrologiaScreenState();
}

class _HidrologiaScreenState extends State<HidrologiaScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  bool _loading = true;

  double _temp = 0;
  double _wind = 0;
  int _humidity = 0;
  String _weatherDesc = '';
  int _weatherCode = 0;

  List<double> _chartData = [];
  List<String> _chartLabels = [];
  List<Map<String, dynamic>> _stations = [];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500));
    _weatherDesc = LocaleService.t('hydro_loading');
    _fetchAllData();
  }

  @override
  void dispose() { _animController.dispose(); super.dispose(); }

  Future<void> _fetchAllData() async {
    setState(() => _loading = true);
    await Future.wait([_fetchWeather(), _fetchFloodData()]);
    if (mounted) {
      setState(() => _loading = false);
      _animController.forward();
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
        final current = data['current'];
        if (current != null && mounted) {
          setState(() {
            _temp = (current['temperature_2m'] ?? 0).toDouble();
            _wind = (current['wind_speed_10m'] ?? 0).toDouble();
            _humidity = (current['relative_humidity_2m'] ?? 0).toInt();
            _weatherCode = (current['weather_code'] ?? 0).toInt();
            _weatherDesc = _weatherName(_weatherCode);
          });
        }
      }
    } catch (e) {
      debugPrint('Weather error: $e');
      if (mounted) setState(() { _temp = 28; _wind = 15; _humidity = 72; _weatherDesc = LocaleService.t('hydro_no_connection'); });
    }
  }

  Future<void> _fetchFloodData() async {
    try {
      final stations = [
        {'name': 'Asunción', 'river': 'Río Paraguay', 'lat': -25.3, 'lon': -57.7},
        {'name': 'Pilar', 'river': 'Bajo Paraguay', 'lat': -26.85, 'lon': -58.35},
        {'name': 'Concepción', 'river': 'Alto Paraguay', 'lat': -23.4, 'lon': -57.5},
        {'name': 'Rosario', 'river': 'Río Paraná', 'lat': -32.95, 'lon': -60.65},
      ];

      List<Map<String, dynamic>> loadedStations = [];

      for (final st in stations) {
        try {
          final url = Uri.parse(
            'https://flood-api.open-meteo.com/v1/flood'
            '?latitude=${st['lat']}&longitude=${st['lon']}'
            '&daily=river_discharge&past_days=7&forecast_days=7'
          );
          final res = await http.get(url);
          if (res.statusCode == 200) {
            final data = json.decode(res.body);
            final discharges = data['daily']?['river_discharge'] as List<dynamic>? ?? [];
            final dates = data['daily']?['time'] as List<dynamic>? ?? [];

            if (discharges.isNotEmpty) {
              final current = discharges.length > 7 ? discharges[7] : discharges.last;
              final previous = discharges.length > 6 ? discharges[6] : discharges.first;
              final median = discharges.map((d) => (d ?? 0).toDouble()).reduce((a, b) => a + b) / discharges.length;

              String trend = LocaleService.t('dyn_key_118');
              if ((current ?? 0) > (previous ?? 0) * 1.05) trend = LocaleService.t('dyn_key_117');
              if ((current ?? 0) < (previous ?? 0) * 0.95) trend = LocaleService.t('dyn_key_119');

              loadedStations.add({
                'name': st['name'],
                'river': st['river'],
                'flow': ((current ?? 0) as num).toDouble(),
                'median': median,
                'trend': trend,
              });

              if (st['name'] == 'Asunción') {
                setState(() {
                  _chartData = discharges.map((d) => (d ?? 0).toDouble()).toList().cast<double>();
                  _chartLabels = dates.map((d) => d.toString().substring(5)).toList().cast<String>();
                });
              }
            }
          }
        } catch (e) {
          debugPrint('Station ${st['name']} error: $e');
        }
      }

      if (mounted) {
        setState(() {
          _stations = loadedStations.isNotEmpty ? loadedStations : [
            {'name': 'Asunción', 'river': 'Río Paraguay', 'flow': 2450.0, 'median': 2800.0, 'trend': LocaleService.t('dyn_key_119')},
            {'name': 'Rosario', 'river': 'Río Paraná', 'flow': 15200.0, 'median': 16500.0, 'trend': LocaleService.t('dyn_key_118')},
          ];
          if (_chartData.isEmpty) {
            _chartData = List.generate(14, (i) => 2000 + Random().nextDouble() * 1500);
          }
        });
      }
    } catch (e) {
      debugPrint('Flood error: $e');
    }
  }

  String _weatherName(int code) {
    if (code == 0 || code == 1) return LocaleService.t('hydro_clear');
    if (code == 2) return LocaleService.t('hydro_partly_cloudy');
    if (code == 3) return LocaleService.t('hydro_cloudy');
    if (code >= 45 && code <= 48) return LocaleService.t('hydro_fog');
    if (code >= 51 && code <= 55) return LocaleService.t('hydro_drizzle');
    if (code >= 61 && code <= 65) return LocaleService.t('hydro_rain');
    if (code >= 80 && code <= 82) return LocaleService.t('hydro_rain');
    if (code >= 95) return LocaleService.t('hydro_storm');
    return LocaleService.t('hydro_varied');
  }

  String _trendLabel(String trend) {
    switch (trend) {
      case 'CRECIENTE': return LocaleService.t('hydro_rising');
      case 'BAJANTE': return LocaleService.t('hydro_falling');
      default: return LocaleService.t('hydro_stable');
    }
  }

  IconData _weatherIcon(int code) {
    if (code == 0 || code == 1) return CupertinoIcons.sun_max;
    if (code == 2) return CupertinoIcons.cloud_sun;
    if (code == 3) return CupertinoIcons.cloud;
    if (code >= 45 && code <= 48) return CupertinoIcons.cloud_fog;
    if (code >= 51 && code <= 55) return CupertinoIcons.cloud_drizzle;
    if (code >= 61 && code <= 65) return CupertinoIcons.cloud_rain;
    if (code >= 71 && code <= 75) return CupertinoIcons.cloud_snow;
    if (code >= 80 && code <= 82) return CupertinoIcons.cloud_heavyrain;
    if (code >= 95) return CupertinoIcons.cloud_bolt;
    return CupertinoIcons.cloud;
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context)),
        middle: Text(LocaleService.t('hydro_screen_title'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: _fetchAllData, child: Icon(CupertinoIcons.refresh, size: 20, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: _loading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text(LocaleService.t('hydro_header1'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text(LocaleService.t('hydro_header2'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 24),

                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.separator, width: 0.5)),
                    child: Row(children: [
                      Icon(_weatherIcon(_weatherCode), color: AppColors.textSecondary, size: 32),
                      const SizedBox(width: 16),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${_temp.round()}°C', style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                        Text(_weatherDesc, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                      ])),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text('${LocaleService.t('hydro_wind_label')}: ${_wind.round()} km/h', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                        Text('${LocaleService.t('hydro_humidity_label')}: $_humidity%', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                        const SizedBox(height: 2),
                        Text('Asunción, PY', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.textTertiary, letterSpacing: 0.5)),
                      ]),
                    ]),
                  ),
                  const SizedBox(height: 20),

                  Text(LocaleService.t('hydro_chart_label'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 10),
                  Container(
                    height: 150, padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.separator, width: 0.5)),
                    child: AnimatedBuilder(
                      animation: _animController,
                      builder: (context, _) => CustomPaint(
                        painter: _BarChartPainter(_chartData, _animController.value),
                        size: Size.infinite,
                      ),
                    ),
                  ),
                  if (_chartLabels.length >= 2)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(_chartLabels.first, style: GoogleFonts.inter(fontSize: 9, color: AppColors.textTertiary)),
                          Text(LocaleService.t('hydro_today'), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
                          Text(_chartLabels.last, style: GoogleFonts.inter(fontSize: 9, color: AppColors.textTertiary)),
                        ],
                      ),
                    ),
                  const SizedBox(height: 28),

                  Text(LocaleService.t('hydro_stations'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  Text(LocaleService.t('hydro_data_source'), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
                  const SizedBox(height: 12),
                  ..._stations.map((s) => _stationCard(s)),
                ],
              ),
      ),
    );
  }

  Widget _stationCard(Map<String, dynamic> s) {
    final flow = (s['flow'] as num).toDouble();
    final median = (s['median'] as num).toDouble();
    final pct = median > 0 ? ((flow - median) / median * 100) : 0.0;
    final trend = s['trend'] as String;

    Color trendColor = AppColors.success;
    IconData trendIcon = CupertinoIcons.equal_circle;
    if (trend == LocaleService.t('dyn_key_117')) { trendColor = AppColors.accent; trendIcon = CupertinoIcons.arrow_up_circle_fill; }
    if (trend == LocaleService.t('dyn_key_119')) { trendColor = AppColors.error; trendIcon = CupertinoIcons.arrow_down_circle_fill; }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: trendColor.withValues(alpha: 0.25), width: 1),
      ),
      child: Row(children: [
        // Color accent strip
        Container(
          width: 5,
          height: 80,
          decoration: BoxDecoration(
            color: trendColor,
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(14), bottomLeft: Radius.circular(14)),
          ),
        ),
        const SizedBox(width: 12),
        Icon(CupertinoIcons.waveform_path, color: trendColor.withValues(alpha: 0.6), size: 22),
        const SizedBox(width: 12),
        Expanded(child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s['name'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
            Text(s['river'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
          ]),
        )),
        Padding(
          padding: const EdgeInsets.only(right: 16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('${flow.toStringAsFixed(0)} m³/s', style: GoogleFonts.newsreader(fontWeight: FontWeight.w400, fontSize: 18, color: AppColors.textPrimary)),
            Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(trendIcon, size: 12, color: trendColor),
              const SizedBox(width: 3),
              Text('${pct >= 0 ? "+" : ""}${pct.toStringAsFixed(1)}%  ${_trendLabel(trend)}', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: trendColor)),
            ]),
          ]),
        ),
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
