import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'theme/app_colors.dart';
import 'screens/map_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/bitacora_screen.dart';
import 'screens/profile_screen.dart';
import 'widgets/app_drawer.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';final GlobalKey<material.ScaffoldState> rootScaffoldKey =
    GlobalKey<material.ScaffoldState>();

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Fase 3: Inicialización Segura y Aislada de Firebase
  try {
    await Firebase.initializeApp();

    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel', // id
      'High Importance Notifications', // title
      description: 'This channel is used for important notifications.', // description
      importance: Importance.max,
    );

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    // DEBE IR PRIMERO SIEMPRE ANTES DE CREAR CANALES NATIVOS!
    await flutterLocalNotificationsPlugin.initialize(
      settings: initializationSettings,
    );

    // AHORA SÍ, crear el canal de Android
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        flutterLocalNotificationsPlugin.show(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          notificationDetails: NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: '@mipmap/ic_launcher',
              importance: Importance.max,
              priority: Priority.high,
            ),
          ),
        );
      }
    });
  } catch (e) {
    debugPrint('Firebase init error: $e');
  }

  try {
    await Supabase.initialize(
      url: 'https://nfybnnpdrvyxucgpqmmo.supabase.co',
      anonKey:
          'REDACTED_SUPABASE_ANON_KEY',
    );
  } catch (e) {
    debugPrint('Supabase init error: $e');
  }

  runApp(const RiverHubMobileApp());
}

class RiverHubMobileApp extends StatelessWidget {
  const RiverHubMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      title: 'RiverHub Elite 360',
      debugShowCheckedModeBanner: false,
      locale: const material.Locale('en', 'US'), // 🔥 FIX PANTALLA BLANCA: Fuerza que los widgets Material encuentren su localización.
      theme: CupertinoThemeData(
        brightness: Brightness.light,
        primaryColor: AppColors.accent,
        scaffoldBackgroundColor: AppColors.backgroundPrimary,
        barBackgroundColor: AppColors.backgroundSecondary,
        textTheme: CupertinoTextThemeData(
          primaryColor: AppColors.accent,
          textStyle: const TextStyle(
            color: AppColors.textPrimary,
            fontFamily: 'SF Pro Text',
          ),
          navLargeTitleTextStyle: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 34,
          ),
          navTitleTextStyle: const TextStyle(
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
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.92),
        activeColor: AppColors.accent,
        inactiveColor: AppColors.textSecondary,
        iconSize: 26,
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
