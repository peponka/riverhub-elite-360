import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import '../theme/app_colors.dart';
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
              _kpi('$_lowStockCount', LocaleService.t('panol_low_stock_kpi'), color: AppColors.error),
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
            if (_filteredItems.isEmpty)
              Padding(
                padding: const EdgeInsets.all(20),
                child: Center(child: Text(LocaleService.t('panol_empty'), style: GoogleFonts.inter(color: AppColors.textSecondary))),
              )
            else
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.9,
                children: _filteredItems.map((item) => _itemCard(item)).toList(),
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

  Widget _kpi(String val, String label, {Color? color}) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.separator, width: 0.5)),
      child: Column(children: [
        Text(val, style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w400, color: color ?? AppColors.textPrimary)),
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
      ]),
    ),
  );

  Widget _itemCard(Map<String, dynamic> item) {
    final int stock = item['stock'] ?? 0;
    final int minAlert = item['minAlert'] ?? 5;
    final bool isLow = stock <= minAlert;
    final bool isCritical = stock == 0;

    // Stock level badge
    String levelLabel;
    Color levelColor;
    if (isCritical) {
      levelLabel = 'SIN STOCK';
      levelColor = AppColors.error;
    } else if (isLow) {
      levelLabel = LocaleService.t('panol_low');
      levelColor = AppColors.orange;
    } else {
      levelLabel = 'OK';
      levelColor = AppColors.success;
    }

    // Category color
    final cat = (item['category'] ?? '').toString().toLowerCase();
    Color catColor = AppColors.accent;
    IconData catIcon = CupertinoIcons.cube_box_fill;
    if (cat.contains('motor')) { catColor = const Color(0xFFF97316); catIcon = CupertinoIcons.gear_alt_fill; }
    else if (cat.contains('lubri')) { catColor = const Color(0xFF8B5CF6); catIcon = CupertinoIcons.drop_fill; }
    else if (cat.contains('filtro')) { catColor = const Color(0xFF6B7280); catIcon = CupertinoIcons.slider_horizontal_3; }
    else if (cat.contains('cabull')) { catColor = const Color(0xFF0EA5E9); catIcon = CupertinoIcons.link; }
    else if (cat.contains('pintura')) { catColor = const Color(0xFFEC4899); catIcon = CupertinoIcons.paintbrush_fill; }
    else if (cat.contains('seguri') || cat.contains('salvav')) { catColor = AppColors.error; catIcon = CupertinoIcons.shield_fill; }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isLow ? levelColor.withValues(alpha: 0.3) : AppColors.separator, width: isLow ? 1 : 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top accent bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: levelColor,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(14), topRight: Radius.circular(14)),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon + name
                  Row(children: [
                    Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        color: catColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Center(child: Icon(catIcon, size: 14, color: catColor)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(item['name'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.textPrimary), maxLines: 2, overflow: TextOverflow.ellipsis)),
                  ]),
                  const SizedBox(height: 8),
                  // Category chip
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: catColor.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(6)),
                    child: Text(item['category'], style: GoogleFonts.inter(fontSize: 9, color: catColor, fontWeight: FontWeight.w600)),
                  ),
                  const Spacer(),
                  // Stock number
                  Center(
                    child: Text('$stock ${item['unit']}', style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w600, color: isLow ? levelColor : AppColors.textPrimary)),
                  ),
                  const SizedBox(height: 6),
                  // Level badge
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: levelColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: levelColor.withValues(alpha: 0.3), width: 0.5),
                      ),
                      child: Text(levelLabel, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: levelColor, letterSpacing: 0.5)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
