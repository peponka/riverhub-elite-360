import 'dart:async';
import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:flutter/foundation.dart' show debugPrint, kDebugMode;
import 'theme/app_colors.dart';
import 'screens/map_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/bitacora_screen.dart';
import 'screens/profile_screen.dart';
import 'widgets/app_drawer.dart';
import 'screens/splash_screen.dart';
import 'widgets/offline_banner.dart';
import 'services/offline_sync_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/locale_service.dart';
import 'services/supabase_service.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final GlobalKey<material.ScaffoldState> rootScaffoldKey =
    GlobalKey<material.ScaffoldState>();

// Local notifications for foreground messages
final FlutterLocalNotificationsPlugin _localNotifs =
    FlutterLocalNotificationsPlugin();

// Background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('BG message: ${message.notification?.title}');
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Supabase credentials via --dart-define (never hardcode in production)
  const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://nfybnnpdrvyxucgpqmmo.supabase.co',
  );
  const supabaseKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meWJubnBkcnZ5eHVjZ3BxbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzYyMTQsImV4cCI6MjA4MzExMjIxNH0.hMCCfcdSeXBF0Ed8g3tzhNH0M3foeiAYXG12p34JGRc',
  );
  try {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  } catch (e) {
    debugPrint('Supabase init error: $e');
  }

  // Save FCM token after auth state changes (not in main where user is null)
  Supabase.instance.client.auth.onAuthStateChange.listen((data) {
    if (data.event == AuthChangeEvent.signedIn ||
        data.event == AuthChangeEvent.tokenRefreshed) {
      _saveFcmToken();
    }
  });

  // Global Error Handlers para Refresh Token Bug (Supabase)
  FlutterError.onError = (details) {
    final errorStr = details.exceptionAsString().toLowerCase();
    if (errorStr.contains('refresh_token') ||
        errorStr.contains('already_used') ||
        errorStr.contains('invalid refresh token')) {
      SupabaseService.forceSignOutCorruptSession();
      return;
    }
    FlutterError.presentError(details);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    final errorStr = error.toString().toLowerCase();
    // Only silence refresh token corruption — let real errors propagate
    if (errorStr.contains('refresh_token') ||
        errorStr.contains('already_used') ||
        errorStr.contains('invalid refresh token')) {
      SupabaseService.forceSignOutCorruptSession();
      return true;
    }
    // Silence network errors that are not actionable
    if (errorStr.contains('socketexception') ||
        errorStr.contains('timeoutexception') ||
        errorStr.contains('connection refused')) {
      if (kDebugMode)
        debugPrint('\u26a0\ufe0f Network error suppressed: $error');
      return true;
    }
    // Keep unexpected failures visible to Flutter's default error reporting.
    debugPrint('\u274c Unhandled error: $error');
    return false;
  };

  ConnectivityService.startMonitoring();
  await OfflineSyncService.initialize();

  runApp(const RiverHubMobileApp());

  // Push notifications must never delay the first rendered screen.
  unawaited(_initializeFirebase());
}

Future<void> _initializeFirebase() async {
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);
  } catch (e) {
    // Debug APKs can intentionally omit the private google-services.json file.
    debugPrint('Firebase unavailable: $e');
    return;
  }

  try {
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);
    debugPrint('FCM Token: ${await messaging.getToken()}');

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _localNotifs.initialize(
      const InitializationSettings(android: androidInit),
    );

    messaging.onTokenRefresh.listen((_) => _saveFcmToken());
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final notification = message.notification;
      if (notification == null) return;
      _localNotifs.show(
        notification.hashCode,
        notification.title ?? 'ViaBarcazas',
        notification.body ?? '',
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'viabarcazas_channel',
            'ViaBarcazas Notificaciones',
            channelDescription: 'Notificaciones de ViaBarcazas',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
        ),
      );
    });
  } catch (e) {
    debugPrint('FCM setup error: $e');
  }
}

Future<void> _saveFcmToken() async {
  try {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      await Supabase.instance.client
          .from('user_profiles')
          .update({'fcm_token': token})
          .eq('user_id', user.id);
      debugPrint('FCM token saved to Supabase');
    }
  } catch (e) {
    debugPrint('Save FCM token: $e');
  }
}

class RiverHubMobileApp extends StatefulWidget {
  const RiverHubMobileApp({super.key});

  @override
  State<RiverHubMobileApp> createState() => _RiverHubMobileAppState();
}

class _RiverHubMobileAppState extends State<RiverHubMobileApp> {
  bool _splashDone = false;
  bool? _loggedIn;

  @override
  void initState() {
    super.initState();
    // Check initial session
    final session = Supabase.instance.client.auth.currentSession;
    _loggedIn = session != null;

    // Listen for auth changes AFTER initial build
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (!mounted) return;
      final hasSession = data.session != null;
      if (hasSession != _loggedIn) {
        setState(() {
          _loggedIn = hasSession;
          _splashDone = true; // skip splash on login/logout transitions
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LocaleService.notifier,
      builder: (context, locale, _) {
        return CupertinoApp(
          title: 'ViaBarcazas',
          debugShowCheckedModeBanner: false,
          locale: material.Locale(locale == 'en' ? 'en' : 'es'),
          theme: CupertinoThemeData(
            brightness: Brightness.light,
            primaryColor: AppColors.accent,
            scaffoldBackgroundColor: AppColors.backgroundPrimary,
            barBackgroundColor: AppColors.backgroundSecondary,
            textTheme: CupertinoTextThemeData(
              primaryColor: AppColors.accent,
              textStyle: GoogleFonts.inter(
                color: AppColors.textPrimary,
                fontSize: 15,
              ),
              navLargeTitleTextStyle: GoogleFonts.newsreader(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w400,
                fontSize: 34,
              ),
              navTitleTextStyle: GoogleFonts.inter(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 17,
              ),
            ),
          ),
          localizationsDelegates: const [
            material.DefaultMaterialLocalizations.delegate,
          ],
          home: _buildHome(),
        );
      },
    );
  }

  Widget _buildHome() {
    final destination = (_loggedIn == true)
        ? const MainWrapper()
        : const LoginScreen();

    // Show splash only on first app launch
    if (!_splashDone) {
      return SplashScreen(
        destination: destination,
        isAuthenticated: _loggedIn == true,
        onComplete: () {
          if (mounted) setState(() => _splashDone = true);
        },
      );
    }
    return destination;
  }
}

class MainWrapper extends StatelessWidget {
  const MainWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return material.Material(
      child: material.Scaffold(
        key: rootScaffoldKey,
        drawer: const AppDrawer(),
        body: const OfflineBanner(child: MainTabScaffold()),
      ),
    );
  }
}

class MainTabScaffold extends StatelessWidget {
  const MainTabScaffold({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        activeColor: AppColors.textPrimary,
        inactiveColor: AppColors.textSecondary,
        iconSize: 24,
        border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        items: [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.square_grid_2x2),
            activeIcon: Icon(CupertinoIcons.square_grid_2x2_fill),
            label: LocaleService.t('tab_panel'),
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.map),
            activeIcon: Icon(CupertinoIcons.map_fill),
            label: LocaleService.t('tab_fleet'),
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.book),
            activeIcon: Icon(CupertinoIcons.book_fill),
            label: LocaleService.t('tab_logbook'),
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.person),
            activeIcon: Icon(CupertinoIcons.person_solid),
            label: LocaleService.t('tab_profile'),
          ),
        ],
      ),
      tabBuilder: (BuildContext context, int index) {
        return CupertinoTabView(
          builder: (BuildContext context) {
            switch (index) {
              case 0:
                return const DashboardScreen();
              case 1:
                return const MapScreen();
              case 2:
                return const BitacoraScreen();
              case 3:
                return const ProfileScreen();
              default:
                return const DashboardScreen();
            }
          },
        );
      },
    );
  }
}
