import 'package:supabase_flutter/supabase_flutter.dart';

/// Centralized Supabase service for RiverHub Mobile.
/// All modules should use this service to fetch/insert data.
class SupabaseService {
  static SupabaseClient get client => Supabase.instance.client;

  static String get currentUserId => client.auth.currentUser?.id ?? '';

  static String get currentUserEmail =>
      client.auth.currentUser?.email ?? 'Usuario';

  // ============ VESSELS ============
  static Future<List<Map<String, dynamic>>> getVessels() async {
    try {
      final res = await client.from('vessels').select('*');
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  // ============ CREW ============
  static Future<List<Map<String, dynamic>>> getCrewMembers() async {
    try {
      final res = await client.from('crew_members').select('*');
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  static Future<bool> upsertCrewMember(Map<String, dynamic> member) async {
    try {
      await client.from('crew_members').upsert(member);
      return true;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> deleteCrewMember(dynamic id) async {
    try {
      await client.from('crew_members').delete().eq('id', id);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============ MAINTENANCE ============
  static Future<List<Map<String, dynamic>>> getMaintenanceTasks() async {
    try {
      final res = await client
          .from('maintenance_tasks')
          .select('*, vessel:vessels(name)')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  static Future<bool> insertMaintenanceTask(Map<String, dynamic> task) async {
    try {
      await client.from('maintenance_tasks').insert(task);
      return true;
    } catch (e) {
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
      return false;
    }
  }

  // ============ INCIDENTS ============
  static Future<List<Map<String, dynamic>>> getIncidents() async {
    try {
      final res = await client
          .from('incidents')
          .select('*')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  static Future<bool> insertIncident(Map<String, dynamic> incident) async {
    try {
      await client.from('incidents').insert(incident);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============ COMMUNICATIONS ============
  static Future<List<Map<String, dynamic>>> getComms({String? channel}) async {
    try {
      var query = client
          .from('comms')
          .select('*')
          .order('created_at', ascending: true);
      if (channel != null) {
        query = client
            .from('comms')
            .select('*')
            .eq('channel', channel)
            .order('created_at', ascending: true);
      }
      final res = await query;
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  static Future<bool> sendComm(Map<String, dynamic> msg) async {
    try {
      await client.from('comms').insert(msg);
      return true;
    } catch (e) {
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
      final res = await client.from('geofences').select('*');
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getAlerts() async {
    try {
      final res = await client
          .from('alerts')
          .select('*')
          .order('created_at', ascending: false)
          .limit(20);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  // ============ INVENTORY (PANOL) ============
  static Future<List<Map<String, dynamic>>> getInventoryItems() async {
    try {
      final res = await client.from('inventory_items').select('*');
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  static Future<bool> insertInventoryItem(Map<String, dynamic> item) async {
    try {
      await client.from('inventory_items').insert(item);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============ COMMERCIAL ============
  static Future<List<Map<String, dynamic>>> getClients() async {
    try {
      final res = await client.from('clients').select('*');
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getServiceOrders() async {
    try {
      final res = await client
          .from('service_orders')
          .select('*')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
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
        query = client
            .from('cargo_manifests')
            .select('*, barge:vessels(name)')
            .eq('order_id', orderId);
      }
      final res = await query;
      return List<Map<String, dynamic>>.from(res);
    } catch (e) {
      return [];
    }
  }

  // ============ PROFILES ============
  static Future<Map<String, dynamic>?> getProfile() async {
    try {
      final uid = currentUserId;
      if (uid.isEmpty) return null;
      final res = await client
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle();
      return res;
    } catch (e) {
      return null;
    }
  }
}
