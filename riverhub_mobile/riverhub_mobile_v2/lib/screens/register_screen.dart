import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';

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
      await Supabase.instance.client.auth.signUp(email: email, password: password);
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('Registro Exitoso'),
            content: const Text('Tu cuenta ha sido creada. Verifica tu correo electrónico.'),
            actions: [
              CupertinoDialogAction(child: const Text('OK'), onPressed: () { Navigator.pop(ctx); Navigator.pop(ctx); }),
            ],
          ),
        );
      }
    } on AuthException catch (e) {
      if (mounted) _showErrorDialog(e.message);
    } catch (e) {
      if (mounted) _showErrorDialog('Error al registrar usuario.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showErrorDialog(String message) {
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Error'), content: Text(message),
        actions: [CupertinoDialogAction(child: const Text('OK'), onPressed: () => Navigator.pop(ctx))],
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String placeholder, IconData icon, {bool obscure = false}) {
    return CupertinoTextField(
      controller: ctrl,
      placeholder: placeholder,
      obscureText: obscure,
      keyboardType: obscure ? TextInputType.visiblePassword : TextInputType.emailAddress,
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
        middle: Text('Registro', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        previousPageTitle: 'Volver',
      ),
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Text('RiverHub', style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                Text('Meridian.', style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                Text('CREAR CUENTA', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundSecondary,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.separator, width: 0.5),
                  ),
                  child: Column(children: [
                    _field(_emailController, 'Correo electrónico', CupertinoIcons.mail),
                    const SizedBox(height: 14),
                    _field(_passwordController, 'Contraseña', CupertinoIcons.lock, obscure: true),
                    const SizedBox(height: 14),
                    _field(_confirmController, 'Confirmar Contraseña', CupertinoIcons.lock_shield, obscure: true),
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
                            : Text('Registrarme', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.textOnAccent)),
                      ),
                    ),
                  ]),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
