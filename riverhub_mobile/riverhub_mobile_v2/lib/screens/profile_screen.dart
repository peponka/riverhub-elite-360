import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../services/locale_service.dart';
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

  String _initials(String email) {
    final parts = email.split('@').first.split('.');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return email.substring(0, 2).toUpperCase();
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
    final t = LocaleService.t;

    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary),
          onPressed: () => rootScaffoldKey.currentState?.openDrawer(),
        ),
        middle: Text(
          t('profile_title'),
          style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          children: [
            // ─── ViaBarcazas Title ────────────────────────
            Text(
              t('profile_my'),
              style: GoogleFonts.newsreader(
                fontSize: 36, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1,
              ),
            ),
            Text(
              t('profile_subtitle'),
              style: GoogleFonts.newsreader(
                fontSize: 36, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1,
              ),
            ),
            const SizedBox(height: 32),

            // ─── User Card ──────────────────────────
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Row(
                children: [
                  Container(
                    width: 56, height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: Text(
                        _initials(_userEmail),
                        style: GoogleFonts.inter(
                          fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _userEmail.split('@').first,
                          style: GoogleFonts.inter(
                            fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _userEmail,
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'SUPERADMIN',
                          style: GoogleFonts.inter(
                            fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.success, letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // ─── Settings Section ───────────────────
            Text(
              t('profile_settings'),
              style: GoogleFonts.inter(
                fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 12),

            _settingsGroup([
              _settingRow(
                icon: CupertinoIcons.bell,
                title: t('profile_notifications'),
                trailing: CupertinoSwitch(
                  value: true, onChanged: (v) {},
                  activeTrackColor: AppColors.textPrimary,
                ),
              ),
              _settingRow(
                icon: CupertinoIcons.lock,
                title: t('profile_privacy'),
              ),
              // ─── Language Toggle ──────────────────
              _languageToggleRow(),
            ]),

            const SizedBox(height: 28),

            Text(
              t('profile_account'),
              style: GoogleFonts.inter(
                fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 12),

            _settingsGroup([
              CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () => _signOut(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
                  child: Row(
                    children: [
                      Icon(CupertinoIcons.square_arrow_right, color: AppColors.error, size: 20),
                      const SizedBox(width: 14),
                      Text(
                        t('profile_sign_out'),
                        style: GoogleFonts.inter(
                          fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.error,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ]),

            const SizedBox(height: 40),

            Center(
              child: Text(
                'VIABARCAZAS v4.2 · RIVERHUB ELITE 360',
                style: GoogleFonts.inter(
                  fontSize: 9, color: AppColors.textTertiary, fontWeight: FontWeight.w600, letterSpacing: 1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Language Toggle Row ─────────────────────────────────────────────────
  Widget _languageToggleRow() {
    final isEn = LocaleService.current == 'en';
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 18),
          child: Row(
            children: [
              Icon(CupertinoIcons.globe, color: AppColors.textSecondary, size: 20),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  LocaleService.t('profile_language'),
                  style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary,
                  ),
                ),
              ),
              // ── EN/ES Segmented Control ──
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _langButton('ES', !isEn, () {
                      LocaleService.setLocale('es');
                      setState(() {});
                    }),
                    _langButton('EN', isEn, () {
                      LocaleService.setLocale('en');
                      setState(() {});
                    }),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _langButton(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppColors.textPrimary : CupertinoColors.transparent,
          borderRadius: BorderRadius.circular(7),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: active ? AppColors.textOnAccent : AppColors.textSecondary,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  Widget _settingsGroup(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(children: children),
    );
  }

  Widget _settingRow({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    bool isLast = false,
  }) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 18),
          child: Row(
            children: [
              Icon(icon, color: AppColors.textSecondary, size: 20),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (subtitle != null)
                Text(subtitle, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
              if (trailing != null) trailing,
              if (trailing == null)
                Icon(CupertinoIcons.chevron_right, size: 14, color: AppColors.separator),
            ],
          ),
        ),
        if (!isLast)
          Padding(
            padding: const EdgeInsets.only(left: 52),
            child: Container(height: 0.5, color: AppColors.separator),
          ),
      ],
    );
  }
}
