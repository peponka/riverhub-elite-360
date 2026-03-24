import 'package:flutter/cupertino.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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

  // Removed _updateFcmToken per Phase 1

  Future<void> _signIn() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      // Removed _updateFcmToken and explicit router pushing per Phase 1/Phase 2
    } on AuthException catch (error) {
      if (mounted) {
        _showErrorDialog(error.message);
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog('Error de conexión. Intente nuevamente.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
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
      final supabase = Supabase.instance.client;
      await supabase.auth.signInWithOAuth(OAuthProvider.google);
      // Removed _updateFcmToken as part of Phase 1
    } catch (e) {
      if (mounted) {
        _showErrorDialog('Error con Google Sign In.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showForgotPasswordDialog() {
    final emailForgotController = TextEditingController(
      text: _emailController.text,
    );
    showCupertinoDialog(
      context: context,
      builder: (dialogContext) => CupertinoAlertDialog(
        title: const Text('Recuperar contraseña'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            children: [
              const Text(
                'Ingresa tu correo para enviarte un enlace de recuperación.',
              ),
              const SizedBox(height: 16),
              CupertinoTextField(
                controller: emailForgotController,
                placeholder: 'Correo corporativo',
                keyboardType: TextInputType.emailAddress,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: CupertinoColors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ],
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text(
              'Cancelar',
              style: TextStyle(color: CupertinoColors.destructiveRed),
            ),
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
                final supabase = Supabase.instance.client;
                await supabase.auth.resetPasswordForEmail(email);
                if (mounted) {
                  _showErrorDialog(
                    'Se ha enviado un enlace a $email',
                    title: 'Éxito',
                  );
                }
              } catch (e) {
                if (mounted) {
                  _showErrorDialog(
                    'Error al enviar el correo. Intente nuevamente.',
                  );
                }
              } finally {
                if (mounted) {
                  setState(() => _isLoading = false);
                }
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
      backgroundColor: CupertinoColors.systemGroupedBackground,
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo or Icon
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: CupertinoColors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: CupertinoColors.systemGrey.withValues(
                          alpha: 0.2,
                        ),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    CupertinoIcons.location_solid,
                    size: 64,
                    color: CupertinoColors.activeBlue,
                  ),
                ),
                const SizedBox(height: 32),

                // Welcome Text
                const Text(
                  'Bienvenido a RiverHub',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: CupertinoColors.black,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Gestión Fluvial Elite 360',
                  style: TextStyle(
                    fontSize: 16,
                    color: CupertinoColors.systemGrey,
                  ),
                ),
                const SizedBox(height: 48),

                // Login Form (Glassmorphism inspired container)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: CupertinoColors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: CupertinoColors.systemGrey.withValues(
                          alpha: 0.1,
                        ),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      CupertinoTextField(
                        controller: _emailController,
                        placeholder: 'Correo corporativo',
                        keyboardType: TextInputType.emailAddress,
                        padding: const EdgeInsets.all(16),
                        prefix: const Padding(
                          padding: EdgeInsets.only(left: 12.0),
                          child: Icon(
                            CupertinoIcons.mail,
                            color: CupertinoColors.systemGrey2,
                          ),
                        ),
                        decoration: BoxDecoration(
                          color: CupertinoColors.systemGroupedBackground,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      const SizedBox(height: 16),
                      CupertinoTextField(
                        controller: _passwordController,
                        placeholder: 'Contraseña',
                        obscureText: true,
                        padding: const EdgeInsets.all(16),
                        prefix: const Padding(
                          padding: EdgeInsets.only(left: 12.0),
                          child: Icon(
                            CupertinoIcons.lock,
                            color: CupertinoColors.systemGrey2,
                          ),
                        ),
                        decoration: BoxDecoration(
                          color: CupertinoColors.systemGroupedBackground,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Login Button
                      SizedBox(
                        width: double.infinity,
                        child: CupertinoButton(
                          color: CupertinoColors.activeBlue,
                          borderRadius: BorderRadius.circular(16),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          onPressed: _isLoading ? null : _signIn,
                          child: _isLoading
                              ? const CupertinoActivityIndicator(
                                  color: CupertinoColors.white,
                                )
                              : const Text(
                                  'Iniciar Sesión',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 18,
                                    color: CupertinoColors.white,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Forgot password
                      CupertinoButton(
                        padding: EdgeInsets.zero,
                        onPressed: _showForgotPasswordDialog,
                        child: const Text(
                          '¿Olvidaste tu contraseña?',
                          style: TextStyle(
                            fontSize: 15,
                            color: CupertinoColors.activeBlue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Divisor
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 1,
                        color: CupertinoColors.systemGrey4,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: const Text(
                        'o continuar con',
                        style: TextStyle(
                          color: CupertinoColors.systemGrey,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 1,
                        color: CupertinoColors.systemGrey4,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Google Button
                SizedBox(
                  width: double.infinity,
                  child: CupertinoButton(
                    color: CupertinoColors.white,
                    borderRadius: BorderRadius.circular(16),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    onPressed: _isLoading ? null : _signInWithGoogle,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.network(
                          'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png',
                          height: 24,
                          width: 24,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(
                                CupertinoIcons.circle_grid_hex_fill,
                                color: CupertinoColors.black,
                              ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Continuar con Google',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: CupertinoColors.black,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      '¿No tienes cuenta? ',
                      style: TextStyle(
                        color: CupertinoColors.systemGrey,
                        fontSize: 15,
                      ),
                    ),
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      onPressed: () {
                        Navigator.of(context).push(
                          CupertinoPageRoute(
                            builder: (_) => const RegisterScreen(),
                          ),
                        );
                      },
                      child: const Text(
                        'Regístrate',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: CupertinoColors.activeBlue,
                          fontSize: 15,
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
