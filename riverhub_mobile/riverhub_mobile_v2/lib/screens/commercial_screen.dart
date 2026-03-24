import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';

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
        backgroundColor: const Color(0xFF0A0E1A).withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: Color(0xFF00E5FF)),
          onPressed: () => Navigator.pop(context),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Row(
            mainAxisSize: material.MainAxisSize.min,
            children: const [
              Text('Nuevo ', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 14, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.add_circled, color: Color(0xFF00E5FF), size: 22),
            ],
          ),
          onPressed: _showCreateOrderModal,
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                _kpi('Contratos Activos', '$active', const Color(0xFF10B981)),
                const SizedBox(width: 10),
                _kpi('Valor Total', totalValue, const Color(0xFF3B82F6)),
                const SizedBox(width: 10),
                _kpi('Clientes', '4', const Color(0xFF8B5CF6)),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Órdenes de Servicio',
              style: TextStyle(
                color: material.Colors.white,
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
          color: Color(0xFF0F172A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Nuevo Contrato', style: TextStyle(color: material.Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.xmark_circle_fill, color: Color(0xFF64748B)), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            const material.Divider(color: Color(0xFF1E293B)),
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
        Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 6),
        CupertinoTextField(
          controller: controller,
          keyboardType: isNumeric ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          style: const TextStyle(color: material.Colors.white),
          placeholderStyle: const TextStyle(color: Color(0xFF64748B)),
          decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(10)),
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
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
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
        statusColor = const Color(0xFF10B981);
        statusText = 'ACTIVO';
        break;
      case 'pending':
        statusColor = const Color(0xFFF59E0B);
        statusText = 'PENDIENTE';
        break;
      default:
        statusColor = const Color(0xFF64748B);
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
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF00E5FF)
                : const Color(0xFF1E293B),
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
                      color: material.Colors.white,
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
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    c['type'],
                    style: const TextStyle(
                      color: Color(0xFF00E5FF),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${c['commodity']} • ${c['qty']}',
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
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
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
                Text(
                  c['value'],
                  style: const TextStyle(
                    color: Color(0xFF10B981),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            if (isSelected) ...[
              const SizedBox(height: 12),
              const material.Divider(color: Color(0xFF1E293B)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: CupertinoButton(
                      padding: const EdgeInsets.all(8),
                      color: const Color(0xFF1E293B),
                      child: const Text(
                        'Ver Manifiestos',
                        style: TextStyle(
                          color: Color(0xFF00E5FF),
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
                      color: const Color(0xFF1E293B),
                      child: const Text(
                        'Asignar Carga',
                        style: TextStyle(
                          color: Color(0xFF10B981),
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
