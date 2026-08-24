import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:riverhub_mobile_v2/screens/splash_screen.dart';
import 'package:riverhub_mobile_v2/widgets/offline_banner.dart';

void main() {
  group('SplashScreen', () {
    testWidgets('renders the ViaBarcazas welcome landing', (tester) async {
      await tester.pumpWidget(
        CupertinoApp(
          home: SplashScreen(
            isAuthenticated: false,
            destination: const CupertinoPageScaffold(
              child: Center(child: Text('Destination')),
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('ViaBarcazas'), findsOneWidget);
      expect(find.text('Solicitar Demo'), findsOneWidget);
      expect(find.text('Ver Plataforma'), findsOneWidget);
    });

    testWidgets('continues to the panel for an authenticated user', (tester) async {
      var didContinue = false;
      await tester.pumpWidget(
        CupertinoApp(
          home: SplashScreen(
            isAuthenticated: true,
            onComplete: () => didContinue = true,
            destination: const CupertinoPageScaffold(
              child: Center(child: Text('Arrived')),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Entrar al panel'));
      await tester.pump();

      expect(didContinue, isTrue);
    });
  });

  group('OfflineBanner', () {
    testWidgets('renders child widget when online', (tester) async {
      ConnectivityService.isOnline.value = true;

      await tester.pumpWidget(
        const CupertinoApp(
          home: CupertinoPageScaffold(
            child: OfflineBanner(
              child: Center(child: Text('Content')),
            ),
          ),
        ),
      );

      expect(find.text('Content'), findsOneWidget);
      // No wifi_slash icon when online
      expect(find.byIcon(CupertinoIcons.wifi_slash), findsNothing);
    });

    testWidgets('shows banner when offline', (tester) async {
      ConnectivityService.isOnline.value = false;

      await tester.pumpWidget(
        const CupertinoApp(
          home: CupertinoPageScaffold(
            child: OfflineBanner(
              child: Center(child: Text('Content')),
            ),
          ),
        ),
      );
      await tester.pump();

      // Should show wifi_slash icon
      expect(find.byIcon(CupertinoIcons.wifi_slash), findsOneWidget);

      // Child should still be visible
      expect(find.text('Content'), findsOneWidget);
    });
  });
}
