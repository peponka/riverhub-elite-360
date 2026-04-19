import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
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
      if (mounted) _showErrorDialog('Error de conexión. Intente nuevamente.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showErrorDialog(String message, {String title = 'Error de acceso'}) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(title),
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
      await Supabase.instance.client.auth.signInWithOAuth(OAuthProvider.google);
    } catch (e) {
      if (mounted) _showErrorDialog('Error con Google Sign In.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showForgotPasswordDialog() {
    final emailForgotController = TextEditingController(text: _emailController.text);
    showCupertinoDialog(
      context: context,
      builder: (dialogContext) => CupertinoAlertDialog(
        title: const Text('Recuperar contraseña'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            children: [
              const Text('Ingresa tu correo para enviarte un enlace de recuperación.'),
              const SizedBox(height: 16),
              CupertinoTextField(
                controller: emailForgotController,
                placeholder: 'Correo corporativo',
                keyboardType: TextInputType.emailAddress,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ],
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancelar', style: TextStyle(color: AppColors.error)),
            onPressed: () => Navigator.of(dialogContext).pop(),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            child: const Text('Enviar'),
            onPressed: () async {
              final email = emailForgotController.text.trim();
              if (email.isEmpty) return;
              Navigator.of(dialogContext).pop();
              setState(() => _isLoading = true);
              try {
                await Supabase.instance.client.auth.resetPasswordForEmail(email);
                if (mounted) _showErrorDialog('Se ha enviado un enlace a $email', title: 'Éxito');
              } catch (e) {
                if (mounted) _showErrorDialog('Error al enviar el correo.');
              } finally {
                if (mounted) setState(() => _isLoading = false);
              }
            },
          ),
        ],
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

                // ─── Fluvia Logo ─────────────────────────
                Icon(CupertinoIcons.drop_fill, size: 32, color: AppColors.textPrimary),
                const SizedBox(height: 16),
                Text(
                  'Fluvia',
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
                  'RIVERHUB ELITE 360',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                    letterSpacing: 3,
                  ),
                ),

                const SizedBox(height: 56),

                // ─── Form Container ─────────────────────
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CORREO CORPORATIVO',
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
                      placeholder: 'usuario@empresa.com',
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
                      'CONTRASEÑA',
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
                      obscureText: true,
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
                                'Iniciar Sesión',
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
                          '¿Olvidaste tu contraseña?',
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
                        'o continuar con',
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
                          'Continuar con Google',
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
                      '¿No tienes cuenta? ',
                      style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 13),
                    ),
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      onPressed: () {
                        Navigator.of(context).push(CupertinoPageRoute(builder: (_) => const RegisterScreen()));
                      },
                      child: Text(
                        'Regístrate',
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
