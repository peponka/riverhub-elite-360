import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class ContratosScreen extends StatefulWidget {
  const ContratosScreen({super.key});
  @override
  State<ContratosScreen> createState() => _ContratosScreenState();
}

class _ContratosScreenState extends State<ContratosScreen> {
  List<Map<String, dynamic>> _contracts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadContracts();
  }

  Future<void> _loadContracts() async {
    try {
      final res = await Supabase.instance.client
          .from('freight_contracts')
          .select()
          .order('created_at', ascending: false)
          .limit(50);
      if (mounted) setState(() { _contracts = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (e) {
      debugPrint('loadContracts error: $e');
      // Fallback demo data
      if (mounted) setState(() {
        _contracts = [
          {'client': 'Cargill S.A.', 'route': 'Rosario → Asunción', 'product': 'Soja', 'contract_type': 'COA Anual', 'status': 'active', 'volume_total': 84000, 'volume_used': 61200, 'rate_per_ton': 28.5, 'expiration_date': '2026-12-31'},
          {'client': 'ADM Paraguay', 'route': 'Concepción → San Lorenzo', 'product': 'Maíz', 'contract_type': 'Semestral', 'status': 'active', 'volume_total': 48000, 'volume_used': 32400, 'rate_per_ton': 24.2, 'expiration_date': '2026-06-30'},
          {'client': 'PETROPAR', 'route': 'Montevideo → Asunción', 'product': 'Gas Oil', 'contract_type': 'COA Anual', 'status': 'expires', 'volume_total': 36000, 'volume_used': 33800, 'rate_per_ton': 42.8, 'expiration_date': '2026-06-15'},
          {'client': 'Bunge Ltd.', 'route': 'Rosario → Nueva Palmira', 'product': 'Harina de Soja', 'contract_type': 'Trimestral', 'status': 'active', 'volume_total': 24000, 'volume_used': 18000, 'rate_per_ton': 22.0, 'expiration_date': '2026-09-30'},
          {'client': 'Louis Dreyfus', 'route': 'Barranqueras → Rosario', 'product': 'Girasol', 'contract_type': 'Spot', 'status': 'renewing', 'volume_total': 12000, 'volume_used': 12000, 'rate_per_ton': 35.0, 'expiration_date': '2026-05-10'},
          {'client': 'Viterra', 'route': 'San Lorenzo → Bahía Blanca', 'product': 'Trigo', 'contract_type': 'Semestral', 'status': 'active', 'volume_total': 60000, 'volume_used': 22000, 'rate_per_ton': 26.8, 'expiration_date': '2026-12-31'},
        ];
        _loading = false;
      });
    }
  }

  int get _activeCount => _contracts.where((c) => c['status'] == 'active').length;
  int get _totalTonnage => _contracts.fold(0, (s, c) => s + ((c['volume_total'] as num?)?.toInt() ?? 0));
  double get _totalRevenue => _contracts.fold(0.0, (s, c) => s + (((c['volume_used'] as num?)?.toDouble() ?? 0) * ((c['rate_per_ton'] as num?)?.toDouble() ?? 0)) / 1000);
  int get _expiringCount => _contracts.where((c) => c['status'] == 'expires' || c['status'] == 'renewing').length;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: const Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text(LocaleService.t('contratos_contratos'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: _showNewContract, child: const Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: _loading
            ? const Center(child: CupertinoActivityIndicator())
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                children: [
                  Text(LocaleService.t('contratos_contratos_de'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text(LocaleService.t('contratos_flete'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 20),

                  // KPIs
                  Row(children: [
                    Expanded(child: _kpi(LocaleService.t('dyn_key_75'), '$_activeCount', CupertinoIcons.doc_text_fill, AppColors.accent)),
                    const SizedBox(width: 8),
                    Expanded(child: _kpi(LocaleService.t('dyn_key_84'), '${(_totalTonnage / 1000).round()}k', CupertinoIcons.cube_box_fill, AppColors.success)),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: _kpi('REVENUE', '\$${_totalRevenue.toStringAsFixed(0)}k', CupertinoIcons.money_dollar_circle_fill, AppColors.warning)),
                    const SizedBox(width: 8),
                    Expanded(child: _kpi(LocaleService.t('dyn_key_71'), '$_expiringCount', CupertinoIcons.exclamationmark_triangle_fill, AppColors.error)),
                  ]),
                  const SizedBox(height: 24),

                  // Contracts List
                  _sectionTitle(LocaleService.t('dyn_key_72'), '${_contracts.length} total'),
                  const SizedBox(height: 12),
                  ..._contracts.map((c) => _contractCard(c)),

                  const SizedBox(height: 30),
                ],
              ),
      ),
    );
  }

  Widget _kpi(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
          Icon(icon, size: 14, color: color.withValues(alpha: 0.5)),
        ]),
        const SizedBox(height: 8),
        Text(value, style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1)),
      ]),
    );
  }

  Widget _sectionTitle(String title, String trailing) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(title, style: GoogleFonts.newsreader(fontSize: 20, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
      if (trailing.isNotEmpty) Text(trailing, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
    ]);
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'active': return AppColors.success;
      case 'expires': return AppColors.warning;
      case 'renewing': return AppColors.accent;
      default: return AppColors.textSecondary;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'active': return 'ACTIVO';
      case 'expires': return 'EXPIRA';
      case 'renewing': return 'RENOVANDO';
      default: return status.toUpperCase();
    }
  }

  Widget _contractCard(Map<String, dynamic> c) {
    final vol = (c['volume_total'] as num?)?.toInt() ?? 1;
    final used = (c['volume_used'] as num?)?.toInt() ?? 0;
    final pct = vol > 0 ? (used / vol * 100).round() : 0;
    final color = _statusColor(c['status'] ?? '');
    final barColor = pct > 90 ? AppColors.error : pct > 70 ? AppColors.warning : AppColors.success;
    final rate = (c['rate_per_ton'] as num?)?.toDouble() ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Text(c['client'] ?? '', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
            child: Text(_statusLabel(c['status'] ?? ''), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5)),
          ),
        ]),
        const SizedBox(height: 2),
        Text('${c['route'] ?? ''} — ${c['product'] ?? ''}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        const SizedBox(height: 12),

        // Usage bar
        Container(
          height: 8,
          decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(4)),
          child: LayoutBuilder(builder: (_, constraints) => Stack(children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 600),
              width: constraints.maxWidth * (pct / 100).clamp(0.0, 1.0),
              height: 8,
              decoration: BoxDecoration(color: barColor, borderRadius: BorderRadius.circular(4)),
            ),
          ])),
        ),
        const SizedBox(height: 6),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('$used / $vol ton · $pct%', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text('\$${rate.toStringAsFixed(1)}/ton', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.accent)),
        ]),
        const SizedBox(height: 8),

        // Meta
        Wrap(spacing: 6, runSpacing: 4, children: [
          _metaChip(c['contract_type'] ?? ''),
          _metaChip('Exp: ${c['expiration_date'] ?? '—'}'),
        ]),
      ]),
    );
  }

  Widget _metaChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
    );
  }

  // ─── FORM: Nuevo Contrato ───────────────────────────────
  final _clientCtl = TextEditingController();
  final _routeCtl = TextEditingController();
  final _productCtl = TextEditingController();
  final _volumeCtl = TextEditingController();
  final _rateCtl = TextEditingController();
  String _selectedType = 'COA Anual';
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 180));

  void _showNewContract() {
    _clientCtl.clear(); _routeCtl.clear(); _productCtl.clear(); _volumeCtl.clear(); _rateCtl.clear();
    _selectedType = 'COA Anual';
    _selectedDate = DateTime.now().add(const Duration(days: 180));

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx2, setModalState) {
        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: AppColors.backgroundSecondary,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
          ),
          child: SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Text('Nuevo Contrato', style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
            const SizedBox(height: 4),
            Text('Complete los datos del contrato de flete', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 20),

            _formLabel('CLIENTE'),
            _formField(_clientCtl, 'Ej: Cargill S.A.'),
            const SizedBox(height: 12),

            _formLabel('RUTA'),
            _formField(_routeCtl, 'Ej: Rosario → Asunción'),
            const SizedBox(height: 12),

            _formLabel('PRODUCTO'),
            _formField(_productCtl, 'Ej: Soja, Gas Oil'),
            const SizedBox(height: 12),

            _formLabel('TIPO DE CONTRATO'),
            CupertinoSlidingSegmentedControl<String>(
              groupValue: _selectedType,
              children: const {
                'COA Anual': Padding(padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6), child: Text('COA', style: TextStyle(fontSize: 11))),
                'Semestral': Padding(padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6), child: Text('Sem', style: TextStyle(fontSize: 11))),
                'Trimestral': Padding(padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6), child: Text('Trim', style: TextStyle(fontSize: 11))),
                'Spot': Padding(padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6), child: Text('Spot', style: TextStyle(fontSize: 11))),
              },
              onValueChanged: (v) => setModalState(() => _selectedType = v ?? 'COA Anual'),
            ),
            const SizedBox(height: 12),

            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _formLabel('VOLUMEN (TON)'),
                _formField(_volumeCtl, '84000', keyboard: TextInputType.number),
              ])),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _formLabel('TARIFA (USD/TON)'),
                _formField(_rateCtl, '28.5', keyboard: const TextInputType.numberWithOptions(decimal: true)),
              ])),
            ]),
            const SizedBox(height: 12),

            _formLabel('FECHA DE EXPIRACIÓN'),
            GestureDetector(
              onTap: () => _pickDate(ctx2, setModalState),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.separator, width: 0.5),
                ),
                child: Text(
                  '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                  style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
                ),
              ),
            ),
            const SizedBox(height: 24),

            Row(children: [
              Expanded(child: GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(12)),
                  child: Center(child: Text('Cancelar', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary))),
                ),
              )),
              const SizedBox(width: 12),
              Expanded(child: GestureDetector(
                onTap: () => _saveContract(ctx),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                  child: Center(child: Text('Guardar', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.backgroundPrimary))),
                ),
              )),
            ]),
            const SizedBox(height: 16),
          ])),
        );
      }),
    );
  }

  Widget _formLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
    );
  }

  Widget _formField(TextEditingController ctl, String placeholder, {TextInputType? keyboard}) {
    return CupertinoTextField(
      controller: ctl,
      placeholder: placeholder,
      keyboardType: keyboard,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
      placeholderStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary.withValues(alpha: 0.5)),
    );
  }

  void _pickDate(BuildContext ctx, StateSetter setModalState) {
    showCupertinoModalPopup(
      context: ctx,
      builder: (_) => Container(
        height: 260,
        color: AppColors.backgroundSecondary,
        child: CupertinoDatePicker(
          mode: CupertinoDatePickerMode.date,
          initialDateTime: _selectedDate,
          minimumDate: DateTime.now(),
          onDateTimeChanged: (d) => setModalState(() => _selectedDate = d),
        ),
      ),
    );
  }

  Future<void> _saveContract(BuildContext ctx) async {
    if (_clientCtl.text.trim().isEmpty) return;
    Navigator.pop(ctx);

    try {
      final profile = await Supabase.instance.client
          .from('user_profiles')
          .select('company_id')
          .eq('user_id', Supabase.instance.client.auth.currentUser!.id)
          .single();

      await Supabase.instance.client.from('freight_contracts').insert({
        'client': _clientCtl.text.trim(),
        'route': _routeCtl.text.trim(),
        'product': _productCtl.text.trim(),
        'contract_type': _selectedType,
        'volume_total': int.tryParse(_volumeCtl.text) ?? 0,
        'volume_used': 0,
        'rate_per_ton': double.tryParse(_rateCtl.text) ?? 0,
        'expiration_date': _selectedDate.toIso8601String().split('T')[0],
        'status': 'active',
        'company_id': profile['company_id'],
      });

      await _loadContracts();
    } catch (e) {
      debugPrint('saveContract error: $e');
    }
  }
}
