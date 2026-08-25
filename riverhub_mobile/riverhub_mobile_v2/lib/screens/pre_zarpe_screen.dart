import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';
import 'dart:convert';

class PreZarpeScreen extends StatefulWidget {
  const PreZarpeScreen({super.key});
  @override
  State<PreZarpeScreen> createState() => _PreZarpeScreenState();
}

class _PreZarpeScreenState extends State<PreZarpeScreen> {
  List<Map<String, dynamic>> _checklists = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await Supabase.instance.client
          .from('departure_checklists')
          .select()
          .order('created_at', ascending: false)
          .limit(30);
      if (mounted)
        setState(() {
          _checklists = List<Map<String, dynamic>>.from(res);
          _loading = false;
        });
    } catch (e) {
      if (mounted)
        setState(() {
          _checklists = [];
          _loading = false;
        });
    }
  }

  // ── Checklist definition ──
  static const _sections = <String, List<String>>{
    'Tripulacion': [
      'Dotacion completa a bordo',
      'Licencias de navegacion vigentes',
      'Brevetes sanitarios al dia',
      'Roles de emergencia asignados',
    ],
    'Combustible': [
      'Nivel de combustible verificado',
      'Autonomia suficiente para viaje',
      'Sin fugas en sistema de combustible',
      'Registros de combustible actualizados',
    ],
    'Navegacion': [
      'Calado actual dentro de limites',
      'Cartas nauticas actualizadas',
      'GPS operativo',
      'Luces de navegacion operativas',
    ],
    'Seguridad': [
      'Extintores revisados y cargados',
      'Chalecos salvavidas completos',
      'Balsa salvavidas operativa',
      'Botiquin de primeros auxilios',
    ],
    'Documentacion': [
      'Matricula de la embarcacion',
      'Despacho de Prefectura',
      'Seguro vigente',
      'Manifiesto de carga',
    ],
    'Comunicaciones': [
      'Radio VHF operativo',
      'Frecuencia CH-16 probada',
      'Telefono satelital cargado',
      'Plan de comunicaciones vigente',
    ],
    'Meteorologia': [
      'Pronostico verificado 48h',
      'Condiciones aptas para zarpe',
      'Vientos dentro de parametros',
      'Sin alertas hidrometeorologicas',
    ],
  };

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: const Border(
          bottom: BorderSide(color: AppColors.separator, width: 0.5),
        ),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Icon(
                  CupertinoIcons.back,
                  size: 22,
                  color: AppColors.textPrimary,
                ),
                onPressed: () => Navigator.pop(context),
              )
            : CupertinoButton(
                padding: EdgeInsets.zero,
                child: const Icon(
                  CupertinoIcons.bars,
                  size: 24,
                  color: AppColors.textPrimary,
                ),
                onPressed: () => rootScaffoldKey.currentState?.openDrawer(),
              ),
        middle: Text(
          'Pre-Zarpe',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _startNew,
          child: const Icon(
            CupertinoIcons.plus,
            size: 22,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      child: SafeArea(
        child: _loading
            ? const Center(child: CupertinoActivityIndicator())
            : ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 20,
                ),
                children: [
                  Text(
                    'Checklist',
                    style: GoogleFonts.newsreader(
                      fontSize: 34,
                      fontWeight: FontWeight.w400,
                      color: AppColors.textPrimary,
                      height: 1.1,
                    ),
                  ),
                  Text(
                    'Pre-Zarpe',
                    style: GoogleFonts.newsreader(
                      fontSize: 34,
                      fontWeight: FontWeight.w300,
                      fontStyle: FontStyle.italic,
                      color: AppColors.textPrimary,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 20),
                  // KPIs
                  Row(
                    children: [
                      Expanded(
                        child: _kpi(
                          'TOTAL',
                          '${_checklists.length}',
                          CupertinoIcons.doc_checkmark_fill,
                          AppColors.accent,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _kpi(
                          'APROBADOS',
                          '${_checklists.where((c) => c['status'] == 'completed').length}',
                          CupertinoIcons.checkmark_seal_fill,
                          AppColors.success,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _kpi(
                          'BORRADOR',
                          '${_checklists.where((c) => c['status'] == 'draft').length}',
                          CupertinoIcons.pencil,
                          AppColors.warning,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Empty state or list
                  if (_checklists.isEmpty) ...[
                    const SizedBox(height: 20),
                    Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFF3B82F6,
                              ).withValues(alpha: 0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          CupertinoIcons.shield_fill,
                          size: 36,
                          color: CupertinoColors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: Text(
                        'Control Pre-Partida',
                        style: GoogleFonts.newsreader(
                          fontSize: 22,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Center(
                      child: Text(
                        'Verifica 28 puntos de seguridad antes\nde cada zarpe. Requerido por Prefectura.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Section preview chips
                    Wrap(
                      alignment: WrapAlignment.center,
                      spacing: 6,
                      runSpacing: 8,
                      children: [
                        _previewChip(
                          'Tripulacion',
                          CupertinoIcons.person_3_fill,
                          const Color(0xFF8B5CF6),
                        ),
                        _previewChip(
                          'Combustible',
                          CupertinoIcons.flame_fill,
                          const Color(0xFFF97316),
                        ),
                        _previewChip(
                          'Navegacion',
                          CupertinoIcons.compass_fill,
                          const Color(0xFF3B82F6),
                        ),
                        _previewChip(
                          'Seguridad',
                          CupertinoIcons.shield_fill,
                          const Color(0xFFEF4444),
                        ),
                        _previewChip(
                          'Documentos',
                          CupertinoIcons.doc_fill,
                          const Color(0xFF6B7280),
                        ),
                        _previewChip(
                          'Comms',
                          CupertinoIcons.antenna_radiowaves_left_right,
                          const Color(0xFF0EA5E9),
                        ),
                        _previewChip(
                          'Meteo',
                          CupertinoIcons.cloud_sun_fill,
                          const Color(0xFF10B981),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    // CTA Button
                    GestureDetector(
                      onTap: _startNew,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFF3B82F6,
                              ).withValues(alpha: 0.25),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              CupertinoIcons.checkmark_seal_fill,
                              size: 18,
                              color: CupertinoColors.white,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Iniciar Checklist Pre-Zarpe',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: CupertinoColors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Historial',
                          style: GoogleFonts.newsreader(
                            fontSize: 20,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '${_checklists.length} registros',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ..._checklists.map((c) => _checklistCard(c)),
                  ],
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              Icon(icon, size: 14, color: color.withValues(alpha: 0.5)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.newsreader(
              fontSize: 28,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _checklistCard(Map<String, dynamic> c) {
    final checked = (c['checked_items'] as num?)?.toInt() ?? 0;
    final total = (c['total_items'] as num?)?.toInt() ?? 28;
    final pct = total > 0 ? (checked / total * 100).round() : 0;
    final isComplete = c['status'] == 'completed';
    final color = isComplete ? AppColors.success : AppColors.warning;
    final signedAt = c['signed_at'] != null
        ? DateTime.tryParse(c['signed_at'].toString())
        : null;
    final timeStr = signedAt != null
        ? '${signedAt.day}/${signedAt.month} ${signedAt.hour.toString().padLeft(2, '0')}:${signedAt.minute.toString().padLeft(2, '0')}'
        : '--';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isComplete
                          ? CupertinoIcons.checkmark_seal_fill
                          : CupertinoIcons.pencil,
                      size: 18,
                      color: color,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        c['vessel_name'] ?? '',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        c['captain_name'] ?? '',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isComplete ? 'APROBADO' : 'BORRADOR',
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: color,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress bar
          Container(
            height: 6,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(3),
            ),
            child: LayoutBuilder(
              builder: (_, box) => Stack(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 600),
                    width: box.maxWidth * (pct / 100).clamp(0.0, 1.0),
                    height: 6,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$checked/$total items · $pct%',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                timeStr,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: [
              _chip(
                '${c['destination'] ?? '--'}',
                CupertinoIcons.location_solid,
              ),
              if (c['cargo_description'] != null)
                _chip(
                  '${c['cargo_description']} · ${c['cargo_tons'] ?? 0} ton',
                  CupertinoIcons.cube_box,
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _chip(String text, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _previewChip(String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.15), width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // ── New Checklist Flow ──
  void _startNew() {
    final vesselCtl = TextEditingController();
    final destCtl = TextEditingController();
    final cargoCtl = TextEditingController();
    final tonsCtl = TextEditingController();
    final obsCtl = TextEditingController();
    final checked = <String, Set<String>>{};
    for (final s in _sections.keys) {
      checked[s] = {};
    }

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setS) {
          int totalItems = 0, checkedItems = 0;
          for (final s in _sections.keys) {
            totalItems += _sections[s]!.length;
            checkedItems += checked[s]!.length;
          }
          final pct = totalItems > 0
              ? (checkedItems / totalItems * 100).round()
              : 0;
          final allDone = checkedItems == totalItems;

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.92,
            ),
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            decoration: const BoxDecoration(
              color: AppColors.backgroundSecondary,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.separator,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Nuevo Pre-Zarpe',
                      style: GoogleFonts.newsreader(
                        fontSize: 22,
                        fontWeight: FontWeight.w400,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      '$pct%',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: allDone ? AppColors.success : AppColors.warning,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // Progress
                Container(
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: LayoutBuilder(
                    builder: (_, box) => Align(
                      alignment: Alignment.centerLeft,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        width: box.maxWidth * (pct / 100),
                        height: 4,
                        decoration: BoxDecoration(
                          color: allDone ? AppColors.success : AppColors.accent,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView(
                    children: [
                      // Voyage info
                      _fLabel('EMBARCACION'), _fInput(vesselCtl, 'R/M Guarani'),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _fLabel('DESTINO'),
                                _fInput(destCtl, 'Rosario'),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _fLabel('CARGA (TON)'),
                                _fInput(tonsCtl, '3500', num: true),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _fLabel('DESCRIPCION DE CARGA'),
                      _fInput(cargoCtl, 'Soja, granel'),
                      const SizedBox(height: 20),
                      // Checklist sections
                      ..._sections.entries.map((entry) {
                        final sectionIcons = {
                          'Tripulacion': CupertinoIcons.person_3_fill,
                          'Combustible': CupertinoIcons.flame_fill,
                          'Navegacion': CupertinoIcons.compass_fill,
                          'Seguridad': CupertinoIcons.shield_fill,
                          'Documentacion': CupertinoIcons.doc_fill,
                          'Comunicaciones':
                              CupertinoIcons.antenna_radiowaves_left_right,
                          'Meteorologia': CupertinoIcons.cloud_sun_fill,
                        };
                        final sectionColors = {
                          'Tripulacion': const Color(0xFF8B5CF6),
                          'Combustible': const Color(0xFFF97316),
                          'Navegacion': const Color(0xFF3B82F6),
                          'Seguridad': const Color(0xFFEF4444),
                          'Documentacion': const Color(0xFF6B7280),
                          'Comunicaciones': const Color(0xFF0EA5E9),
                          'Meteorologia': const Color(0xFF10B981),
                        };
                        final sc = sectionColors[entry.key] ?? AppColors.accent;
                        final done =
                            checked[entry.key]!.length == entry.value.length;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: AppColors.backgroundPrimary,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: done
                                  ? AppColors.success.withValues(alpha: 0.3)
                                  : AppColors.separator,
                              width: 0.5,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.fromLTRB(
                                  14,
                                  14,
                                  14,
                                  8,
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 32,
                                      height: 32,
                                      decoration: BoxDecoration(
                                        color: sc.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Icon(
                                        sectionIcons[entry.key] ??
                                            CupertinoIcons.checkmark,
                                        size: 15,
                                        color: sc,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        entry.key.toUpperCase(),
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: sc,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '${checked[entry.key]!.length}/${entry.value.length}',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: done
                                            ? AppColors.success
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ...entry.value.map((item) {
                                final isChecked = checked[entry.key]!.contains(
                                  item,
                                );
                                return GestureDetector(
                                  onTap: () => setS(() {
                                    isChecked
                                        ? checked[entry.key]!.remove(item)
                                        : checked[entry.key]!.add(item);
                                  }),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 10,
                                    ),
                                    decoration: BoxDecoration(
                                      border: Border(
                                        top: BorderSide(
                                          color: AppColors.separator.withValues(
                                            alpha: 0.3,
                                          ),
                                          width: 0.5,
                                        ),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isChecked
                                              ? CupertinoIcons
                                                    .checkmark_circle_fill
                                              : CupertinoIcons.circle,
                                          size: 20,
                                          color: isChecked
                                              ? AppColors.success
                                              : AppColors.textSecondary
                                                    .withValues(alpha: 0.4),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            item,
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              color: isChecked
                                                  ? AppColors.textPrimary
                                                  : AppColors.textSecondary,
                                              decoration: isChecked
                                                  ? TextDecoration.lineThrough
                                                  : null,
                                              decorationColor:
                                                  AppColors.textSecondary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        );
                      }),
                      _fLabel('OBSERVACIONES'),
                      _fInput(obsCtl, 'Notas adicionales...'),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
                // Buttons
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => Navigator.pop(ctx),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLow,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              'Cancelar',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _save(
                          ctx,
                          vesselCtl.text,
                          destCtl.text,
                          cargoCtl.text,
                          tonsCtl.text,
                          obsCtl.text,
                          checked,
                          checkedItems,
                          totalItems,
                        ),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: allDone
                                ? AppColors.success
                                : AppColors.textPrimary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (allDone)
                                  const Icon(
                                    CupertinoIcons.checkmark_seal_fill,
                                    size: 16,
                                    color: CupertinoColors.white,
                                  ),
                                if (allDone) const SizedBox(width: 6),
                                Text(
                                  allDone
                                      ? 'Firmar y Aprobar'
                                      : 'Guardar Borrador',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: CupertinoColors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _fLabel(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(
      t,
      style: GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        color: AppColors.textSecondary,
        letterSpacing: 0.5,
      ),
    ),
  );
  Widget _fInput(TextEditingController c, String ph, {bool num = false}) =>
      CupertinoTextField(
        controller: c,
        placeholder: ph,
        keyboardType: num ? TextInputType.number : null,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
        placeholderStyle: GoogleFonts.inter(
          fontSize: 14,
          color: AppColors.textSecondary.withValues(alpha: 0.5),
        ),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
      );

  Future<void> _save(
    BuildContext ctx,
    String vessel,
    String dest,
    String cargo,
    String tons,
    String obs,
    Map<String, Set<String>> checked,
    int checkedItems,
    int totalItems,
  ) async {
    if (vessel.trim().isEmpty) return;
    Navigator.pop(ctx);
    final allDone = checkedItems == totalItems;
    try {
      final user = Supabase.instance.client.auth.currentUser;
      final profile = await Supabase.instance.client
          .from('user_profiles')
          .select('company_id, full_name')
          .eq('user_id', user!.id)
          .single();
      final checksJson = <String, dynamic>{};
      for (final e in checked.entries) {
        checksJson['${e.key.toLowerCase()}_checks'] = jsonEncode(
          e.value.toList(),
        );
      }

      await Supabase.instance.client.from('departure_checklists').insert({
        'company_id': profile['company_id'],
        'vessel_name': vessel.trim(),
        'captain_name':
            profile['full_name'] ?? user.email?.split('@')[0] ?? 'Capitan',
        'captain_user_id': user.id,
        'destination': dest.trim(),
        'cargo_description': cargo.trim(),
        'cargo_tons': double.tryParse(tons) ?? 0,
        'observations': obs.trim(),
        'checked_items': checkedItems,
        'total_items': totalItems,
        'status': allDone ? 'completed' : 'draft',
        ...checksJson,
      });
      await _load();
    } catch (e) {
      debugPrint('saveChecklist error: $e');
      // Add to local list as fallback
      if (mounted)
        setState(() {
          _checklists.insert(0, {
            'vessel_name': vessel,
            'captain_name': 'Yo',
            'destination': dest,
            'status': allDone ? 'completed' : 'draft',
            'checked_items': checkedItems,
            'total_items': totalItems,
            'signed_at': DateTime.now().toIso8601String(),
            'cargo_description': cargo,
            'cargo_tons': double.tryParse(tons) ?? 0,
          });
        });
    }
  }
}
