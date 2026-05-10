import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:supabase_flutter/supabase_flutter.dart';

/// AI Intelligence Service — calls backend Gemini endpoints for:
/// - Predictive Maintenance
/// - Fuel Anomaly Detection
/// - Convoy Optimization
/// - Conversational Chat
class AIService {
  static const String _apiBase = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://riverhub-elite-360.onrender.com',
  );

  static String get _token =>
      Supabase.instance.client.auth.currentSession?.accessToken ?? '';

  static String get _companyId =>
      Supabase.instance.client.auth.currentUser?.userMetadata?['company_id'] as String? ??
      'a1b2c3d4-0001-4000-8000-000000000001';

  /// POST helper using dart:io HttpClient
  /// Render free tier cold-starts can take 60s, plus Gemini needs ~10s
  static Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 90);
    try {
      final uri = Uri.parse('$_apiBase$path');
      debugPrint('[AIService] POST $uri');
      final request = await client.postUrl(uri);
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer $_token');
      request.write(jsonEncode(body));
      final response = await request.close().timeout(const Duration(seconds: 120));
      final responseBody = await response.transform(utf8.decoder).join();
      debugPrint('[AIService] Response ${response.statusCode}: ${responseBody.substring(0, responseBody.length.clamp(0, 200))}');
      if (response.statusCode >= 400) {
        throw Exception('Server error ${response.statusCode}: $responseBody');
      }
      return jsonDecode(responseBody) as Map<String, dynamic>;
    } finally {
      client.close();
    }
  }

  // ── Predictive Maintenance ──
  // Returns predictions list, or throws on error
  static Future<List<Map<String, dynamic>>> predictMaintenance() async {
    final data = await _post('/api/ai/predict-maintenance', {'companyId': _companyId});
    return List<Map<String, dynamic>>.from(data['predictions'] ?? []);
  }

  // ── Fuel Anomalies ──
  static Future<List<Map<String, dynamic>>> fuelAnomalies() async {
    final data = await _post('/api/ai/fuel-anomalies', {'companyId': _companyId});
    return List<Map<String, dynamic>>.from(data['anomalies'] ?? []);
  }

  // ── Convoy Optimizer ──
  static Future<Map<String, dynamic>> optimizeConvoy({String destination = ''}) async {
    final data = await _post('/api/ai/optimize-convoy', {
      'companyId': _companyId,
      'destination': destination,
    });
    return Map<String, dynamic>.from(data['suggestion'] ?? {});
  }

  // ── Gather Context Helper ──
  static Future<String> _gatherContext() async {
    final sb = Supabase.instance.client;
    String ctx = '';
    try {
      final v = await sb.from('vessels').select().limit(200);
      if ((v as List).isNotEmpty) ctx += 'Flota: ${jsonEncode(v)}\n';
      
      final ais = await sb.from('ais_traffic').select('ship_name,latitude,longitude,speed,course,updated_at').limit(200);
      if ((ais as List).isNotEmpty) ctx += 'Posiciones AIS: ${jsonEncode(ais)}\n';
      
      final vj = await sb.from('voyages').select().limit(100);
      if ((vj as List).isNotEmpty) ctx += 'Viajes: ${jsonEncode(vj)}\n';
      
      final fl = await sb.from('fuel_logs').select().limit(50);
      if ((fl as List).isNotEmpty) ctx += 'Combustible: ${jsonEncode(fl)}\n';
      
      final mt = await sb.from('maintenance_tasks').select().limit(50);
      if ((mt as List).isNotEmpty) ctx += 'Mantenimiento: ${jsonEncode(mt)}\n';
    } catch (e) {
      debugPrint('[AIService] _gatherContext error: $e');
    }
    return ctx;
  }

  static final List<Map<String, String>> _chatHistory = [];

  // ── Conversational Chat (Gemini) ──
  static Future<String> chat(String message) async {
    try {
      final contextData = await _gatherContext();
      final data = await _post('/api/ai/chat', {
        'message': message,
        'context': 'Operador de flota, company_id: $_companyId\n$contextData',
        'history': _chatHistory,
      });
      
      final answer = data['response'] as String? ?? 'Sin respuesta';
      
      _chatHistory.add({'role': 'user', 'text': message});
      _chatHistory.add({'role': 'model', 'text': answer});
      if (_chatHistory.length > 20) {
        _chatHistory.removeRange(0, _chatHistory.length - 20);
      }
      
      return answer;
    } catch (e) {
      debugPrint('[AIService] chat error: $e');
      return 'Error de conexión: $e';
    }
  }
}
