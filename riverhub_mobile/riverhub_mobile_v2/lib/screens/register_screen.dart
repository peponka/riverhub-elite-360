import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../services/locale_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'viabarcazas://login-callback',
      );
    } catch (e) {
      if (mounted) _showErrorDialog('Error signing in with Google.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _signUp() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (email.isEmpty || password.isEmpty || confirm.isEmpty) {
      _showErrorDialog(LocaleService.t('register_fill_all_fields'));
      return;
    }
    if (password != confirm) {
      _showErrorDialog(LocaleService.t('register_passwords_no_match'));
      return;
    }
    if (password.length < 6) {
      _showErrorDialog(LocaleService.t('register_password_min_length'));
      return;
    }

    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.auth.signUp(email: email, password: password);
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: Text(LocaleService.t('register_registration_success')),
            content: Text(LocaleService.t('register_your_account_has_bee')),
            actions: [
              CupertinoDialogAction(child: const Text('OK'), onPressed: () { Navigator.pop(ctx); Navigator.pop(ctx); }),
            ],
          ),
        );
      }
    } on AuthException catch (e) {
      if (mounted) _showErrorDialog(e.message);
    } catch (e) {
      if (mounted) _showErrorDialog('Error creating account.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showErrorDialog(String message) {
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text(LocaleService.t('register_error')), content: Text(message),
        actions: [CupertinoDialogAction(child: const Text('OK'), onPressed: () => Navigator.pop(ctx))],
      ),
    );
  }

  Widget _passwordField(TextEditingController ctrl, String placeholder, IconData icon, bool obscure, VoidCallback toggleObscure) {
    return CupertinoTextField(
      controller: ctrl,
      placeholder: placeholder,
      obscureText: obscure,
      keyboardType: TextInputType.visiblePassword,
      padding: const EdgeInsets.all(16),
      placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
      style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
      prefix: Padding(
        padding: const EdgeInsets.only(left: 14),
        child: Icon(icon, color: AppColors.textSecondary, size: 18),
      ),
      suffix: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: toggleObscure,
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Icon(
            obscure ? CupertinoIcons.eye : CupertinoIcons.eye_slash,
            size: 18,
            color: AppColors.textSecondary,
          ),
        ),
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
    );
  }

  Widget _emailField(TextEditingController ctrl, String placeholder, IconData icon) {
    return CupertinoTextField(
      controller: ctrl,
      placeholder: placeholder,
      keyboardType: TextInputType.emailAddress,
      padding: const EdgeInsets.all(16),
      placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
      style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
      prefix: Padding(
        padding: const EdgeInsets.only(left: 14),
        child: Icon(icon, color: AppColors.textSecondary, size: 18),
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        middle: Text(LocaleService.t('register_sign_up'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        previousPageTitle: 'Back',
      ),
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Text(LocaleService.t('register_viabarcazas'), style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                const SizedBox(height: 4),
                Text(LocaleService.t('register_create_account'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundSecondary,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.separator, width: 0.5),
                  ),
                  child: Column(children: [
                    _emailField(_emailController, 'Email address', CupertinoIcons.mail),
                    const SizedBox(height: 14),
                    _passwordField(_passwordController, 'Password (min 6 chars)', CupertinoIcons.lock, _obscurePassword, () => setState(() => _obscurePassword = !_obscurePassword)),
                    const SizedBox(height: 14),
                    _passwordField(_confirmController, 'Confirm password', CupertinoIcons.lock_shield, _obscureConfirm, () => setState(() => _obscureConfirm = !_obscureConfirm)),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      child: CupertinoButton(
                        color: AppColors.textPrimary,
                        borderRadius: BorderRadius.circular(12),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        onPressed: _isLoading ? null : _signUp,
                        child: _isLoading
                            ? const CupertinoActivityIndicator(color: AppColors.textOnAccent)
                            : Text(LocaleService.t('register_sign_up'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.textOnAccent)),
                      ),
                    ),
                  ]),
                ),

                const SizedBox(height: 24),

                // ─── Divider ────────────────────────────────
                Row(
                  children: [
                    Expanded(child: Container(height: 0.5, color: AppColors.separator)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        LocaleService.t('login_or'),
                        style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ),
                    Expanded(child: Container(height: 0.5, color: AppColors.separator)),
                  ],
                ),

                const SizedBox(height: 16),

                // ─── Google Button ───────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: CupertinoButton(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    borderRadius: BorderRadius.circular(12),
                    color: AppColors.backgroundSecondary,
                    onPressed: _isLoading ? null : _signInWithGoogle,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.network(
                          'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png',
                          height: 20, width: 20,
                          errorBuilder: (c, e, s) => const Icon(CupertinoIcons.circle_grid_hex_fill, size: 20),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          LocaleService.t('login_google'),
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
