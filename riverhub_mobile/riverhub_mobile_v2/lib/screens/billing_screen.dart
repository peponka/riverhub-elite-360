import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  bool _isAnnual = false;
  String _currentPlan = 'combo'; // default selected
  bool _processing = false;

  final List<Map<String, dynamic>> _plans = const [
    {
      'id': 'barcaza',
      'name': 'Por Barcaza',
      'desc': 'Control individual de cada activo de tu flota',
      'monthly': 149,
      'yearly': 119,
      'unit': '/barcaza/mes',
      'unitYearly': '/barcaza/mes',
      'icon': '🚢',
      'popular': false,
      'features': [
        {'name': 'Tracking GPS en tiempo real', 'enabled': true},
        {'name': 'Bitácora digital', 'enabled': true},
        {'name': 'Control de combustible', 'enabled': true},
        {'name': 'Mantenimiento preventivo', 'enabled': true},
        {'name': 'Copiloto IA', 'enabled': false},
        {'name': 'API Integraciones', 'enabled': false},
      ],
    },
    {
      'id': 'combo',
      'name': 'Combo Flota',
      'desc': 'Hasta 10 embarcaciones con descuento de flota',
      'monthly': 899,
      'yearly': 719,
      'unit': '/mes (hasta 10)',
      'unitYearly': '/mes (hasta 10)',
      'icon': '⚓',
      'popular': true,
      'features': [
        {'name': 'Todo de Por Barcaza', 'enabled': true},
        {'name': 'Armador de convoyes', 'enabled': true},
        {'name': 'Gestión de tripulación', 'enabled': true},
        {'name': 'Comunicaciones satelital', 'enabled': true},
        {'name': 'Copiloto IA básico', 'enabled': true},
        {'name': 'API Integraciones', 'enabled': false},
      ],
    },
    {
      'id': 'enterprise',
      'name': 'Enterprise',
      'desc': 'Solución corporativa para flotas grandes',
      'monthly': 1499,
      'yearly': 1199,
      'unit': '/mes (hasta 50)',
      'unitYearly': '/mes (hasta 50)',
      'icon': '🏢',
      'popular': false,
      'features': [
        {'name': 'Todo de Combo Flota', 'enabled': true},
        {'name': 'Copiloto IA avanzado', 'enabled': true},
        {'name': 'API integraciones', 'enabled': true},
        {'name': 'Reportes avanzados', 'enabled': true},
        {'name': 'Soporte prioritario', 'enabled': true},
        {'name': 'SLA 99.9%', 'enabled': true},
      ],
    },
    {
      'id': 'ilimitado',
      'name': 'Ilimitado',
      'desc': 'Sin límites. Toda la hidrovía bajo tu control.',
      'monthly': 2499,
      'yearly': 1999,
      'unit': '/mes',
      'unitYearly': '/mes',
      'icon': '∞',
      'popular': false,
      'features': [
        {'name': 'Embarcaciones ilimitadas', 'enabled': true},
        {'name': 'Usuarios ilimitados', 'enabled': true},
        {'name': 'Copiloto IA premium', 'enabled': true},
        {'name': 'White-label disponible', 'enabled': true},
        {'name': 'Onboarding dedicado', 'enabled': true},
        {'name': 'Account manager', 'enabled': true},
      ],
    },
  ];

  // Simulated payment history
  final List<Map<String, String>> _payments = const [
    {'month': 'Abril 2026', 'amount': '\$899', 'status': 'Pendiente'},
    {'month': 'Marzo 2026', 'amount': '\$899', 'status': 'Pagado'},
    {'month': 'Febrero 2026', 'amount': '\$899', 'status': 'Pagado'},
    {'month': 'Enero 2026', 'amount': '\$899', 'status': 'Pagado'},
  ];

  void _selectPlan(String planId) {
    setState(() => _currentPlan = planId);
  }

  void _confirmSubscription() {
    final plan = _plans.firstWhere((p) => p['id'] == _currentPlan);
    final price = _isAnnual ? plan['yearly'] : plan['monthly'];
    final unit = _isAnnual ? plan['unitYearly'] : plan['unit'];

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.backgroundPrimary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Text('Confirmar Suscripción', style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
            const SizedBox(height: 20),

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Column(children: [
                Text(plan['name'], style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                const SizedBox(height: 4),
                Text('\$$price$unit', style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                if (_isAnnual) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(color: AppColors.textPrimary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(6)),
                    child: Text('AHORRÁS 20% ANUAL', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 0.5)),
                  ),
                ],
              ]),
            ),
            const SizedBox(height: 16),

            // Payment method
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.separator, width: 0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                Icon(CupertinoIcons.creditcard, size: 20, color: AppColors.textPrimary),
                const SizedBox(width: 12),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Método de Pago', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                  Text('Tarjeta •••• 4242', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                ]),
                const Spacer(),
                Icon(CupertinoIcons.chevron_right, size: 16, color: AppColors.textSecondary),
              ]),
            ),
            const SizedBox(height: 24),

            GestureDetector(
              onTap: () async {
                Navigator.pop(ctx);
                setState(() => _processing = true);

                // Simulate payment processing
                await Future.delayed(const Duration(seconds: 2));

                // Save subscription to Supabase
                try {
                  final user = Supabase.instance.client.auth.currentUser;
                  if (user != null) {
                    await Supabase.instance.client.from('subscriptions').upsert({
                      'user_id': user.id,
                      'plan': _currentPlan,
                      'billing_cycle': _isAnnual ? 'yearly' : 'monthly',
                      'amount': price,
                      'status': 'active',
                      'started_at': DateTime.now().toIso8601String(),
                    });
                  }
                } catch (e) {
                  debugPrint('Subscription error: $e');
                }

                setState(() => _processing = false);

                if (mounted) {
                  showCupertinoDialog(
                    context: context,
                    builder: (dCtx) => CupertinoAlertDialog(
                      title: Text('Suscripción Activa', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                      content: Text('Tu plan ${plan['name']} está activo. ¡Gracias por elegirnos!', style: GoogleFonts.inter()),
                      actions: [
                        CupertinoDialogAction(child: Text('Aceptar', style: GoogleFonts.inter(fontWeight: FontWeight.w600)), onPressed: () => Navigator.pop(dCtx)),
                      ],
                    ),
                  );
                }
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                child: Center(child: Text('Confirmar Pago', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.backgroundPrimary, letterSpacing: 0.5))),
              ),
            ),
            const SizedBox(height: 8),
            Text('14 días de prueba gratis', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ── BUILD ─────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text('Facturación', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: _processing
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                const CupertinoActivityIndicator(radius: 16),
                const SizedBox(height: 16),
                Text('Procesando pago...', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
              ]))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text('Planes &', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('Facturación.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 6),
                  Text('HIDROVÍA INTELIGENTE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 20),

                  // ── Period toggle ─────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundSecondary,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.separator, width: 0.5),
                    ),
                    child: Row(children: [
                      _toggleButton('Mensual', !_isAnnual, () => setState(() => _isAnnual = false)),
                      _toggleButton('Anual -20%', _isAnnual, () => setState(() => _isAnnual = true)),
                    ]),
                  ),
                  const SizedBox(height: 20),

                  // ── Plans ─────────────────────────────────────
                  ..._plans.map((plan) => _planCard(plan)),
                  const SizedBox(height: 8),

                  // ── Subscribe button ──────────────────────────
                  GestureDetector(
                    onTap: _confirmSubscription,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                      child: Center(child: Text('Suscribirse al Plan', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.backgroundPrimary, letterSpacing: 0.5))),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(child: Text('14 días de prueba gratis · Cancelá cuando quieras', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary))),
                  const SizedBox(height: 32),

                  // ── Payment History ────────────────────────────
                  Row(children: [
                    Text('HISTORIAL', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                    const Spacer(),
                    Text('${_payments.length} registros', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
                  ]),
                  const SizedBox(height: 12),
                  ..._payments.map((p) => _paymentRow(p)),
                  const SizedBox(height: 24),

                  // ── FAQ section ────────────────────────────────
                  Text('PREGUNTAS FRECUENTES', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  _faqItem('¿Puedo cambiar de plan?', 'Sí, podés upgradear o downgradear en cualquier momento. El cambio se aplica al próximo ciclo.'),
                  _faqItem('¿Qué métodos de pago aceptan?', 'Tarjeta de crédito/débito, transferencia bancaria, y facturación corporativa.'),
                  _faqItem('¿Hay período de prueba?', 'Sí, todos los planes incluyen 14 días gratis sin compromiso.'),
                  const SizedBox(height: 20),
                ],
              ),
      ),
    );
  }

  // ── Widgets ────────────────────────────────────────────────────────

  Widget _toggleButton(String label, bool active, VoidCallback onTap) {
    return Expanded(child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.textPrimary : AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(child: Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: active ? AppColors.backgroundPrimary : AppColors.textSecondary))),
      ),
    ));
  }

  Widget _planCard(Map<String, dynamic> plan) {
    final isSelected = _currentPlan == plan['id'];
    final price = _isAnnual ? plan['yearly'] : plan['monthly'];
    final unit = _isAnnual ? plan['unitYearly'] : plan['unit'];
    final features = plan['features'] as List<Map<String, dynamic>>;

    return GestureDetector(
      onTap: () => _selectPlan(plan['id']),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.textPrimary.withValues(alpha: 0.04) : AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.textPrimary : AppColors.separator,
            width: isSelected ? 1.5 : 0.5,
          ),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            // Radio
            Container(
              width: 20, height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: isSelected ? AppColors.textPrimary : AppColors.textSecondary, width: isSelected ? 6 : 1.5),
                color: AppColors.backgroundPrimary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(plan['name'], style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                if (plan['popular'] == true) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(4)),
                    child: Text('POPULAR', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w800, color: AppColors.backgroundPrimary, letterSpacing: 0.5)),
                  ),
                ],
              ]),
              Text(plan['desc'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('\$$price', style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
              Text(unit, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
            ]),
          ]),

          // Features (collapsed when not selected)
          if (isSelected) ...[
            const SizedBox(height: 14),
            Container(height: 0.5, color: AppColors.separator),
            const SizedBox(height: 12),
            Wrap(
              spacing: 0,
              runSpacing: 6,
              children: features.map((f) => SizedBox(
                width: double.infinity,
                child: Row(children: [
                  Icon(
                    f['enabled'] == true ? CupertinoIcons.checkmark_circle_fill : CupertinoIcons.xmark_circle,
                    size: 14,
                    color: f['enabled'] == true ? AppColors.textPrimary : AppColors.textTertiary,
                  ),
                  const SizedBox(width: 8),
                  Text(f['name'], style: GoogleFonts.inter(fontSize: 12, color: f['enabled'] == true ? AppColors.textPrimary : AppColors.textTertiary)),
                ]),
              )).toList(),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _paymentRow(Map<String, String> p) {
    final isPaid = p['status'] == 'Pagado';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: AppColors.textPrimary.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(child: Icon(
            isPaid ? CupertinoIcons.checkmark : CupertinoIcons.clock,
            size: 14, color: AppColors.textPrimary,
          )),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(p['month'] ?? '', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text(isPaid ? 'Procesado' : 'Próximo cobro', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        ])),
        Text(p['amount'] ?? '', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: AppColors.textPrimary.withValues(alpha: isPaid ? 0.06 : 0.12),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(p['status'] ?? '', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 0.3)),
        ),
      ]),
    );
  }

  Widget _faqItem(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(question, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 6),
        Text(answer, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, height: 1.4)),
      ]),
    );
  }
}
