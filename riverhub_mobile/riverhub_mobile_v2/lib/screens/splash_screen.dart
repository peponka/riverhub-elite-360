import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show Colors, FadeTransition;
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';

/// FluviaFleet Splash — Logo sobre fondo blanco, fade in → fade out → destino.
class SplashScreen extends StatefulWidget {
  final Widget destination;
  final VoidCallback? onComplete;
  const SplashScreen({super.key, required this.destination, this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeIn;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );

    // 0→0.4: fade in  |  0.4→0.75: hold  |  0.75→1.0: fade out
    _fadeIn = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 40),
      TweenSequenceItem(tween: ConstantTween(1.0), weight: 35),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 25),
    ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    _controller.forward();

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted) {
        widget.onComplete?.call();
        Navigator.of(context).pushReplacement(
          CupertinoPageRoute(builder: (_) => widget.destination),
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      child: Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.white,
        child: AnimatedBuilder(
          animation: _fadeIn,
          builder: (context, child) {
            return Opacity(
              opacity: _fadeIn.value.clamp(0.0, 1.0),
              child: child,
            );
          },
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Image.asset(
                'assets/images/logo.png',
                width: 160,
                height: 160,
                errorBuilder: (_, __, ___) => Icon(
                  CupertinoIcons.compass,
                  size: 80,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 20),
              // Name
              Text(
                'FluviaFleet',
                style: GoogleFonts.newsreader(
                  color: AppColors.textPrimary,
                  fontSize: 32,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
