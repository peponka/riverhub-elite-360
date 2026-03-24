import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'dart:math';

class HidrologiaScreen extends StatefulWidget {
  const HidrologiaScreen({super.key});

  @override
  State<HidrologiaScreen> createState() => _HidrologiaScreenState();
}

class _HidrologiaScreenState extends State<HidrologiaScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  final List<Map<String, dynamic>> _stations = [
    {
      'name': 'Asunción',
      'river': 'Río Paraguay',
      'flow': 2450,
      'median': 2800,
      'trend': 'BAJANTE',
    },
    {
      'name': 'Rosario',
      'river': 'Río Paraná',
      'flow': 15200,
      'median': 16500,
      'trend': 'ESTABLE',
    },
    {
      'name': 'Corumbá',
      'river': 'Alto Paraguay',
      'flow': 980,
      'median': 1100,
      'trend': 'BAJANTE',
    },
  ];

  final List<double> _chartData = List.generate(
    30,
    (i) => 2000 + Random().nextDouble() * 1500,
  );

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Hidrología',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF0A0E1A).withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: Color(0xFF00E5FF)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Weather card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E3A5F), Color(0xFF0F172A)],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(
                    CupertinoIcons.cloud_sun_fill,
                    color: Color(0xFFF59E0B),
                    size: 40,
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        '28°C',
                        style: TextStyle(
                          color: material.Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Parcialmente nublado',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: const [
                      Text(
                        'Viento: 15 km/h',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        'Humedad: 72%',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Chart
            const Text(
              'Caudal: Río Paraguay (m³/s) - 30 días',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
            ),
            const SizedBox(height: 8),
            Container(
              height: 150,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: AnimatedBuilder(
                animation: _animController,
                builder: (context, _) {
                  return CustomPaint(
                    painter: _BarChartPainter(
                      _chartData,
                      _animController.value,
                    ),
                    size: Size.infinite,
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            // Stations
            const Text(
              'Estaciones de Monitoreo',
              style: TextStyle(
                color: material.Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
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
    Color trendColor;
    if (flow < median * 0.8) {
      trendColor = const Color(0xFFEF4444);
    } else if (flow > median * 1.2) {
      trendColor = const Color(0xFF00E5FF);
    } else if (flow < median) {
      trendColor = const Color(0xFFF59E0B);
    } else {
      trendColor = const Color(0xFF10B981);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: trendColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              CupertinoIcons.waveform_path,
              color: trendColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s['name'],
                  style: const TextStyle(
                    color: material.Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                Text(
                  s['river'],
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$flow m³/s',
                style: const TextStyle(
                  color: material.Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                '$pct%',
                style: TextStyle(
                  color: trendColor,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                s['trend'],
                style: TextStyle(color: trendColor, fontSize: 10),
              ),
            ],
          ),
        ],
      ),
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

      Color color;
      if (val < 2000) {
        color = const Color(0xFFEF4444);
      } else if (val > 3000) {
        color = const Color(0xFF00E5FF);
      } else {
        color = const Color(0xFF3B82F6);
      }

      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x, size.height - height, barWidth, height),
          const Radius.circular(2),
        ),
        Paint()..color = color,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _BarChartPainter old) =>
      old.progress != progress;
}
