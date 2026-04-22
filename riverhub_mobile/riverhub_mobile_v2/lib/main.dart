import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:flutter/foundation.dart' show debugPrint;
import 'theme/app_colors.dart';
import 'screens/map_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/bitacora_screen.dart';
import 'screens/profile_screen.dart';
import 'widgets/app_drawer.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final GlobalKey<material.ScaffoldState> rootScaffoldKey =
    GlobalKey<material.ScaffoldState>();

// Local notifications for foreground messages
final FlutterLocalNotificationsPlugin _localNotifs = FlutterLocalNotificationsPlugin();

// Background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('BG message: ${message.notification?.title}');
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase init
  try {
    await Firebase.initializeApp();
    debugPrint('Firebase initialized');
  } catch (e) {
    debugPrint('Firebase init error: $e');
  }

  // FCM setup
  try {
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);
    final messaging = FirebaseMessaging.instance;
    
    // Request permission
    await messaging.requestPermission(alert: true, badge: true, sound: true);
    
    // Get token
    final token = await messaging.getToken();
    debugPrint('FCM Token: $token');
    
    // Setup local notifications for foreground
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);
    await _localNotifs.initialize(initSettings);
    
    // Foreground message handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final notification = message.notification;
      if (notification != null) {
        _localNotifs.show(
          notification.hashCode,
          notification.title ?? 'Fluvia',
          notification.body ?? '',
          const NotificationDetails(
            android: AndroidNotificationDetails(
              'fluvia_channel', 'Fluvia Notificaciones',
              channelDescription: 'Notificaciones de Fluvia',
              importance: Importance.high,
              priority: Priority.high,
              icon: '@mipmap/ic_launcher',
            ),
          ),
        );
      }
    });
  } catch (e) {
    debugPrint('FCM setup error: $e');
  }

  try {
    await Supabase.initialize(
      url: 'https://nfybnnpdrvyxucgpqmmo.supabase.co',
      anonKey: 'REDACTED_SUPABASE_ANON_KEY',
    );
  } catch (e) {
    debugPrint('Supabase init error: $e');
  }

  // Save FCM token after auth state changes (not in main where user is null)
  Supabase.instance.client.auth.onAuthStateChange.listen((data) {
    if (data.event == AuthChangeEvent.signedIn || data.event == AuthChangeEvent.tokenRefreshed) {
      _saveFcmToken();
    }
  });

  // Also listen for FCM token refreshes
  FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
    _saveFcmToken();
  });

  runApp(const RiverHubMobileApp());
}

Future<void> _saveFcmToken() async {
  try {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      await Supabase.instance.client.from('user_profiles').update({'fcm_token': token}).eq('user_id', user.id);
      debugPrint('FCM token saved to Supabase');
    }
  } catch (e) {
    debugPrint('Save FCM token: $e');
  }
}

class RiverHubMobileApp extends StatelessWidget {
  const RiverHubMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      title: 'Fluvia',
      debugShowCheckedModeBanner: false,
      locale: const material.Locale('en', 'US'),
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
      home: StreamBuilder<AuthState>(
        stream: Supabase.instance.client.auth.onAuthStateChange,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const material.Scaffold(
              backgroundColor: AppColors.backgroundPrimary,
              body: Center(
                child: CupertinoActivityIndicator(),
              ),
            );
          }
          final session = snapshot.data?.session;
          if (session != null) {
            return const MainWrapper();
          }
          return const LoginScreen();
        },
      ),
    );
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
        body: const MainTabScaffold(),
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
        items: const [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.square_grid_2x2),
            activeIcon: Icon(CupertinoIcons.square_grid_2x2_fill),
            label: 'Panel',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.map),
            activeIcon: Icon(CupertinoIcons.map_fill),
            label: 'Flota',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.book),
            activeIcon: Icon(CupertinoIcons.book_fill),
            label: 'Bitácora',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.person),
            activeIcon: Icon(CupertinoIcons.person_solid),
            label: 'Perfil',
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
