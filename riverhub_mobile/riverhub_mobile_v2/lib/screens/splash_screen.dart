import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show Colors;
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';

import 'register_screen.dart';

/// Mobile adaptation of the current viabarcazas.com landing page.
class SplashScreen extends StatefulWidget {
  final Widget destination;
  final bool isAuthenticated;
  final VoidCallback? onComplete;

  const SplashScreen({
    super.key,
    required this.destination,
    required this.isAuthenticated,
    this.onComplete,
  });

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  late final VideoPlayerController _videoController;
  bool _videoAvailable = false;

  @override
  void initState() {
    super.initState();
    _videoController = VideoPlayerController.asset(
      'assets/videos/viabarcazas-hero.mp4',
    );
    _prepareVideo();
  }

  Future<void> _prepareVideo() async {
    try {
      await _videoController.initialize();
      await _videoController.setLooping(true);
      await _videoController.setVolume(0);
      await _videoController.play();
      if (mounted) setState(() => _videoAvailable = true);
    } catch (_) {
      // The landing remains usable if the device cannot play the background.
    }
  }

  @override
  void dispose() {
    _videoController.dispose();
    super.dispose();
  }

  void _continueToApp() {
    if (widget.onComplete != null) {
      widget.onComplete!();
      return;
    }
    Navigator.of(context).pushReplacement(
      CupertinoPageRoute(builder: (_) => widget.destination),
    );
  }

  void _openRegistration() {
    Navigator.of(context).push(
      CupertinoPageRoute(builder: (_) => const RegisterScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAuthenticated = widget.isAuthenticated;

    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFF0A2924),
      child: Stack(
        fit: StackFit.expand,
        children: [
          _HeroVideo(
            controller: _videoController,
            videoAvailable: _videoAvailable,
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x6606110D), Color(0x2206110D), Color(0xE806110D)],
                stops: [0, 0.36, 1],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 18),
              child: Column(
                children: [
                  _LandingHeader(
                    isAuthenticated: isAuthenticated,
                    onLogin: _continueToApp,
                  ),
                  const Spacer(),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: _ConvoyChip(),
                  ),
                  const SizedBox(height: 18),
                  const _LandingBadge(),
                  const SizedBox(height: 10),
                  Text(
                    'Cada barcaza, visible.\nCada decision, a tiempo.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.bricolageGrotesque(
                      color: Colors.white,
                      fontSize: 29,
                      height: 1.06,
                      fontWeight: FontWeight.w500,
                      letterSpacing: -1.1,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'AIS, convoyes, combustible y mantenimiento de tu flota en una sola pantalla.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.manrope(
                      color: const Color(0xDDF3F7F5),
                      fontSize: 12,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 16),
                  CupertinoButton(
                    color: const Color(0xFF0B8C79),
                    borderRadius: BorderRadius.circular(13),
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    onPressed: isAuthenticated ? _continueToApp : _openRegistration,
                    child: SizedBox(
                      width: double.infinity,
                      child: Text(
                        isAuthenticated ? 'Entrar al panel' : 'Crear cuenta',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.manrope(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  CupertinoButton(
                    color: const Color(0x55364642),
                    borderRadius: BorderRadius.circular(13),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    onPressed: isAuthenticated ? null : _continueToApp,
                    child: SizedBox(
                      width: double.infinity,
                      child: Text(
                        isAuthenticated ? 'Sesion iniciada' : 'Ingresar',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.manrope(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 7,
                    runSpacing: 7,
                    children: const [
                      _FeaturePill('Sin hardware necesario'),
                      _FeaturePill('IA Predictiva'),
                      _FeaturePill('Operativo en 5 minutos'),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LandingHeader extends StatelessWidget {
  final bool isAuthenticated;
  final VoidCallback onLogin;

  const _LandingHeader({required this.isAuthenticated, required this.onLogin});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      child: Row(
        children: [
          const Icon(
            CupertinoIcons.arrow_down,
            color: Color(0xFF92E3D2),
            size: 26,
          ),
          const SizedBox(width: 8),
          Text(
            'ViaBarcazas',
            style: GoogleFonts.bricolageGrotesque(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w700,
              letterSpacing: -1,
            ),
          ),
          const Spacer(),
          CupertinoButton(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            minSize: 0,
            borderRadius: BorderRadius.circular(9),
            color: const Color(0x55364642),
            onPressed: isAuthenticated ? null : onLogin,
            child: Text(
              isAuthenticated ? 'Panel' : 'Ingresar',
              style: GoogleFonts.manrope(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroVideo extends StatelessWidget {
  final VideoPlayerController controller;
  final bool videoAvailable;

  const _HeroVideo({required this.controller, required this.videoAvailable});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF325E57), Color(0xFF0A2924)],
        ),
      ),
      child: videoAvailable
          ? FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: controller.value.size.width,
                height: controller.value.size.height,
                child: VideoPlayer(controller),
              ),
            )
          : const SizedBox.expand(),
    );
  }
}

class _ConvoyChip extends StatelessWidget {
  const _ConvoyChip();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: const Color(0xD106110D),
        borderRadius: BorderRadius.circular(11),
        border: Border.all(color: const Color(0x55FFFFFF)),
      ),
      child: Text(
        'CONVOY  VB-0417\nCOMBUSTIBLE  82%\nCARGA  14.200 T\nESTADO  EN RUTA - OPTIMO',
        style: GoogleFonts.jetBrainsMono(
          color: const Color(0xFFF3F7F5),
          fontSize: 8.5,
          height: 1.7,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _LandingBadge extends StatelessWidget {
  const _LandingBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0x3314211D),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: const Color(0x8892E3D2)),
      ),
      child: Text(
        'HIDROVIA PARAGUAY-PARANA, EN TIEMPO REAL',
        style: GoogleFonts.manrope(
          color: const Color(0xFFB9F0E2),
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}

class _FeaturePill extends StatelessWidget {
  final String label;

  const _FeaturePill(this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0x33202E2A),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: const Color(0x6675A79A)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(CupertinoIcons.check_mark_circled_solid, color: Color(0xFFB9F0E2), size: 13),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.manrope(
              color: const Color(0xFFE4F0EC),
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
