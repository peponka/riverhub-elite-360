import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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

  Future<void> _signUp() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (email.isEmpty || password.isEmpty || confirm.isEmpty) {
      _showErrorDialog('Por favor, completa todos los campos.');
      return;
    }

    if (password != confirm) {
      _showErrorDialog('Las contraseñas no coinciden.');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.signUp(email: email, password: password);

      // Muestra éxito y regresa al Login
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (context) => CupertinoAlertDialog(
            title: const Text('Registro Exitoso'),
            content: const Text(
              'Tu cuenta ha sido creada. Verifica tu correo electrónico o inicia sesión para continuar.',
            ),
            actions: [
              CupertinoDialogAction(
                child: const Text('OK'),
                onPressed: () {
                  Navigator.of(context).pop(); // Cierra Modal
                  Navigator.of(context).pop(); // Vuelve al login
                },
              ),
            ],
          ),
        );
      }
    } on AuthException catch (error) {
      if (mounted) {
        _showErrorDialog(error.message);
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog('Error al registrar usuario. Intente nuevamente.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showErrorDialog(String message) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Error de registro'),
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

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(
        middle: Text('Nuevo Usuario'),
        previousPageTitle: 'Volver',
      ),
      backgroundColor: CupertinoColors.systemGroupedBackground,
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon
                Container(
                  padding: const EdgeInsets.all(20),
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
                    CupertinoIcons.person_add_solid,
                    size: 48,
                    color: CupertinoColors.activeBlue,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Crea tu cuenta',
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: CupertinoColors.black,
                  ),
                ),
                const SizedBox(height: 48),

                // Form
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
                        placeholder: 'Correo electrónico',
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
                      const SizedBox(height: 16),
                      CupertinoTextField(
                        controller: _confirmController,
                        placeholder: 'Confirmar Contraseña',
                        obscureText: true,
                        padding: const EdgeInsets.all(16),
                        prefix: const Padding(
                          padding: EdgeInsets.only(left: 12.0),
                          child: Icon(
                            CupertinoIcons.lock_shield,
                            color: CupertinoColors.systemGrey2,
                          ),
                        ),
                        decoration: BoxDecoration(
                          color: CupertinoColors.systemGroupedBackground,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Register Button
                      SizedBox(
                        width: double.infinity,
                        child: CupertinoButton(
                          color: CupertinoColors.activeBlue,
                          borderRadius: BorderRadius.circular(16),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          onPressed: _isLoading ? null : _signUp,
                          child: _isLoading
                              ? const CupertinoActivityIndicator(
                                  color: CupertinoColors.white,
                                )
                              : Text(
                                  'Registrarme',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 18,
                                    color: CupertinoColors.white,
                                  ),
                                ),
                        ),
                      ),
                    ],
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
