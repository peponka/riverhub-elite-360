import 'package:flutter/cupertino.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/gps_tracker_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  List<Map<String, dynamic>> _fleetAssets = [];
  Map<String, dynamic> _aisShips = {};
  Timer? _aisTimer;
  final GpsTrackerService _gpsTracker = GpsTrackerService();
  bool _tracking = false;

  @override
  void initState() {
    super.initState();
    _subscribeToFleetRealtime();
    _startAisPolling();
  }

  void _startAisPolling() {
    _fetchAisPositions();
    _aisTimer = Timer.periodic(const Duration(seconds: 5), (_) => _fetchAisPositions());
  }

  Future<void> _fetchAisPositions() async {
    try {
      const String apiBase = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://riverhub-elite-360.onrender.com');
      final response = await http.get(
        Uri.parse('$apiBase/api/ais-positions'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final vessels = data['vessels'] as List<dynamic>;
        if (mounted) {
          setState(() {
            _aisShips.clear();
            for (var ship in vessels) {
              _aisShips[ship['mmsi'].toString()] = ship;
            }
          });
        }
      }
    } catch (e) {
      // Silently handle network failures
    }
  }

  StreamSubscription<List<Map<String, dynamic>>>? _vesselSubscription;

  void _subscribeToFleetRealtime() {
    try {
      _vesselSubscription = Supabase.instance.client
          .from('vessels')
          .stream(primaryKey: ['id'])
          .listen((List<Map<String, dynamic>> data) {
        if (mounted) setState(() => _fleetAssets = data);
      });
      debugPrint('✅ Flota conectada a Supabase Realtime');
    } catch (e) {
      debugPrint('Error en Supabase Realtime: $e');
    }
  }

  // GPS Tracking toggle
  void _toggleTracking() async {
    if (_tracking) {
      _gpsTracker.stopTracking();
      setState(() => _tracking = false);
      return;
    }

    // Fetch vessels and show selector
    final vessels = await GpsTrackerService.getMyVessels();
    if (vessels.isEmpty) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (_) => CupertinoAlertDialog(
            title: const Text('Sin embarcaciones'),
            content: const Text('Agrega una embarcación primero desde la web.'),
            actions: [CupertinoDialogAction(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
          ),
        );
      }
      return;
    }

    if (!mounted) return;
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        height: 320,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            Text('Seleccionar Embarcación', style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
            Text('GPS EN VIVO', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: vessels.length,
                itemBuilder: (_, i) {
                  final v = vessels[i];
                  return GestureDetector(
                    onTap: () async {
                      Navigator.pop(ctx);
                      final ok = await _gpsTracker.startTracking(v['id']);
                      if (ok && mounted) setState(() => _tracking = true);
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.separator, width: 0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(children: [
                        Icon(CupertinoIcons.helm, color: AppColors.textPrimary, size: 20),
                        const SizedBox(width: 12),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(v['name'] ?? 'Sin nombre', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                            Text('${v['type'] ?? 'Embarcación'} • ${v['status'] ?? 'Operativo'}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                          ],
                        )),
                        Icon(CupertinoIcons.chevron_right, color: AppColors.textSecondary, size: 16),
                      ]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _aisTimer?.cancel();
    _vesselSubscription?.cancel();
    _gpsTracker.stopTracking();
    super.dispose();
  }

  void _showFleetDetails(dynamic asset) {
    showCupertinoModalPopup(
      context: context,
      builder: (context) => Container(
        height: 280,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 18),
            Text('${asset['name'] ?? 'Desconocido'}', style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
            const SizedBox(height: 14),
            _detailRow(CupertinoIcons.location_solid, 'Coordenadas',
              asset['current_lat'] != null
                  ? '${(asset['current_lat'] as num).toStringAsFixed(4)}, ${(asset['current_lng'] as num).toStringAsFixed(4)}'
                  : 'Sin señal 🛰️'),
            _detailRow(CupertinoIcons.tag, 'Tipo', '${asset['type'] ?? 'Activo'}'),
            _detailRow(CupertinoIcons.chart_bar_alt_fill, 'Estado', '${asset['status'] ?? 'OPERATIVO'}'),
          ],
        ),
      ),
    );
  }

  void _showAisDetails(dynamic ship) {
    showCupertinoModalPopup(
      context: context,
      builder: (context) => Container(
        height: 250,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 18),
            Text('${ship['name'] ?? 'AIS Target'}', style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
            const SizedBox(height: 14),
            _detailRow(CupertinoIcons.speedometer, 'Velocidad', '${ship['speed'] ?? 0} nds'),
            _detailRow(CupertinoIcons.compass, 'Rumbo (COG)', '${ship['course'] ?? 0}°'),
            _detailRow(CupertinoIcons.location_solid, 'Ubicación', '${(ship['lat'] as num).toStringAsFixed(4)}, ${(ship['lon'] as num).toStringAsFixed(4)}'),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(children: [
        Icon(icon, color: AppColors.textSecondary, size: 18),
        const SizedBox(width: 12),
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
        const Spacer(),
        Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary),
                onPressed: () => Navigator.pop(context),
              )
            : CupertinoButton(
                padding: EdgeInsets.zero,
                child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary),
                onPressed: () => rootScaffoldKey.currentState?.openDrawer(),
              ),
        middle: Text('Mapa en Vivo', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: const MapOptions(initialCenter: LatLng(-29.5, -59.0), initialZoom: 5.5),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
              ),
              MarkerLayer(
                markers: [
                  // AIS Traffic (monochrome)
                  ..._aisShips.values.map((ship) {
                    double lat = (ship['lat'] as num).toDouble();
                    double lng = (ship['lon'] as num).toDouble();
                    double heading = (ship['heading'] as num?)?.toDouble() ?? 0.0;
                    return Marker(
                      point: LatLng(lat, lng), width: 36, height: 36,
                      child: GestureDetector(
                        onTap: () => _showAisDetails(ship),
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Center(child: Transform.rotate(
                            angle: heading * (3.14159265359 / 180),
                            child: Icon(CupertinoIcons.location_north_fill, color: AppColors.success, size: 18),
                          )),
                        ),
                      ),
                    );
                  }),
                  // Private Fleet (dark accent)
                  ..._fleetAssets.where((v) => v['current_lat'] != null && v['current_lng'] != null).map((asset) {
                    double lat = (asset['current_lat'] as num).toDouble();
                    double lng = (asset['current_lng'] as num).toDouble();
                    return Marker(
                      point: LatLng(lat, lng), width: 44, height: 44,
                      child: GestureDetector(
                        onTap: () => _showFleetDetails(asset),
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.textPrimary.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Center(child: Transform.rotate(
                            angle: (asset['heading'] != null ? (asset['heading'] as num).toDouble() : 0.0) * (3.14159265359 / 180),
                            child: Icon(CupertinoIcons.location_north_fill, color: AppColors.textPrimary, size: 24),
                          )),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ],
          ),

          // Floating recenter button
          Positioned(
            bottom: 24, right: 16,
            child: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () => _mapController.move(const LatLng(-29.5, -59.0), 5.5),
              child: Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.separator, width: 0.5),
                ),
                child: Icon(CupertinoIcons.location_fill, color: AppColors.textPrimary, size: 20),
              ),
            ),
          ),

          // GPS Tracking button
          Positioned(
            bottom: 24, right: 72,
            child: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: _toggleTracking,
              child: Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: _tracking ? AppColors.success : AppColors.backgroundSecondary,
                  shape: BoxShape.circle,
                  border: Border.all(color: _tracking ? AppColors.success : AppColors.separator, width: 0.5),
                ),
                child: Icon(
                  _tracking ? CupertinoIcons.radiowaves_right : CupertinoIcons.antenna_radiowaves_left_right,
                  color: _tracking ? CupertinoColors.white : AppColors.textPrimary,
                  size: 20,
                ),
              ),
            ),
          ),

          // Tracking status pill
          if (_tracking)
            Positioned(
              top: 8, left: 16, right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.95),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(children: [
                  const Icon(CupertinoIcons.antenna_radiowaves_left_right, color: CupertinoColors.white, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'GPS ACTIVO — Enviando cada 15s',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: CupertinoColors.white),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: _toggleTracking,
                    child: Text('DETENER', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: CupertinoColors.white)),
                  ),
                ]),
              ),
            ),
        ],
      ),
    );
  }
}
