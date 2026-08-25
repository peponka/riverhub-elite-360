import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'offline_sync_service.dart';

/// GPS Tracker Service for RiverHub Fleet
/// Sends device location to Supabase every 15 seconds
/// so the vessel appears on the web map in real-time.
class GpsTrackerService {
  static final GpsTrackerService _instance = GpsTrackerService._internal();
  factory GpsTrackerService() => _instance;
  GpsTrackerService._internal();

  Timer? _timer;
  bool _isTracking = false;
  String? _vesselId;
  Position? _lastPosition;

  bool get isTracking => _isTracking;
  Position? get lastPosition => _lastPosition;

  /// Start tracking for a specific vessel
  Future<bool> startTracking(String vesselId) async {
    // Check location permissions
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('❌ GPS: Location services disabled');
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('❌ GPS: Permission denied');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      debugPrint('❌ GPS: Permission permanently denied');
      return false;
    }

    _vesselId = vesselId;
    _isTracking = true;

    // Send first position immediately
    await _sendPosition();

    // Then every 15 seconds
    _timer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => _sendPosition(),
    );

    debugPrint('🛰️ GPS Tracker started for vessel: $vesselId');
    return true;
  }

  /// Stop tracking
  void stopTracking() {
    _timer?.cancel();
    _timer = null;
    _isTracking = false;
    debugPrint('🛰️ GPS Tracker stopped');
  }

  /// Get current position and send to Supabase
  Future<void> _sendPosition() async {
    if (!_isTracking || _vesselId == null) return;

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5, // Minimum 5m change
        ),
      );

      _lastPosition = position;

      // Update vessel position in Supabase
      await OfflineSyncService.updateOrQueue(
        'vessels',
        {
          'current_lat': position.latitude,
          'current_lng': position.longitude,
          'heading': position.heading,
          'speed': position.speed * 1.94384, // m/s to knots
          'last_signal': DateTime.now().toIso8601String(),
          'status': 'en_viaje',
        },
        matchColumn: 'id',
        matchValue: _vesselId!,
      );

      debugPrint(
        '📍 GPS: ${position.latitude.toStringAsFixed(4)}, '
        '${position.longitude.toStringAsFixed(4)} → Supabase ✅',
      );
    } catch (e) {
      debugPrint('❌ GPS send error: $e');
    }
  }

  /// Get list of user's vessels to select from
  static Future<List<Map<String, dynamic>>> getMyVessels() async {
    try {
      final response = await Supabase.instance.client
          .from('vessels')
          .select('id, name, type, status')
          .order('name');
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('Error fetching vessels: $e');
      return [];
    }
  }
}
