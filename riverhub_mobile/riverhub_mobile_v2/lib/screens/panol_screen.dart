import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
import '../services/locale_service.dart';

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
            'name': i['name'] ?? LocaleService.t('common_no_name'),
            'category': i['category'] ?? '-',
            'stock': i['quantity'] ?? i['stock'] ?? 0,
            'minAlert': i['min_stock'] ?? i['minAlert'] ?? 5,
            'unit': i['unit'] ?? 'uds',
            'location': i['location'] ?? '-',
          }).toList();
        } else { _items = []; }
      });
    } catch (e) {
      debugPrint('Error cargando pañol: $e');
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
        middle: Text(LocaleService.t('panol_title'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: _showAddItemModal, child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text(LocaleService.t('panol_header1'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text(LocaleService.t('panol_header2'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 24),

            Row(children: [
              _kpi('${_items.length}', LocaleService.t('panol_total_items')),
              const SizedBox(width: 10),
              _kpi('$_lowStockCount', LocaleService.t('panol_low_stock_kpi')),
              const SizedBox(width: 10),
              _kpi('5', LocaleService.t('panol_categories')),
            ]),
            const SizedBox(height: 16),

            CupertinoTextField(
              placeholder: LocaleService.t('panol_search'),
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
                child: Center(child: Text(LocaleService.t('panol_empty'), style: GoogleFonts.inter(color: AppColors.textSecondary))),
              ),
          ],
        ),
      ),
    );
  }

  void _showAddItemModal() {
    final nameController = TextEditingController();
    final catController = TextEditingController(text: LocaleService.t('dyn_key_202'));
    final stockController = TextEditingController();
    final minAlertController = TextEditingController();
    final locationController = TextEditingController();

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75),
          decoration: BoxDecoration(
            color: AppColors.backgroundPrimary,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
          ),
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(LocaleService.t('panol_add'), style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
                  Text(LocaleService.t('panol_inventory_label'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                ]),
                GestureDetector(onTap: () => Navigator.pop(ctx), child: Icon(CupertinoIcons.xmark_circle_fill, color: AppColors.textTertiary, size: 24)),
              ]),
            ),
            Container(height: 0.5, color: AppColors.separator),
            Expanded(child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildTextField(LocaleService.t('panol_name'), nameController, CupertinoIcons.cube_box),
                const SizedBox(height: 14),
                _buildTextField(LocaleService.t('panol_category'), catController, CupertinoIcons.tag),
                const SizedBox(height: 14),
                _buildTextField(LocaleService.t('panol_initial_stock'), stockController, CupertinoIcons.number, isNumeric: true),
                const SizedBox(height: 14),
                _buildTextField(LocaleService.t('panol_min_alert'), minAlertController, CupertinoIcons.exclamationmark_triangle, isNumeric: true),
                const SizedBox(height: 14),
                _buildTextField(LocaleService.t('panol_location_label'), locationController, CupertinoIcons.location),
                const SizedBox(height: 24),
                GestureDetector(
                  onTap: () async {
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
                    } catch (e) { debugPrint('Error: $e'); }
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                    child: Center(child: Text(LocaleService.t('panol_save_item'), style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.backgroundPrimary, letterSpacing: 0.5))),
                  ),
                ),
              ],
            )),
          ]),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {bool isNumeric = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(border: Border.all(color: AppColors.separator, width: 0.5), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Icon(icon, size: 18, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(child: CupertinoTextField(
          controller: controller, placeholder: label,
          keyboardType: isNumeric ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
          placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
          decoration: const BoxDecoration(), padding: const EdgeInsets.symmetric(vertical: 12),
        )),
      ]),
    );
  }

  Widget _kpi(String val, String label) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.separator, width: 0.5)),
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
      decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.separator, width: 0.5)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Text(item['name'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary))),
          if (isLow)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(6)),
              child: Text(LocaleService.t('panol_low'), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 0.5)),
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
