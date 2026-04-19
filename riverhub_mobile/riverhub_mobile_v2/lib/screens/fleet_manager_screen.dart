import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import '../theme/app_colors.dart';

class FleetManagerScreen extends StatefulWidget {
  const FleetManagerScreen({super.key});

  @override
  State<FleetManagerScreen> createState() => _FleetManagerScreenState();
}

class _FleetManagerScreenState extends State<FleetManagerScreen> {
  List<Map<String, dynamic>> vessels = [];
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _loadVessels();
  }

  Future<void> _loadVessels() async {
    final data = await SupabaseService.getVessels();
    if (!mounted) return;
    setState(() {
      if (data.isNotEmpty) {
        vessels = data.map((v) => {
          'name': v['name'] ?? 'Sin nombre',
          'type': v['type'] ?? 'DESCONOCIDO',
          'status': v['status'] ?? 'active',
          'zone': v['current_location'] ?? v['zone'] ?? '-',
          'fuel': v['fuel_level'] ?? 0,
        }).toList();
      } else {
        vessels = [];
      }
    });
  }

  List<Map<String, dynamic>> get _filteredVessels {
    if (_filter == 'all') return vessels;
    return vessels.where((v) => v['status'] == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final active = vessels.where((v) => v['status'] == 'active').length;
    final maintenance = vessels.where((v) => v['status'] == 'maintenance').length;
    final transit = vessels.where((v) => v['status'] == 'transito').length;

    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        middle: Text('Flota', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Icon(CupertinoIcons.back, color: AppColors.textPrimary, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Gestión de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Flota.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 20),

            // KPI Row
            Row(
              children: [
                Expanded(child: _kpi('Operativos', '$active', AppColors.success)),
                const SizedBox(width: 10),
                Expanded(child: _kpi('En Taller', '$maintenance', AppColors.error)),
                const SizedBox(width: 10),
                Expanded(child: _kpi('En Ruta', '$transit', AppColors.accent)),
              ],
            ),
            const SizedBox(height: 20),

            // Filter chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                _chip('Todos', 'all'), _chip('Activos', 'active'),
                _chip('Taller', 'maintenance'), _chip('En Ruta', 'transito'),
              ]),
            ),
            const SizedBox(height: 20),

            ..._filteredVessels.map((v) => _vesselCard(v)),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String value, Color dot) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: dot, shape: BoxShape.circle)),
          const SizedBox(height: 10),
          Text(value, style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w400, color: AppColors.textPrimary)),
          Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Widget _chip(String label, String value) {
    final sel = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _filter = value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: sel ? AppColors.textPrimary : AppColors.backgroundSecondary,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? AppColors.textPrimary : AppColors.separator, width: 0.5),
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              color: sel ? AppColors.textOnAccent : AppColors.textSecondary,
              fontSize: 12, fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _vesselCard(Map<String, dynamic> v) {
    Color dotColor;
    String statusText;
    switch (v['status']) {
      case 'active': dotColor = AppColors.success; statusText = 'OPERATIVO'; break;
      case 'maintenance': dotColor = AppColors.error; statusText = 'TALLER'; break;
      default: dotColor = AppColors.accent; statusText = 'EN RUTA';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v['name'], style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(v['type'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
              Row(
                children: [
                  Container(width: 6, height: 6, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
                  const SizedBox(width: 6),
                  Text(statusText, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(CupertinoIcons.location, color: AppColors.textSecondary, size: 14),
              const SizedBox(width: 4),
              Text(v['zone'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
              const Spacer(),
              Icon(CupertinoIcons.drop, color: AppColors.textSecondary, size: 14),
              const SizedBox(width: 4),
              Text('${v['fuel']}%', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}
