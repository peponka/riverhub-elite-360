import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:riverhub_mobile_v2/screens/splash_screen.dart';
import 'package:riverhub_mobile_v2/widgets/offline_banner.dart';

void main() {
  group('SplashScreen', () {
    testWidgets('renders logo image and FluviaFleet text', (tester) async {
      await tester.pumpWidget(
        CupertinoApp(
          home: SplashScreen(
            destination: const CupertinoPageScaffold(
              child: Center(child: Text('Destination')),
            ),
          ),
        ),
      );
      await tester.pump();

      // Should show FluviaFleet text
      expect(find.text('FluviaFleet'), findsOneWidget);

      // Should show HIDROVÍA INTELIGENTE tagline
      expect(find.text('HIDROVÍA INTELIGENTE'), findsOneWidget);

      // Should have an activity indicator
      expect(find.byType(CupertinoActivityIndicator), findsOneWidget);
    });

    testWidgets('navigates to destination after animation', (tester) async {
      await tester.pumpWidget(
        CupertinoApp(
          home: SplashScreen(
            destination: const CupertinoPageScaffold(
              child: Center(child: Text('Arrived')),
            ),
          ),
        ),
      );

      // Before animation completes
      expect(find.text('FluviaFleet'), findsOneWidget);
      expect(find.text('Arrived'), findsNothing);

      // Pump through the full 2.4s animation + navigation
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should have navigated to destination
      expect(find.text('Arrived'), findsOneWidget);
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
