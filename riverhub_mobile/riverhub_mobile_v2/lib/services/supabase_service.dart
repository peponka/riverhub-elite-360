import 'package:flutter/foundation.dart' show debugPrint;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'ai_service.dart';

/// Centralized Supabase service for RiverHub Mobile.
/// All modules should use this service to fetch/insert data.
///
/// Security: All SELECT queries have .limit() to prevent unbounded data transfer.
/// Errors are logged (debugPrint) but never crash the UI.
class SupabaseService {
  static SupabaseClient get client => Supabase.instance.client;

  static String get currentUserId => client.auth.currentUser?.id ?? '';

  static String get currentUserEmail =>
      client.auth.currentUser?.email ?? 'Usuario';

  static bool _isForceSigningOut = false;

  static Future<void> forceSignOutCorruptSession() async {
    if (_isForceSigningOut) return;
    _isForceSigningOut = true;
    debugPrint('🔴 forceSignOutCorruptSession: limpiando sesión corrupta...');
    try {
      AIService.clearSession();
      await client.auth.signOut(scope: SignOutScope.local);
    } catch (e) {
      debugPrint('⚠️ forceSignOut fallback: $e');
    } finally {
      _isForceSigningOut = false;
    }
  }

  /// Default query limit for list endpoints
  static const int _defaultLimit = 200;

  // ============ VESSELS ============
  static Future<List<Map<String, dynamic>>> getVessels() async {
    try {
      final res = await client.from('vessels').select('*').limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getVessels error: $e');
      return [];
    }
  }

  // ============ CREW ============
  static Future<List<Map<String, dynamic>>> getCrewMembers() async {
    try {
      final res = await client.from('crew_members').select('*').limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getCrewMembers error: $e');
      return [];
    }
  }

  static Future<bool> upsertCrewMember(Map<String, dynamic> member) async {
    try {
      await client.from('crew_members').upsert(member);
      return true;
    } catch (e) {
      debugPrint('[SupabaseService] upsertCrewMember error: $e');
      return false;
    }
  }

  static Future<bool> deleteCrewMember(dynamic id) async {
    try {
      await client.from('crew_members').delete().eq('id', id);
      return true;
    } catch (e) {
      debugPrint('[SupabaseService] deleteCrewMember error: $e');
      return false;
    }
  }

  // ============ MAINTENANCE ============
  static Future<List<Map<String, dynamic>>> getMaintenanceTasks() async {
    try {
      final res = await client
          .from('maintenance_tasks')
          .select('*, vessel:vessels(name)')
          .order('created_at', ascending: false)
          .limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getMaintenanceTasks error: $e');
      return [];
    }
  }

  static Future<bool> insertMaintenanceTask(Map<String, dynamic> task) async {
    try {
      await client.from('maintenance_tasks').insert(task);
      return true;
    } catch (e) {
      debugPrint('[SupabaseService] insertMaintenanceTask error: $e');
      return false;
    }
  }

  static Future<bool> updateMaintenanceStatus(String id, String status) async {
    try {
      await client
          .from('maintenance_tasks')
          .update({'status': status})
          .eq('id', id);
      return true;
    } catch (e) {
      debugPrint('[SupabaseService] updateMaintenanceStatus error: $e');
      return false;
    }
  }

  // ============ INCIDENTS ============
  static Future<List<Map<String, dynamic>>> getIncidents() async {
    try {
      final res = await client
          .from('incidents')
          .select('*')
          .order('created_at', ascending: false)
          .limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getIncidents error: $e');
      return [];
    }
  }

  static Future<bool> insertIncident(Map<String, dynamic> incident) async {
    try {
      await client.from('incidents').insert(incident);
      return true;
    } catch (e) {
      debugPrint('[SupabaseService] insertIncident error: $e');
      return false;
    }
  }

  // ============ COMMUNICATIONS ============
  static Future<List<Map<String, dynamic>>> getComms({String? channel}) async {
    try {
      var query = client
          .from('comms')
          .select('*');
      if (channel != null) {
        query = query.eq('channel', channel);
      }
      final res = await query
          .order('created_at', ascending: true)
          .limit(500); // Higher limit for chat-like data
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getComms error: $e');
      return [];
    }
  }

  static Future<bool> sendComm(Map<String, dynamic> msg) async {
    try {
      await client.from('comms').insert(msg);
      return true;
    } catch (e) {
      debugPrint('[SupabaseService] sendComm error: $e');
      return false;
    }
  }

  static RealtimeChannel subscribeComms(
    void Function(Map<String, dynamic>) onNew,
  ) {
    return client
        .channel('comms_channel')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'comms',
          callback: (payload) {
            onNew(payload.newRecord);
          },
        )
        .subscribe();
  }

  // ============ MONITORING ============
  static Future<List<Map<String, dynamic>>> getGeofences() async {
    try {
      final res = await client.from('geofences').select('*').limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getGeofences error: $e');
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getAlerts() async {
    try {
      final res = await client
          .from('alerts')
          .select('*')
          .order('created_at', ascending: false)
          .limit(50);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getAlerts error: $e');
      return [];
    }
  }

  // ============ INVENTORY (PANOL) ============
  static Future<List<Map<String, dynamic>>> getInventoryItems() async {
    try {
      final res = await client.from('inventory_items').select('*').limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getInventoryItems error: $e');
      return [];
    }
  }

  static Future<bool> insertInventoryItem(Map<String, dynamic> item) async {
    try {
      await client.from('inventory_items').insert(item);
      return true;
    } catch (e) {
      debugPrint('[SupabaseService] insertInventoryItem error: $e');
      return false;
    }
  }

  // ============ COMMERCIAL ============
  static Future<List<Map<String, dynamic>>> getClients() async {
    try {
      final res = await client.from('clients').select('*').limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getClients error: $e');
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getServiceOrders() async {
    try {
      final res = await client
          .from('service_orders')
          .select('*')
          .order('created_at', ascending: false)
          .limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getServiceOrders error: $e');
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getCargoManifests({
    String? orderId,
  }) async {
    try {
      var query = client
          .from('cargo_manifests')
          .select('*, barge:vessels(name)');
      if (orderId != null) {
        query = query.eq('order_id', orderId);
      }
      final res = await query.limit(_defaultLimit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getCargoManifests error: $e');
      return [];
    }
  }

  // ============ PROFILES ============
  static Future<Map<String, dynamic>?> getProfile() async {
    try {
      final uid = currentUserId;
      if (uid.isEmpty) return null;
      final res = await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle();
      return res;
    } catch (e) {
      debugPrint('[SupabaseService] getProfile error: $e');
      return null;
    }
  }

  // ============ LOGS (BITACORA) ============
  static Future<List<Map<String, dynamic>>> getLogs({
    String? actionType,
    int limit = 100,
  }) async {
    try {
      var query = client.from('logs').select('*');
      if (actionType != null) {
        query = query.eq('action_type', actionType);
      }
      final res = await query
          .order('created_at', ascending: false)
          .limit(limit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getLogs error: $e');
      return [];
    }
  }

  // ============ VOYAGES ============
  static Future<List<Map<String, dynamic>>> getVoyages({int limit = 100}) async {
    try {
      final res = await client
          .from('voyages')
          .select('*')
          .order('created_at', ascending: false)
          .limit(limit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getVoyages error: $e');
      return [];
    }
  }

  // ============ FUEL LOGS ============
  static Future<List<Map<String, dynamic>>> getFuelLogs({int limit = 100}) async {
    try {
      final res = await client
          .from('fuel_logs')
          .select('*')
          .order('created_at', ascending: false)
          .limit(limit);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      debugPrint('[SupabaseService] getFuelLogs error: $e');
      return [];
    }
  }
}
