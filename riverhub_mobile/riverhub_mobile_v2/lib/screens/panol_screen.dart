import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';

class PanolScreen extends StatefulWidget {
  const PanolScreen({super.key});

  @override
  State<PanolScreen> createState() => _PanolScreenState();
}

class _PanolScreenState extends State<PanolScreen> {
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    try {
      final data = await SupabaseService.getInventoryItems();
      setState(() {
        if (data.isNotEmpty) {
          _items = data
              .map(
                (i) => {
                  'name': i['name'] ?? 'Sin nombre',
                  'category': i['category'] ?? '-',
                  'stock': i['quantity'] ?? i['stock'] ?? 0,
                  'minAlert': i['min_stock'] ?? i['minAlert'] ?? 5,
                  'unit': i['unit'] ?? 'uds',
                  'location': i['location'] ?? '-',
                },
              )
              .toList();
        } else {
          _items = []; // Mock asesinado
        }
      });
    } catch(e) {
      debugPrint('Error cargando pañol: \$e');
      setState(() {
        _items = []; // Kill mock
      });
    }
  }

  String _searchQuery = '';

  List<Map<String, dynamic>> get _filteredItems {
    if (_searchQuery.isEmpty) return _items;
    return _items
        .where(
          (i) => i['name'].toString().toLowerCase().contains(
            _searchQuery.toLowerCase(),
          ),
        )
        .toList();
  }

  int get _lowStockCount =>
      _items.where((i) => i['stock'] <= i['minAlert']).length;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Pañol (Inventario)',
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
              Text('Añadir ', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 14, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.add_circled, color: Color(0xFF00E5FF), size: 22),
            ],
          ),
          onPressed: _showAddItemModal,
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // KPIs
            Row(
              children: [
                _kpi(
                  'Total Ítems',
                  '${_items.length}',
                  const Color(0xFF3B82F6),
                ),
                const SizedBox(width: 10),
                _kpi('Stock Bajo', '$_lowStockCount', const Color(0xFFEF4444)),
                const SizedBox(width: 10),
                _kpi('Categorías', '5', const Color(0xFF10B981)),
              ],
            ),
            const SizedBox(height: 14),
            // Search
            CupertinoTextField(
              placeholder: 'Buscar repuesto...',
              prefix: const Padding(
                padding: EdgeInsets.only(left: 10),
                child: Icon(
                  CupertinoIcons.search,
                  color: Color(0xFF64748B),
                  size: 18,
                ),
              ),
              style: const TextStyle(color: material.Colors.white),
              placeholderStyle: const TextStyle(color: Color(0xFF64748B)),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.all(12),
              onChanged: (v) => setState(() => _searchQuery = v),
            ),
            const SizedBox(height: 16),
            ..._filteredItems.map((item) => _itemCard(item)),
          ],
        ),
      ),
    );
  }

  void _showAddItemModal() {
    final nameController = TextEditingController();
    final catController = TextEditingController(text: 'Repuestos');
    final stockController = TextEditingController();
    final minAlertController = TextEditingController();
    final locationController = TextEditingController();

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
                  const Text('Nuevo Ítem', style: TextStyle(color: material.Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.xmark_circle_fill, color: Color(0xFF64748B)), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            const material.Divider(color: Color(0xFF1E293B)),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildTextField('Nombre del repuesto', nameController),
                  const SizedBox(height: 12),
                  _buildTextField('Categoría', catController),
                  const SizedBox(height: 12),
                  _buildTextField('Stock Inicial', stockController, isNumeric: true),
                  const SizedBox(height: 12),
                  _buildTextField('Alerta de Stock Mínimo', minAlertController, isNumeric: true),
                  const SizedBox(height: 12),
                  _buildTextField('Ubicación (Ej: Estante B)', locationController),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButton.filled(
                      child: const Text('Guardar Ítem'),
                      onPressed: () async {
                        if (nameController.text.isEmpty) return;
                        
                        final payload = {
                          'name': nameController.text,
                          'category': catController.text,
                          'quantity': int.tryParse(stockController.text) ?? 0,
                          'min_stock': int.tryParse(minAlertController.text) ?? 5,
                          'location': locationController.text,
                          'unit': 'uds', 
                        };
                        
                        try {
                           final success = await SupabaseService.insertInventoryItem(payload);
                           if (success && context.mounted) {
                             Navigator.pop(ctx);
                             _loadItems();
                           } else if (context.mounted) {
                             Navigator.pop(ctx);
                             _loadItems();
                           }
                        } catch(e) {
                           debugPrint('Error inserting item: \$e');
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
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }

  Widget _itemCard(Map<String, dynamic> item) {
    final isLow = item['stock'] <= item['minAlert'];
    final stockColor = isLow
        ? const Color(0xFFEF4444)
        : const Color(0xFF10B981);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isLow
              ? const Color(0xFFEF4444).withValues(alpha: 0.3)
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
                  item['name'],
                  style: const TextStyle(
                    color: material.Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              if (isLow)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'STOCK BAJO',
                    style: TextStyle(
                      color: Color(0xFFEF4444),
                      fontSize: 9,
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
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  item['category'],
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 11,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                CupertinoIcons.location_solid,
                color: Color(0xFF64748B),
                size: 12,
              ),
              const SizedBox(width: 4),
              Text(
                item['location'],
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
              ),
              const Spacer(),
              Text(
                '${item['stock']} ${item['unit']}',
                style: TextStyle(
                  color: stockColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
