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
  final _name = TextEditingController();
  final _company = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _tugs = TextEditingController(text: '0');
  final _barges = TextEditingController(text: '0');
  final _tankers = TextEditingController(text: '0');
  final _vesselRegistration = TextEditingController();
  final _vesselName = TextEditingController();

  static const _countries = ['Paraguay', 'Argentina', 'Uruguay', 'Brasil', 'Bolivia'];
  static const _operations = ['Armador / Naviera', 'Cargador / Exportador', 'Terminal / Puerto', 'Servicios fluviales'];

  String _country = 'Paraguay';
  String? _operation;
  bool _obscurePassword = true;
  bool _loading = false;

  @override
  void dispose() {
    for (final controller in [_name, _company, _phone, _email, _password, _tugs, _barges, _tankers, _vesselRegistration, _vesselName]) {
      controller.dispose();
    }
    super.dispose();
  }

  int _number(TextEditingController controller) =>
      (int.tryParse(controller.text.trim())?.clamp(0, 999) ?? 0).toInt();
  int get _fleetTotal => _number(_tugs) + _number(_barges) + _number(_tankers);
  String get _plan => _fleetTotal <= 5 ? 'Amarre' : _fleetTotal <= 20 ? 'Convoy' : 'Armador';

  Future<void> _register() async {
    final name = _name.text.trim();
    final company = _company.text.trim();
    final phone = _phone.text.trim();
    final email = _email.text.trim();
    final password = _password.text;
    final registration = _vesselRegistration.text.trim();
    final vesselName = _vesselName.text.trim();

    if (name.isEmpty || company.isEmpty || phone.isEmpty || _operation == null || email.isEmpty || password.isEmpty) {
      _showError('Completá nombre, empresa, teléfono, operación, email y contraseña.');
      return;
    }
    if (password.length < 6) {
      _showError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (vesselName.isNotEmpty && registration.isEmpty) {
      _showError('Si agregás una embarcación, completá también su matrícula.');
      return;
    }

    final fleet = {'tugs': _number(_tugs), 'barges': _number(_barges), 'tankers': _number(_tankers)};
    final metadata = <String, dynamic>{
      'full_name': name,
      'company': company,
      'phone': phone,
      'country': _country,
      'operation': _operation,
      'fleet': fleet,
      if (registration.isNotEmpty) 'first_vessel': {'registration': registration, 'name': vesselName},
    };

    setState(() => _loading = true);
    try {
      final result = await Supabase.instance.client.auth.signUp(email: email, password: password, data: metadata);
      if (result.user != null) {
        // The signup trigger creates the canonical user_profiles record.
        // Keeping this client out of role and company writes prevents escalation.
      }
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (dialogContext) => CupertinoAlertDialog(
            title: const Text('Cuenta creada'),
            content: const Text('Revisá tu email si te pide confirmar la dirección. Tu operación quedó registrada para revisar el plan adecuado.'),
            actions: [
              CupertinoDialogAction(
                child: const Text('OK'),
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                  Navigator.of(context).pop();
                },
              ),
            ],
          ),
        );
      }
    } on AuthException catch (error) {
      if (mounted) _showError(error.message);
    } catch (_) {
      if (mounted) _showError('No pudimos crear la cuenta. Intentá nuevamente.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String message) {
    showCupertinoDialog(
      context: context,
      builder: (dialogContext) => CupertinoAlertDialog(
        title: const Text('Registro incompleto'),
        content: Text(message),
        actions: [CupertinoDialogAction(child: const Text('OK'), onPressed: () => Navigator.of(dialogContext).pop())],
      ),
    );
  }

  void _pick(List<String> choices, String current, ValueChanged<String> onSelected) {
    showCupertinoModalPopup(
      context: context,
      builder: (popupContext) => Container(
        height: 270,
        color: CupertinoColors.systemBackground.resolveFrom(context),
        child: Column(
          children: [
            Align(alignment: Alignment.centerRight, child: CupertinoButton(onPressed: () => Navigator.of(popupContext).pop(), child: const Text('Listo'))),
            Expanded(
              child: CupertinoPicker(
                itemExtent: 42,
                scrollController: FixedExtentScrollController(initialItem: choices.indexOf(current).clamp(0, choices.length - 1)),
                onSelectedItemChanged: (index) => onSelected(choices[index]),
                children: choices.map((choice) => Center(child: Text(choice))).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  BoxDecoration get _fieldStyle => BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      );

  Widget _field(TextEditingController controller, String placeholder, IconData icon, {TextInputType type = TextInputType.text}) {
    return CupertinoTextField(
      controller: controller,
      placeholder: placeholder,
      keyboardType: type,
      padding: const EdgeInsets.all(15),
      placeholderStyle: GoogleFonts.manrope(color: AppColors.textTertiary, fontSize: 13),
      style: GoogleFonts.manrope(color: AppColors.textPrimary, fontSize: 14),
      prefix: Padding(padding: const EdgeInsets.only(left: 13), child: Icon(icon, color: AppColors.textSecondary, size: 18)),
      decoration: _fieldStyle,
    );
  }

  Widget _selector(String value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
        decoration: _fieldStyle,
        child: Row(children: [Expanded(child: Text(value, style: GoogleFonts.manrope(fontSize: 13, color: AppColors.textPrimary))), const Icon(CupertinoIcons.chevron_down, size: 16, color: AppColors.textSecondary)]),
      ),
    );
  }

  Widget _heading(String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 9),
      child: Row(children: [Text(title, style: GoogleFonts.manrope(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF0B7769), letterSpacing: 1.1)), const SizedBox(width: 8), Expanded(child: Text(subtitle, style: GoogleFonts.manrope(fontSize: 10, color: AppColors.textSecondary)))]),
    );
  }

  Widget _fleetField(String label, TextEditingController controller) {
    return Expanded(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: GoogleFonts.manrope(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
        const SizedBox(height: 6),
        CupertinoTextField(controller: controller, keyboardType: TextInputType.number, textAlign: TextAlign.center, padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4), onChanged: (_) => setState(() {}), decoration: _fieldStyle),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF8FAF4),
      navigationBar: CupertinoNavigationBar(
        backgroundColor: const Color(0xFFF8FAF4).withValues(alpha: 0.96),
        border: const Border(bottom: BorderSide(color: Color(0xFFD4E1DA))),
        middle: Text('Crear cuenta', style: GoogleFonts.manrope(fontWeight: FontWeight.w800, color: const Color(0xFF12352D))),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text('ALTA DE FLOTA - 2 MINUTOS', textAlign: TextAlign.center, style: GoogleFonts.manrope(color: const Color(0xFF0B7769), fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.4)),
            const SizedBox(height: 8),
            Text('Tu operación,\nlista para crecer.', textAlign: TextAlign.center, style: GoogleFonts.bricolageGrotesque(fontSize: 31, height: 1.06, fontWeight: FontWeight.w500, color: const Color(0xFF12352D))),
            const SizedBox(height: 8),
            Text('Contanos lo esencial y calculamos el plan adecuado para tu flota.', textAlign: TextAlign.center, style: GoogleFonts.manrope(fontSize: 12, height: 1.45, color: AppColors.textSecondary)),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(color: CupertinoColors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFD4E1DA))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                _heading('TU OPERACIÓN', 'Datos para preparar tu plan'),
                _field(_name, 'Nombre completo', CupertinoIcons.person),
                const SizedBox(height: 10),
                _field(_company, 'Empresa / Buque', CupertinoIcons.building_2_fill),
                const SizedBox(height: 10),
                _field(_phone, 'Teléfono / WhatsApp', CupertinoIcons.phone, type: TextInputType.phone),
                const SizedBox(height: 10),
                _selector(_country, () => _pick(_countries, _country, (value) => setState(() => _country = value))),
                const SizedBox(height: 10),
                _selector(_operation ?? 'Tipo de operación', () => _pick(_operations, _operation ?? _operations.first, (value) => setState(() => _operation = value))),
                _heading('COMPOSICIÓN DE FLOTA', 'Podés ajustarla después'),
                Row(children: [_fleetField('Remolcadores', _tugs), const SizedBox(width: 8), _fleetField('Barcazas', _barges), const SizedBox(width: 8), _fleetField('Tanques', _tankers)]),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFFE1F0E8), borderRadius: BorderRadius.circular(11)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('PLAN SUGERIDO: $_plan', style: GoogleFonts.manrope(color: const Color(0xFF0B7769), fontSize: 11, fontWeight: FontWeight.w800)), Text('$_fleetTotal activos estimados - 14 días de prueba', style: GoogleFonts.manrope(color: const Color(0xFF557067), fontSize: 11))]),
                ),
                _heading('PRIMERA EMBARCACIÓN', 'Opcional, podés completarla después'),
                _field(_vesselRegistration, 'Matrícula (ej. PY-ABC123)', CupertinoIcons.doc_text),
                const SizedBox(height: 10),
                _field(_vesselName, 'Nombre de la embarcación', CupertinoIcons.location_solid),
                _heading('ACCESO', 'Tu cuenta segura'),
                _field(_email, 'Email corporativo', CupertinoIcons.mail, type: TextInputType.emailAddress),
                const SizedBox(height: 10),
                CupertinoTextField(
                  controller: _password,
                  placeholder: 'Contraseña (mínimo 6 caracteres)',
                  obscureText: _obscurePassword,
                  padding: const EdgeInsets.all(15),
                  placeholderStyle: GoogleFonts.manrope(color: AppColors.textTertiary, fontSize: 13),
                  style: GoogleFonts.manrope(color: AppColors.textPrimary, fontSize: 14),
                  prefix: const Padding(padding: EdgeInsets.only(left: 13), child: Icon(CupertinoIcons.lock, color: AppColors.textSecondary, size: 18)),
                  suffix: GestureDetector(onTap: () => setState(() => _obscurePassword = !_obscurePassword), child: Padding(padding: const EdgeInsets.all(12), child: Icon(_obscurePassword ? CupertinoIcons.eye : CupertinoIcons.eye_slash, color: AppColors.textSecondary, size: 18))),
                  decoration: _fieldStyle,
                ),
                const SizedBox(height: 20),
                CupertinoButton(
                  color: const Color(0xFF0B7769),
                  borderRadius: BorderRadius.circular(13),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  onPressed: _loading ? null : _register,
                  child: _loading ? const CupertinoActivityIndicator(color: CupertinoColors.white) : Text('Crear cuenta y calcular plan', style: GoogleFonts.manrope(color: CupertinoColors.white, fontSize: 14, fontWeight: FontWeight.w800)),
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}
