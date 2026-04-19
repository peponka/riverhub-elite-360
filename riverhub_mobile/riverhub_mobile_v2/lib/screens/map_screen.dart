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
      const String apiBase = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://riverhub-api.onrender.com');
      final response = await http.get(
        Uri.parse('$apiBase/api/n8n/ais-live'),
        headers: {'x-api-key': 'RH_Secure_n8n_X9fL!2026'},
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

  @override
  void dispose() {
    _aisTimer?.cancel();
    _vesselSubscription?.cancel();
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
            options: const MapOptions(initialCenter: LatLng(-32.9468, -60.6393), initialZoom: 8.0),
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
              onPressed: () => _mapController.move(const LatLng(-32.9468, -60.6393), 8.0),
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
        ],
      ),
    );
  }
}
