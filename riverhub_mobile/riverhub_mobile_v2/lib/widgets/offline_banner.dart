import 'dart:async';
import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show Colors, Material;
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../services/locale_service.dart';

/// Lightweight connectivity checker — no external packages needed.
class ConnectivityService {
  ConnectivityService._();
  static final ValueNotifier<bool> isOnline = ValueNotifier<bool>(true);
  static Timer? _timer;

  static void startMonitoring() {
    _check(); // immediate check
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => _check());
  }

  static void stopMonitoring() {
    _timer?.cancel();
    _timer = null;
  }

  static Future<void> _check() async {
    try {
      final result = await InternetAddress.lookup(
        'google.com',
      ).timeout(const Duration(seconds: 5));
      isOnline.value = result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } on SocketException catch (_) {
      isOnline.value = false;
    } on TimeoutException catch (_) {
      isOnline.value = false;
    } catch (_) {
      isOnline.value = false;
    }
  }
}

/// Banner that appears at the top when offline.
class OfflineBanner extends StatelessWidget {
  final Widget child;
  const OfflineBanner({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: ConnectivityService.isOnline,
      builder: (context, online, _) {
        return Column(
          children: [
            if (!online)
              Material(
                child: Container(
                  width: double.infinity,
                  padding: EdgeInsets.only(
                    top: MediaQuery.of(context).padding.top + 4,
                    bottom: 6,
                    left: 16,
                    right: 16,
                  ),
                  color: AppColors.warning,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        CupertinoIcons.wifi_slash,
                        size: 14,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        LocaleService.current == 'en'
                            ? 'No internet connection'
                            : LocaleService.current == 'pt'
                            ? 'Sem conexão com a internet'
                            : 'Sin conexión a internet',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            Expanded(child: child),
          ],
        );
      },
    );
  }
}
