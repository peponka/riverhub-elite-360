import 'package:flutter_test/flutter_test.dart';
import 'package:riverhub_mobile_v2/services/supabase_service.dart';

void main() {
  group('SupabaseService', () {
    test('keeps default list queries bounded', () {
      expect(SupabaseService.defaultLimit, 200);
      expect(SupabaseService.defaultLimit, lessThanOrEqualTo(500));
    });
  });
}
