import 'package:flutter/cupertino.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
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
    // Suscripción en tiempo real a Supabase (Silenciosa y eficiente)
    _subscribeToFleetRealtime();
    // Polling ligero para barcos públicos AIS cada 5 segundos
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
      // Ignorar fallos de red silenciosamente para no molestar la UI
    }
  }

  StreamSubscription<List<Map<String, dynamic>>>? _vesselSubscription;

  void _subscribeToFleetRealtime() {
    try {
      _vesselSubscription = Supabase.instance.client
          .from('vessels')
          .stream(primaryKey: ['id'])
          .listen((List<Map<String, dynamic>> data) {
        if (mounted) {
          setState(() {
            _fleetAssets = data;
          });
        }
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
          color: CupertinoColors.white.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: CupertinoColors.systemGrey4,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              '${asset['name'] ?? 'Desconocido'}',
              style: GoogleFonts.inter(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: CupertinoColors.black,
              ),
            ),
            const SizedBox(height: 12),
            _buildRowDetail(
              CupertinoIcons.location_solid,
              'Coordenadas (SAT)',
              asset['current_lat'] != null
                  ? '${(asset['current_lat'] as num).toStringAsFixed(4)}, ${(asset['current_lng'] as num).toStringAsFixed(4)}'
                  : 'Sin señal🛰️',
            ),
            _buildRowDetail(
              CupertinoIcons.tag,
              'Tipo',
              '${asset['type'] ?? 'Activo'}',
            ),
            _buildRowDetail(
              CupertinoIcons.chart_bar_alt_fill,
              'Estado',
              '${asset['status'] ?? 'OPERATIVO'}',
            ),
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
          color: CupertinoColors.white.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: CupertinoColors.systemGrey4,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              '${ship['name'] ?? 'AIS Target'}',
              style: GoogleFonts.inter(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: CupertinoColors.black,
              ),
            ),
            const SizedBox(height: 12),
            _buildRowDetail(
              CupertinoIcons.speedometer,
              'Velocidad',
              '${ship['speed'] ?? 0} nds',
            ),
            _buildRowDetail(
              CupertinoIcons.compass,
              'Rumbo (COG)',
              '${ship['course'] ?? 0}°',
            ),
            _buildRowDetail(
              CupertinoIcons.location_solid,
              'Ubicación',
              '${(ship['lat'] as num).toStringAsFixed(4)}, ${(ship['lon'] as num).toStringAsFixed(4)}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRowDetail(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, color: CupertinoColors.systemBlue, size: 20),
          const SizedBox(width: 12),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 16,
              color: CupertinoColors.systemGrey,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: CupertinoColors.black,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CupertinoColors.white.withValues(alpha: 0.85),
        border: null,
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Icon(CupertinoIcons.back, size: 28),
                onPressed: () => Navigator.pop(context),
              )
            : CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Icon(CupertinoIcons.bars, size: 28),
                onPressed: () {
                  rootScaffoldKey.currentState?.openDrawer();
                },
              ),
        middle: Text(
          'Flota en Tiempo Real',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
      ),
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: const MapOptions(
              // Centrado inicialmente en la Hidrovía Paraná-Paraguay (aprox. Rosario)
              initialCenter: LatLng(-32.9468, -60.6393),
              initialZoom: 8.0,
            ),
            children: [
              TileLayer(
                // Mapa claro estilo Apple Maps (CartoDB Positron)
                urlTemplate:
                    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
              ),
              MarkerLayer(
                markers: [
                  // Rendering Public AIS Traffic (Green Markers)
                  ..._aisShips.values.map((ship) {
                    double lat = (ship['lat'] as num).toDouble();
                    double lng = (ship['lon'] as num).toDouble();
                    double heading = (ship['heading'] as num?)?.toDouble() ?? 0.0;

                    return Marker(
                      point: LatLng(lat, lng),
                      width: 40,
                      height: 40,
                      child: GestureDetector(
                        onTap: () => _showAisDetails(ship),
                        child: Container(
                          decoration: BoxDecoration(
                            color: CupertinoColors.activeGreen.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Transform.rotate(
                              angle: heading * (3.14159265359 / 180),
                              child: Icon(
                                CupertinoIcons.location_north_fill,
                                color: CupertinoColors.activeGreen,
                                size: 20,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                  // Rendering Private Fleet from Supabase (Neon Blue Markers)
                  ..._fleetAssets.where((v) => v['current_lat'] != null && v['current_lng'] != null).map((asset) {
                    double lat = (asset['current_lat'] as num).toDouble();
                    double lng = (asset['current_lng'] as num).toDouble();

                    return Marker(
                      point: LatLng(lat, lng),
                      width: 50,
                      height: 50,
                      child: GestureDetector(
                        onTap: () => _showFleetDetails(asset),
                        child: Container(
                          decoration: BoxDecoration(
                            color: CupertinoColors.activeBlue.withValues(alpha: 0.25), // Azul Neón estilo Elite
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Transform.rotate(
                              angle: (asset['heading'] != null ? (asset['heading'] as num).toDouble() : 0.0) * (3.14159265359 / 180),
                              child: Icon(
                                CupertinoIcons.location_north_fill,
                                color: CupertinoColors.activeBlue,
                                size: 28,
                                shadows: [
                                  Shadow(
                                    color: CupertinoColors.activeBlue.withValues(alpha: 0.9),
                                    blurRadius: 15,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ],
          ),

          // Floating Button para centrar mapa
          Positioned(
            bottom: 24,
            right: 16,
            child: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                _mapController.move(const LatLng(-32.9468, -60.6393), 8.0);
              },
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: CupertinoColors.white.withValues(alpha: 0.9),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: CupertinoColors.systemGrey.withValues(alpha: 0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: const Icon(
                  CupertinoIcons.location_fill,
                  color: CupertinoColors.activeBlue,
                  size: 24,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

