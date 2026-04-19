import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show DropdownButton, DropdownMenuItem, DropdownButtonHideUnderline, Divider, MainAxisSize;
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class PanolScreen extends StatefulWidget {
  const PanolScreen({super.key});

  @override
  State<PanolScreen> createState() => _PanolScreenState();
}

class _PanolScreenState extends State<PanolScreen> {
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() { super.initState(); _loadItems(); }

  Future<void> _loadItems() async {
    try {
      final data = await SupabaseService.getInventoryItems();
      setState(() {
        if (data.isNotEmpty) {
          _items = data.map((i) => {
            'name': i['name'] ?? 'Sin nombre', 'category': i['category'] ?? '-',
            'stock': i['quantity'] ?? i['stock'] ?? 0, 'minAlert': i['min_stock'] ?? i['minAlert'] ?? 5,
            'unit': i['unit'] ?? 'uds', 'location': i['location'] ?? '-',
          }).toList();
        } else { _items = []; }
      });
    } catch (e) {
      debugPrint('Error cargando pañol: \$e');
      setState(() => _items = []);
    }
  }

  String _searchQuery = '';

  List<Map<String, dynamic>> get _filteredItems {
    if (_searchQuery.isEmpty) return _items;
    return _items.where((i) => i['name'].toString().toLowerCase().contains(_searchQuery.toLowerCase())).toList();
  }

  int get _lowStockCount => _items.where((i) => i['stock'] <= i['minAlert']).length;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context)),
        middle: Text('Pañol', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero, onPressed: _showAddItemModal,
          child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Pañol de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Inventario.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 24),

            Row(children: [
              _kpi('${_items.length}', 'Total Ítems'),
              const SizedBox(width: 10),
              _kpi('$_lowStockCount', 'Stock Bajo'),
              const SizedBox(width: 10),
              _kpi('5', 'Categorías'),
            ]),
            const SizedBox(height: 16),

            // Search
            CupertinoTextField(
              placeholder: 'Buscar repuesto...',
              prefix: const Padding(padding: EdgeInsets.only(left: 12), child: Icon(CupertinoIcons.search, color: AppColors.textSecondary, size: 16)),
              style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
              placeholderStyle: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 14),
              decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.separator, width: 0.5)),
              padding: const EdgeInsets.all(12),
              onChanged: (v) => setState(() => _searchQuery = v),
            ),
            const SizedBox(height: 16),
            ..._filteredItems.map((item) => _itemCard(item)),
            if (_filteredItems.isEmpty)
              Padding(
                padding: const EdgeInsets.all(20),
                child: Center(child: Text('Sin ítems', style: GoogleFonts.inter(color: AppColors.textSecondary))),
              ),
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
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
        ),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Nuevo Ítem', style: GoogleFonts.newsreader(fontSize: 22, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
              CupertinoButton(padding: EdgeInsets.zero, child: Icon(CupertinoIcons.xmark, color: AppColors.textSecondary, size: 20), onPressed: () => Navigator.pop(ctx)),
            ]),
          ),
          Container(height: 0.5, color: AppColors.separator),
          Expanded(child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _buildTextField('Nombre del repuesto', nameController),
              const SizedBox(height: 14),
              _buildTextField('Categoría', catController),
              const SizedBox(height: 14),
              _buildTextField('Stock Inicial', stockController, isNumeric: true),
              const SizedBox(height: 14),
              _buildTextField('Alerta de Stock Mínimo', minAlertController, isNumeric: true),
              const SizedBox(height: 14),
              _buildTextField('Ubicación', locationController),
              const SizedBox(height: 24),
              SizedBox(width: double.infinity, child: CupertinoButton(
                color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12),
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text('GUARDAR ÍTEM', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textOnAccent)),
                onPressed: () async {
                  if (nameController.text.isEmpty) return;
                  final payload = {
                    'name': nameController.text, 'category': catController.text,
                    'quantity': int.tryParse(stockController.text) ?? 0,
                    'min_stock': int.tryParse(minAlertController.text) ?? 5,
                    'location': locationController.text, 'unit': 'uds',
                  };
                  try {
                    await SupabaseService.insertInventoryItem(payload);
                    if (context.mounted) { Navigator.pop(ctx); _loadItems(); }
                  } catch (e) { debugPrint('Error: \$e'); }
                },
              )),
            ],
          )),
        ]),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {bool isNumeric = false}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
      const SizedBox(height: 6),
      CupertinoTextField(
        controller: controller,
        keyboardType: isNumeric ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
        style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
        placeholderStyle: GoogleFonts.inter(color: AppColors.textSecondary),
        decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.separator, width: 0.5)),
        padding: const EdgeInsets.all(12),
      ),
    ]);
  }

  Widget _kpi(String val, String label) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(children: [
        Text(val, style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
      ]),
    ),
  );

  Widget _itemCard(Map<String, dynamic> item) {
    final isLow = item['stock'] <= item['minAlert'];
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Text(item['name'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary))),
          if (isLow)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(6)),
              child: Text('STOCK BAJO', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 0.5)),
            ),
        ]),
        const SizedBox(height: 8),
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(6)),
            child: Text(item['category'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
          ),
          const SizedBox(width: 8),
          Icon(CupertinoIcons.location, color: AppColors.textSecondary, size: 12),
          const SizedBox(width: 4),
          Text(item['location'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
          const Spacer(),
          Text('${item['stock']} ${item['unit']}', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
        ]),
      ]),
    );
  }
}
