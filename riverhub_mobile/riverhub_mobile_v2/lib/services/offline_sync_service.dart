import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../widgets/offline_banner.dart';

/// Persists write operations while a vessel has no data connection and replays
/// them in order once connectivity returns. It intentionally stores only data,
/// never credentials or access tokens.
class OfflineSyncService {
  OfflineSyncService._();

  static const _storageKey = 'viabarcazas_offline_operations_v1';
  static bool _initialized = false;
  static bool _flushing = false;

  static Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;
    ConnectivityService.isOnline.addListener(() {
      if (ConnectivityService.isOnline.value) flush();
    });
    if (ConnectivityService.isOnline.value) await flush();
  }

  static Future<void> insertOrQueue(
    String table,
    Map<String, dynamic> data,
  ) async {
    try {
      if (!ConnectivityService.isOnline.value) throw const _OfflineException();
      await Supabase.instance.client.from(table).insert(data);
    } catch (_) {
      await _enqueue({'kind': 'insert', 'table': table, 'data': data});
    }
  }

  static Future<void> updateOrQueue(
    String table,
    Map<String, dynamic> data, {
    required String matchColumn,
    required dynamic matchValue,
  }) async {
    try {
      if (!ConnectivityService.isOnline.value) throw const _OfflineException();
      await Supabase.instance.client
          .from(table)
          .update(data)
          .eq(matchColumn, matchValue);
    } catch (_) {
      await _enqueue({
        'kind': 'update',
        'table': table,
        'data': data,
        'matchColumn': matchColumn,
        'matchValue': matchValue,
      });
    }
  }

  static Future<int> pendingCount() async => (await _read()).length;

  static Future<void> flush() async {
    if (_flushing || !ConnectivityService.isOnline.value) return;
    _flushing = true;
    try {
      final pending = await _read();
      final remaining = <Map<String, dynamic>>[];
      for (final operation in pending) {
        try {
          final table = operation['table'] as String;
          final data = Map<String, dynamic>.from(operation['data'] as Map);
          if (operation['kind'] == 'update') {
            await Supabase.instance.client
                .from(table)
                .update(data)
                .eq(
                  operation['matchColumn'] as String,
                  operation['matchValue'],
                );
          } else {
            await Supabase.instance.client.from(table).insert(data);
          }
        } catch (_) {
          remaining.add(operation);
        }
      }
      await _write(remaining);
    } finally {
      _flushing = false;
    }
  }

  static Future<void> _enqueue(Map<String, dynamic> operation) async {
    final operations = await _read();
    operations.add({
      ...operation,
      'queuedAt': DateTime.now().toUtc().toIso8601String(),
    });
    await _write(operations);
  }

  static Future<List<Map<String, dynamic>>> _read() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null) return [];
    try {
      return List<Map<String, dynamic>>.from(jsonDecode(raw) as List);
    } catch (_) {
      return [];
    }
  }

  static Future<void> _write(List<Map<String, dynamic>> operations) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(operations));
  }
}

class _OfflineException implements Exception {
  const _OfflineException();
}
