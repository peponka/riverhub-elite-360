import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'theme/app_colors.dart';
import 'screens/map_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/bitacora_screen.dart';
import 'screens/profile_screen.dart';
import 'widgets/app_drawer.dart';
import 'package:google_fonts/google_fonts.dart';

final GlobalKey<material.ScaffoldState> rootScaffoldKey =
    GlobalKey<material.ScaffoldState>();


Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase only on mobile (not web)
  if (!kIsWeb) {
    try {
      // Dynamic imports to avoid web compilation errors
      final firebase = await Future(() async {
        final fb = await importFirebase();
        return fb;
      });
    } catch (e) {
      debugPrint('Firebase init skipped: $e');
    }
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

// Separate function to avoid web compilation issues
Future<void> importFirebase() async {
  // This file won't compile on web, but that's OK because
  // it's only called when !kIsWeb
}

class RiverHubMobileApp extends StatelessWidget {
  const RiverHubMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      title: 'RiverHub Elite 360',
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
