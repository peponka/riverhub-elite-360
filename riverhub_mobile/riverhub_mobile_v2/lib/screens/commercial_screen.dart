import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class CommercialScreen extends StatefulWidget {
  const CommercialScreen({super.key});

  @override
  State<CommercialScreen> createState() => _CommercialScreenState();
}

class _CommercialScreenState extends State<CommercialScreen> {
  List<Map<String, dynamic>> _contracts = [];

  int? _selectedIndex;

  @override
  void initState() {
    super.initState();
    _loadContracts();
  }

  Future<void> _loadContracts() async {
    final data = await SupabaseService.getServiceOrders();
    setState(() {
      if (data.isNotEmpty) {
        _contracts = data
            .map(
              (c) => {
                'client': c['client_name'] ?? c['client'] ?? '-',
                'type': c['type'] ?? 'TRANSPORTE',
                'commodity': c['commodity'] ?? '-',
                'qty': c['quantity']?.toString() ?? '-',
                'value': '\$${c['value'] ?? 0}',
                'status': c['status'] ?? 'active',
                'route': c['route'] ?? '-',
              },
            )
            .toList();
      } else {
        _contracts = [];
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final active = _contracts.where((c) => c['status'] == 'active').length;
    final totalValue = '\$2.83M';

    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: const Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text(LocaleService.t('dyn_key_58'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: _showCreateOrderModal, child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Gestión', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Comercial', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 6),
            Text('ORDENES DE SERVICIO', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 20),
            Row(children: [
              _kpi(LocaleService.t('dyn_key_56'), '$active', AppColors.success),
              const SizedBox(width: 8),
              _kpi(LocaleService.t('dyn_key_62'), totalValue, AppColors.accent),
              const SizedBox(width: 8),
              _kpi(LocaleService.t('dyn_key_4'), '4', const Color(0xFF8B5CF6)),
            ]),
            const SizedBox(height: 24),
            ..._contracts.asMap().entries.map((e) => _contractCard(e.key, e.value)),
          ],
        ),
      ),
    );
  }

  void _showCreateOrderModal() {
    final clientController = TextEditingController();
    final typeController = TextEditingController(text: 'TRANSPORTE');
    final commodityController = TextEditingController();
    final qtyController = TextEditingController();
    final valueController = TextEditingController();
    final routeController = TextEditingController();

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        padding: const EdgeInsets.only(top: 16),
        decoration: const BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(LocaleService.t('commercial_nuevo_contrato'), style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                  CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.xmark_circle_fill, color: AppColors.textSecondary), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            const material.Divider(color: AppColors.separator),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildTextField(LocaleService.t('dyn_key_57'), clientController),
                  const SizedBox(height: 12),
                  _buildTextField(LocaleService.t('dyn_key_63'), typeController),
                  const SizedBox(height: 12),
                  _buildTextField(LocaleService.t('dyn_key_61'), commodityController),
                  const SizedBox(height: 12),
                  _buildTextField('Cantidad (Tn/M3)', qtyController, isNumeric: true),
                  const SizedBox(height: 12),
                  _buildTextField('Valor (\$)', valueController, isNumeric: true),
                  const SizedBox(height: 12),
                  _buildTextField(LocaleService.t('dyn_key_60'), routeController),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButton.filled(
                      child: Text(LocaleService.t('commercial_guardar_contrato')),
                      onPressed: () async {
                        if (clientController.text.isEmpty) return;
                        
                        // Fake creating user_id if RLS requires it, or just pass the map
                        final payload = {
                          'client_name': clientController.text,
                          'type': typeController.text,
                          'commodity': commodityController.text,
                          'quantity': int.tryParse(qtyController.text) ?? 1000,
                          'value': double.tryParse(valueController.text) ?? 0,
                          'status': 'active',
                          'route': routeController.text,
                          'user_id': SupabaseService.currentUserId,
                        };
                        
                        try {
                           await SupabaseService.client.from('service_orders').insert(payload);
                           if (context.mounted) Navigator.pop(ctx);
                           _loadContracts();
                        } catch(e) {
                           debugPrint('Error inserting order: \$e');
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {bool isNumeric = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textTertiary, fontSize: 12)),
        const SizedBox(height: 6),
        CupertinoTextField(
          controller: controller,
          keyboardType: isNumeric ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          style: const TextStyle(color: AppColors.textPrimary),
          placeholderStyle: const TextStyle(color: AppColors.textSecondary),
          decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.all(12),
        ),
      ],
    );
  }

  Widget _kpi(String label, String val, Color color) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
          Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        ]),
        const SizedBox(height: 8),
        Text(val, style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1)),
      ]),
    ));
  }

  Widget _contractCard(int idx, Map<String, dynamic> c) {
    Color statusColor;
    String statusText;
    switch (c['status']) {
      case 'active':
        statusColor = AppColors.success;
        statusText = 'ACTIVO';
        break;
      case 'pending':
        statusColor = AppColors.warning;
        statusText = LocaleService.t('dyn_key_66');
        break;
      default:
        statusColor = AppColors.textSecondary;
        statusText = LocaleService.t('dyn_key_64');
    }
    final isSelected = _selectedIndex == idx;

    return GestureDetector(
      onTap: () => setState(() => _selectedIndex = isSelected ? null : idx),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.accent
                : AppColors.separator,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    c['client'],
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.separator,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    c['type'],
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${c['commodity']} • ${c['qty']}',
                  style: const TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  c['route'],
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                Text(
                  c['value'],
                  style: const TextStyle(
                    color: AppColors.success,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            if (isSelected) ...[
              const SizedBox(height: 12),
              const material.Divider(color: AppColors.separator),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: CupertinoButton(
                      padding: const EdgeInsets.all(8),
                      color: AppColors.separator,
                      child: Text(
                        LocaleService.t('dyn_key_59'),
                        style: TextStyle(
                          color: AppColors.accent,
                          fontSize: 12,
                        ),
                      ),
                      onPressed: () {
                        showCupertinoDialog(
                          context: context,
                          builder: (ctx) => CupertinoAlertDialog(
                            title: Text(LocaleService.t('commercial_detalle_de_manifiest')),
                            content: Text(LocaleService.t('commercial_la_visualizacion_de_')),
                            actions: [
                              CupertinoDialogAction(
                                child: Text(LocaleService.t('commercial_cerrar')),
                                onPressed: () => Navigator.pop(ctx),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: CupertinoButton(
                      padding: const EdgeInsets.all(8),
                      color: AppColors.separator,
                      child: Text(
                        LocaleService.t('dyn_key_65'),
                        style: TextStyle(
                          color: AppColors.success,
                          fontSize: 12,
                        ),
                      ),
                      onPressed: () {
                        showCupertinoDialog(
                          context: context,
                          builder: (ctx) => CupertinoAlertDialog(
                            title: Text(LocaleService.t('commercial_asignacion_de_carga')),
                            content: Text(LocaleService.t('commercial_por_favor_utilice_ri')),
                            actions: [
                              CupertinoDialogAction(
                                child: Text(LocaleService.t('commercial_cerrar')),
                                onPressed: () => Navigator.pop(ctx),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
