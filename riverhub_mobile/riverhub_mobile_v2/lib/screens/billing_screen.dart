import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  bool _isAnnual = false;
  String _currentPlan = 'combo'; // default selected
  bool _processing = false;

  final List<Map<String, dynamic>> _plans = [
    {
      'id': 'barcaza',
      'name': LocaleService.t('dyn_key_31'),
      'desc': LocaleService.t('dyn_key_53'),
      'monthly': 149,
      'yearly': 119,
      'unit': '/barcaza/mes',
      'unitYearly': '/barcaza/mes',
      'icon': '🚢',
      'popular': false,
      'features': [
        {'name': LocaleService.t('dyn_key_32'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_51'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_43'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_22'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_38'), 'enabled': false},
        {'name': 'API Integraciones', 'enabled': false},
      ],
    },
    {
      'id': 'combo',
      'name': LocaleService.t('dyn_key_39'),
      'desc': LocaleService.t('dyn_key_33'),
      'monthly': 899,
      'yearly': 719,
      'unit': '/mes (hasta 10)',
      'unitYearly': '/mes (hasta 10)',
      'icon': '⚓',
      'popular': true,
      'features': [
        {'name': LocaleService.t('dyn_key_36'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_30'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_21'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_54'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_27'), 'enabled': true},
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
        {'name': LocaleService.t('dyn_key_49'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_44'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_34'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_28'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_48'), 'enabled': true},
        {'name': 'SLA 99.9%', 'enabled': true},
      ],
    },
    {
      'id': 'ilimitado',
      'name': LocaleService.t('dyn_key_37'),
      'desc': LocaleService.t('dyn_key_52'),
      'monthly': 2499,
      'yearly': 1999,
      'unit': '/mes',
      'unitYearly': '/mes',
      'icon': '∞',
      'popular': false,
      'features': [
        {'name': LocaleService.t('dyn_key_25'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_23'), 'enabled': true},
        {'name': LocaleService.t('dyn_key_45'), 'enabled': true},
        {'name': 'White-label disponible', 'enabled': true},
        {'name': LocaleService.t('dyn_key_29'), 'enabled': true},
        {'name': 'Account manager', 'enabled': true},
      ],
    },
  ];

  // Simulated payment history
  final List<Map<String, String>> _payments = [
    {'month': 'Abril 2026', 'amount': '\$899', 'status': LocaleService.t('dyn_key_41')},
    {'month': 'Marzo 2026', 'amount': '\$899', 'status': LocaleService.t('dyn_key_35')},
    {'month': 'Febrero 2026', 'amount': '\$899', 'status': LocaleService.t('dyn_key_35')},
    {'month': 'Enero 2026', 'amount': '\$899', 'status': LocaleService.t('dyn_key_35')},
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
            Text(LocaleService.t('billing_confirmar_suscripcio'), style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
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
                    child: Text(LocaleService.t('billing_ahorras_20_anual'), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 0.5)),
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
                  Text(LocaleService.t('billing_metodo_de_pago'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                  Text(LocaleService.t('billing_tarjeta_4242'), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
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
                      title: Text(LocaleService.t('billing_suscripcion_activa'), style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                      content: Text('Tu plan ${plan['name']} está activo. ¡Gracias por elegirnos!', style: GoogleFonts.inter()),
                      actions: [
                        CupertinoDialogAction(child: Text(LocaleService.t('billing_aceptar'), style: GoogleFonts.inter(fontWeight: FontWeight.w600)), onPressed: () => Navigator.pop(dCtx)),
                      ],
                    ),
                  );
                }
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                child: Center(child: Text(LocaleService.t('billing_confirmar_pago'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.backgroundPrimary, letterSpacing: 0.5))),
              ),
            ),
            const SizedBox(height: 8),
            Text(LocaleService.t('billing_14_dias_de_prueba_gr'), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
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
        middle: Text(LocaleService.t('billing_facturacion'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: _processing
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                const CupertinoActivityIndicator(radius: 16),
                const SizedBox(height: 16),
                Text(LocaleService.t('billing_procesando_pago'), style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
              ]))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text(LocaleService.t('billing_planes'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text(LocaleService.t('billing_facturacion_1'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 6),
                  Text(LocaleService.t('billing_hidrovia_inteligente'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
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
                      _toggleButton(LocaleService.t('dyn_key_55'), !_isAnnual, () => setState(() => _isAnnual = false)),
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
                      child: Center(child: Text(LocaleService.t('billing_suscribirse_al_plan'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.backgroundPrimary, letterSpacing: 0.5))),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(child: Text(LocaleService.t('billing_14_dias_de_prueba_gr_1'), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary))),
                  const SizedBox(height: 32),

                  // ── Payment History ────────────────────────────
                  Row(children: [
                    Text(LocaleService.t('billing_historial'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                    const Spacer(),
                    Text('${_payments.length} registros', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
                  ]),
                  const SizedBox(height: 12),
                  ..._payments.map((p) => _paymentRow(p)),
                  const SizedBox(height: 24),

                  // ── FAQ section ────────────────────────────────
                  Text(LocaleService.t('billing_preguntas_frecuentes'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  _faqItem(LocaleService.t('dyn_key_26'), LocaleService.t('dyn_key_47')),
                  _faqItem(LocaleService.t('dyn_key_50'), 'Tarjeta de crédito/débito, transferencia bancaria, y facturación corporativa.'),
                  _faqItem(LocaleService.t('dyn_key_46'), LocaleService.t('dyn_key_42')),
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
                    child: Text(LocaleService.t('billing_popular_new'), style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w800, color: AppColors.backgroundPrimary, letterSpacing: 0.5)),
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
    final isPaid = p['status'] == LocaleService.t('dyn_key_35');
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
          Text(isPaid ? LocaleService.t('dyn_key_24') : LocaleService.t('dyn_key_40'), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
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
