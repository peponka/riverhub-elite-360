import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show Colors, Material;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../services/locale_service.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
    } on AuthException catch (error) {
      if (mounted) _showErrorDialog(error.message);
    } catch (e) {
      if (mounted) _showErrorDialog(LocaleService.t('login_error_connection'));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showErrorDialog(String message, {String? title}) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(title ?? LocaleService.t('login_error_title')),
        content: Text(message),
        actions: [
          CupertinoDialogAction(
            child: const Text('OK'),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'viabarcazas://login-callback',
      );
    } catch (e) {
      if (mounted) _showErrorDialog(LocaleService.t('login_error_connection'));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showForgotPasswordDialog() {
    final emailForgotController = TextEditingController(text: _emailController.text);
    showCupertinoModalPopup(
      context: context,
      builder: (dialogContext) => Center(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: AppColors.backgroundPrimary,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.textPrimary.withValues(alpha: 0.15),
                blurRadius: 40,
                offset: const Offset(0, 16),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.textPrimary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(CupertinoIcons.lock_rotation, size: 22, color: AppColors.textPrimary),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(LocaleService.t('forgot_title1'), style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                        Text(LocaleService.t('forgot_title2'), style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, fontStyle: FontStyle.italic, color: AppColors.textPrimary)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  LocaleService.t('forgot_desc'),
                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 20),
                Text(LocaleService.t('forgot_email_label'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                const SizedBox(height: 8),
                CupertinoTextField(
                  controller: emailForgotController,
                  placeholder: 'usuario@empresa.com',
                  keyboardType: TextInputType.emailAddress,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
                  style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundSecondary,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.separator, width: 0.5),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: CupertinoButton(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        borderRadius: BorderRadius.circular(12),
                        color: AppColors.backgroundSecondary,
                        onPressed: () => Navigator.of(dialogContext).pop(),
                        child: Text(LocaleService.t('forgot_cancel'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textSecondary)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CupertinoButton(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        borderRadius: BorderRadius.circular(12),
                        color: AppColors.textPrimary,
                        onPressed: () async {
                          final email = emailForgotController.text.trim();
                          if (email.isEmpty) return;
                          Navigator.of(dialogContext).pop();
                          setState(() => _isLoading = true);
                          try {
                            await Supabase.instance.client.auth.resetPasswordForEmail(email);
                            if (mounted) _showErrorDialog('${LocaleService.t('forgot_sent_msg')} $email', title: LocaleService.t('forgot_sent_title'));
                          } catch (e) {
                            if (mounted) _showErrorDialog(LocaleService.t('forgot_error'));
                          } finally {
                            if (mounted) setState(() => _isLoading = false);
                          }
                        },
                        child: Text(LocaleService.t('forgot_send'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textOnAccent)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundSecondary,
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 40),

                // ─── ViaBarcazas Logo ─────────────────────────
                Icon(CupertinoIcons.drop_fill, size: 32, color: AppColors.textPrimary),
                const SizedBox(height: 16),
                Text(
                  'ViaBarcazas',
                  style: GoogleFonts.newsreader(
                    fontSize: 42,
                    fontWeight: FontWeight.w400,
                    fontStyle: FontStyle.italic,
                    color: AppColors.textPrimary,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  LocaleService.t('login_subtitle'),
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                    letterSpacing: 2.5,
                  ),
                ),

                const SizedBox(height: 56),

                // ─── Form Container ─────────────────────
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      LocaleService.t('login_email_label'),
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    CupertinoTextField(
                      controller: _emailController,
                      placeholder: LocaleService.t('login_email_hint'),
                      keyboardType: TextInputType.emailAddress,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      placeholderStyle: GoogleFonts.inter(
                        color: AppColors.textTertiary,
                        fontSize: 14,
                      ),
                      style: GoogleFonts.inter(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundPrimary,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.separator, width: 0.5),
                      ),
                    ),

                    const SizedBox(height: 20),

                    Text(
                      LocaleService.t('login_password_label'),
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    CupertinoTextField(
                      controller: _passwordController,
                      placeholder: '••••••••',
                      obscureText: _obscurePassword,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      placeholderStyle: GoogleFonts.inter(
                        color: AppColors.textTertiary,
                        fontSize: 14,
                      ),
                      style: GoogleFonts.inter(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundPrimary,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.separator, width: 0.5),
                      ),
                      suffix: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => setState(() => _obscurePassword = !_obscurePassword),
                        child: Padding(
                          padding: const EdgeInsets.all(14.0),
                          child: Icon(
                            _obscurePassword ? CupertinoIcons.eye : CupertinoIcons.eye_slash,
                            size: 20,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // ─── Login Button ───────────────────
                    SizedBox(
                      width: double.infinity,
                      child: CupertinoButton(
                        color: AppColors.textPrimary,
                        borderRadius: BorderRadius.circular(12),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        onPressed: _isLoading ? null : _signIn,
                        child: _isLoading
                            ? const CupertinoActivityIndicator(color: AppColors.textOnAccent)
                            : Text(
                                LocaleService.t('login_button'),
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                  color: AppColors.textOnAccent,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Forgot password
                    Center(
                      child: CupertinoButton(
                        padding: EdgeInsets.zero,
                        onPressed: _showForgotPasswordDialog,
                        child: Text(
                          LocaleService.t('login_forgot'),
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 36),

                // ─── Divider ─────────────────────────────
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

                const SizedBox(height: 24),

                // ─── Google Button ───────────────────────
                SizedBox(
                  width: double.infinity,
                  child: CupertinoButton(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    borderRadius: BorderRadius.circular(12),
                    color: AppColors.backgroundPrimary,
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

                const SizedBox(height: 40),

                // ─── Register link ───────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      LocaleService.t('login_no_account'),
                      style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 13),
                    ),
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      onPressed: () {
                        Navigator.of(context).push(CupertinoPageRoute(builder: (_) => const RegisterScreen()));
                      },
                      child: Text(
                        LocaleService.t('login_register'),
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
