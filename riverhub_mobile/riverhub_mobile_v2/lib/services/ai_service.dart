import 'dart:async';
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
      Supabase.instance.client.auth.currentUser?.userMetadata?['company_id'] as String? ?? '';

  /// Check internet connectivity before making requests
  static Future<bool> _isOnline() async {
    try {
      final result = await InternetAddress.lookup('supabase.co')
          .timeout(const Duration(seconds: 3));
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

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
  static Future<List<Map<String, dynamic>>> predictMaintenance() async {
    if (!await _isOnline()) {
      return [{'vessel': 'Sin conexion', 'component': 'N/A', 'probability': 0, 'days_until': 0, 'action': 'Conectate a internet para recibir predicciones', 'severity': 'low'}];
    }
    try {
      final data = await _post('/api/ai/predict-maintenance', {'companyId': _companyId});
      return List<Map<String, dynamic>>.from(data['predictions'] ?? []);
    } on SocketException {
      return [{'vessel': 'Error de red', 'component': 'N/A', 'probability': 0, 'days_until': 0, 'action': 'Verificar conexion a internet', 'severity': 'low'}];
    } catch (e) {
      debugPrint('[AIService] predictMaintenance error: $e');
      return [];
    }
  }

  // ── Fuel Anomalies ──
  static Future<List<Map<String, dynamic>>> fuelAnomalies() async {
    if (!await _isOnline()) {
      return [{'vessel': 'Sin conexion', 'type': 'offline', 'severity': 'low', 'description': 'Conectate a internet'}];
    }
    try {
      final data = await _post('/api/ai/fuel-anomalies', {'companyId': _companyId});
      return List<Map<String, dynamic>>.from(data['anomalies'] ?? []);
    } on SocketException {
      return [{'vessel': 'Error de red', 'type': 'offline', 'severity': 'low', 'description': 'Verificar conexion'}];
    } catch (e) {
      debugPrint('[AIService] fuelAnomalies error: $e');
      return [];
    }
  }

  // ── Convoy Optimizer ──
  static Future<Map<String, dynamic>> optimizeConvoy({String destination = ''}) async {
    if (!await _isOnline()) {
      return {'config': 'Sin conexion', 'risk_score': 0, 'warnings': ['Sin conexion a internet'], 'recommendation': 'Conectate a internet para optimizar'};
    }
    try {
      final data = await _post('/api/ai/optimize-convoy', {
        'companyId': _companyId,
        'destination': destination,
      });
      return Map<String, dynamic>.from(data['suggestion'] ?? {});
    } on SocketException {
      return {'config': 'Error de red', 'risk_score': 0, 'warnings': ['Verificar conexion'], 'recommendation': 'Sin conectividad'};
    } catch (e) {
      debugPrint('[AIService] optimizeConvoy error: $e');
      return {};
    }
  }

  // ── Gather Context Helper ──
  static Future<String> _gatherContext() async {
    final sb = Supabase.instance.client;
    String ctx = '';
    try {
      final v = await sb.from('vessels').select('id,name,type,status').limit(50).timeout(const Duration(seconds: 10));
      if ((v as List).isNotEmpty) ctx += 'Flota: ${jsonEncode(v)}\n';
      
      final ais = await sb.from('ais_traffic').select('ship_name,latitude,longitude,speed,course').limit(30).timeout(const Duration(seconds: 10));
      if ((ais as List).isNotEmpty) ctx += 'Posiciones AIS: ${jsonEncode(ais)}\n';
      
      final vj = await sb.from('voyages').select('vessel_name,status,origin_port,destination_port').limit(10).timeout(const Duration(seconds: 10));
      if ((vj as List).isNotEmpty) ctx += 'Viajes: ${jsonEncode(vj)}\n';
      
      final mt = await sb.from('maintenance_tasks').select('vessel_name,description,status,priority').eq('status', 'pending').limit(10).timeout(const Duration(seconds: 10));
      if ((mt as List).isNotEmpty) ctx += 'Mantenimiento: ${jsonEncode(mt)}\n';
    } catch (e) {
      debugPrint('[AIService] _gatherContext error: $e');
    }
    return ctx;
  }

  static final List<Map<String, String>> _chatHistory = [];

  /// Clear session data on logout to prevent data leaking between users
  static void clearSession() {
    _chatHistory.clear();
  }

  // ── Conversational Chat (Gemini) ──
  static Future<String> chat(String message) async {
    if (!await _isOnline()) {
      return 'Sin conexion a internet. Verifica tu WiFi o datos moviles e intenta de nuevo.';
    }
    try {
      final contextData = await _gatherContext();
      final data = await _post('/api/ai/chat', {
        'message': message,
        'context': contextData,
        'history': _chatHistory,
      });
      
      final answer = data['response'] as String? ?? 'Sin respuesta';
      
      _chatHistory.add({'role': 'user', 'text': message});
      _chatHistory.add({'role': 'model', 'text': answer});
      if (_chatHistory.length > 20) {
        _chatHistory.removeRange(0, _chatHistory.length - 20);
      }
      
      return answer;
    } on SocketException {
      return 'Error de red. Verifica tu conexion a internet.';
    } on TimeoutException {
      return 'El servidor tardo demasiado en responder. Intenta de nuevo.';
    } catch (e) {
      debugPrint('[AIService] chat error: $e');
      return 'Error de conexion: $e';
    }
  }
}
