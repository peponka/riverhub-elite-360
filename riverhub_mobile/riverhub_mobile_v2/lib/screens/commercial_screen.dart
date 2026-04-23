import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

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
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Módulo Comercial',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.backgroundPrimary.withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: AppColors.accent),
          onPressed: () => Navigator.pop(context),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _showCreateOrderModal,
          child: Row(
            mainAxisSize: material.MainAxisSize.min,
            children: const [
              Text('Nuevo ', style: TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.add_circled, color: AppColors.accent, size: 22),
            ],
          ),
        ),
      ),
      backgroundColor: AppColors.backgroundPrimary,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                _kpi('Contratos Activos', '$active', AppColors.success),
                const SizedBox(width: 10),
                _kpi('Valor Total', totalValue, AppColors.blue),
                const SizedBox(width: 10),
                _kpi('Clientes', '4', AppColors.purple),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Órdenes de Servicio',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ..._contracts.asMap().entries.map(
              (e) => _contractCard(e.key, e.value),
            ),
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
                  const Text('Nuevo Contrato', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                  CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.xmark_circle_fill, color: AppColors.textSecondary), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            const material.Divider(color: AppColors.separator),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildTextField('Cliente', clientController),
                  const SizedBox(height: 12),
                  _buildTextField('Tipo (Ej: TRANSPORTE)', typeController),
                  const SizedBox(height: 12),
                  _buildTextField('Mercadería', commodityController),
                  const SizedBox(height: 12),
                  _buildTextField('Cantidad (Tn/M3)', qtyController, isNumeric: true),
                  const SizedBox(height: 12),
                  _buildTextField('Valor (\$)', valueController, isNumeric: true),
                  const SizedBox(height: 12),
                  _buildTextField('Ruta', routeController),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButton.filled(
                      child: const Text('Guardar Contrato'),
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
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(
              val,
              style: TextStyle(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: AppColors.textTertiary, fontSize: 10),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
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
        statusText = 'PENDIENTE';
        break;
      default:
        statusColor = AppColors.textSecondary;
        statusText = 'COMPLETADO';
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
                      child: const Text(
                        'Ver Manifiestos',
                        style: TextStyle(
                          color: AppColors.accent,
                          fontSize: 12,
                        ),
                      ),
                      onPressed: () {
                        showCupertinoDialog(
                          context: context,
                          builder: (ctx) => CupertinoAlertDialog(
                            title: const Text('Detalle de Manifiesto'),
                            content: const Text('La visualización de manifiestos comerciales estará disponible próximamente en la versión móvil.'),
                            actions: [
                              CupertinoDialogAction(
                                child: const Text('Cerrar'),
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
                      child: const Text(
                        'Asignar Carga',
                        style: TextStyle(
                          color: AppColors.success,
                          fontSize: 12,
                        ),
                      ),
                      onPressed: () {
                        showCupertinoDialog(
                          context: context,
                          builder: (ctx) => CupertinoAlertDialog(
                            title: const Text('Asignación de Carga'),
                            content: const Text('Por favor, utilice RiverHub Elite Web para asignaciones complejas de carga.'),
                            actions: [
                              CupertinoDialogAction(
                                child: const Text('Cerrar'),
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
