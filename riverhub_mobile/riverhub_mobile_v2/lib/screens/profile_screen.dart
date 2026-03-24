import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'login_screen.dart';
import '../main.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userEmail = 'Cargando...';

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  void _loadUserProfile() {
    final user = Supabase.instance.client.auth.currentUser;
    setState(() {
      _userEmail = user?.email ?? 'Usuario de Prueba';
    });
  }

  Future<void> _signOut(BuildContext context) async {
    await Supabase.instance.client.auth.signOut();
    if (context.mounted) {
      Navigator.of(context).pushReplacement(
        CupertinoPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: CupertinoColors.systemGroupedBackground,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CupertinoColors.white.withValues(alpha: 0.85),
        border: null,
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.bars, size: 28),
          onPressed: () {
            rootScaffoldKey.currentState?.openDrawer();
          },
        ),
        middle: Text(
          'Perfil',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          children: [
            // User Meta Info
            Center(
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: CupertinoColors.activeBlue.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  CupertinoIcons.person_solid,
                  size: 50,
                  color: CupertinoColors.activeBlue,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: Text(
                _userEmail,
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: CupertinoColors.black,
                ),
              ),
            ),
            Center(
              child: Text(
                'Tripulante Elite 360',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  color: CupertinoColors.systemGrey,
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Settings Group
            _buildSettingsGroup([
              _buildSettingRow(
                icon: CupertinoIcons.bell_fill,
                iconColor: CupertinoColors.systemRed,
                title: 'Notificaciones',
                trailing: const CupertinoSwitch(value: true, onChanged: null),
              ),
              _buildSettingRow(
                icon: CupertinoIcons.lock_fill,
                iconColor: CupertinoColors.systemOrange,
                title: 'Privacidad y Seguridad',
                trailing: const Icon(
                  CupertinoIcons.chevron_right,
                  color: CupertinoColors.systemGrey3,
                ),
              ),
              _buildSettingRow(
                icon: CupertinoIcons.globe,
                iconColor: CupertinoColors.activeGreen,
                title: 'Idioma / Región',
                trailing: Row(
                  children: [
                    Text(
                      'Español',
                      style: GoogleFonts.inter(
                        color: CupertinoColors.systemGrey,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      CupertinoIcons.chevron_right,
                      color: CupertinoColors.systemGrey3,
                    ),
                  ],
                ),
                isLast: true,
              ),
            ]),

            const SizedBox(height: 24),

            // Logout Group
            _buildSettingsGroup([
              CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () => _signOut(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 16,
                    horizontal: 16,
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        CupertinoIcons.square_arrow_right,
                        color: CupertinoColors.destructiveRed,
                      ),
                      const SizedBox(width: 16),
                      Text(
                        'Cerrar Sesión',
                        style: GoogleFonts.inter(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          color: CupertinoColors.destructiveRed,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsGroup(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.systemGrey.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildSettingRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required Widget trailing,
    bool isLast = false,
  }) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: CupertinoColors.white, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 17,
                    fontWeight: FontWeight.w500,
                    color: CupertinoColors.black,
                  ),
                ),
              ),
              trailing,
            ],
          ),
        ),
        if (!isLast)
          Padding(
            padding: const EdgeInsets.only(left: 60),
            child: Container(height: 1, color: CupertinoColors.systemGrey5),
          ),
      ],
    );
  }
}
