import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart'
    show DragTarget, Divider, Material, MaterialType, LongPressDraggable;
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
import '../services/ai_service.dart';

class ConvoysScreen extends StatefulWidget {
  const ConvoysScreen({super.key});

  @override
  State<ConvoysScreen> createState() => _ConvoysScreenState();
}

class _ConvoysScreenState extends State<ConvoysScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _availableAssets = [];
  // Convoy formation: ordered list of assigned assets (position = index)
  final List<Map<String, dynamic>?> _formation = List.filled(18, null);
  final TextEditingController _nameController = TextEditingController(
    text: 'Nuevo Convoy',
  );
  int? _selectedAssetIndex; // For tap-to-assign mode

  // IA Convoy Optimizer
  bool _loadingConvoyAI = false;
  Map<String, dynamic>? _convoyAISuggestion;
  final TextEditingController _destController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchAssets();
  }

  Future<void> _fetchAssets() async {
    setState(() => _isLoading = true);
    try {
      final response = await Supabase.instance.client
          .from('vessels')
          .select('*')
          .order('name', ascending: true);

      setState(() {
        _availableAssets = List<Map<String, dynamic>>.from(response).map((v) {
          String dbType = v['type']?.toString().toLowerCase() ?? v['vessel_type']?.toString().toLowerCase() ?? '';
          String name = v['name']?.toString().toLowerCase() ?? '';
          String type = 'BARCAZA';
          if (dbType.contains('tug') || dbType.contains('remolcador') || dbType.contains('push') || name.contains('r/m') || name.contains('b/m') || name.contains('tb ')) {
            type = 'REMOLCADOR';
          }
          if (dbType.contains('oil') || dbType.contains('tank') || dbType.contains('cisterna') || name.contains('t-')) {
            type = 'TANQUE';
          }
          v['mapped_type'] = type;
          return v;
        }).toList();

        if (_availableAssets.isEmpty) {
          _availableAssets = _defaultFleet();
        }
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching vessels: $e');
      setState(() {
        _availableAssets = _defaultFleet();
        _isLoading = false;
      });
    }
  }

  void _assignToSlot(int slotIndex, Map<String, dynamic> asset) {
    setState(() {
      // Remove from any existing slot
      for (int i = 0; i < _formation.length; i++) {
        if (_formation[i] != null && _formation[i]!['id'] == asset['id']) {
          _formation[i] = null;
        }
      }
      // If slot occupied, return that asset to available
      if (_formation[slotIndex] != null) {
        final returned = _formation[slotIndex]!;
        if (!_availableAssets.any((a) => a['id'] == returned['id'])) {
          _availableAssets.add(returned);
        }
      }
      // Place asset
      _formation[slotIndex] = Map<String, dynamic>.from(asset);
      // Remove from available
      _availableAssets.removeWhere((a) => a['id'] == asset['id']);
      _selectedAssetIndex = null;
    });
  }

  void _removeFromSlot(int slotIndex) {
    setState(() {
      if (_formation[slotIndex] != null) {
        final returned = _formation[slotIndex]!;
        if (!_availableAssets.any((a) => a['id'] == returned['id'])) {
          _availableAssets.add(returned);
        }
        _formation[slotIndex] = null;
      }
    });
  }

  void _clearFormation() {
    setState(() {
      for (int i = 0; i < _formation.length; i++) {
        if (_formation[i] != null) {
          if (!_availableAssets.any((a) => a['id'] == _formation[i]!['id'])) {
            _availableAssets.add(_formation[i]!);
          }
          _formation[i] = null;
        }
      }
    });
  }

  Future<void> _saveConvoy() async {
    final assigned = _formation.where((f) => f != null).toList();
    if (assigned.isEmpty) {
      showCupertinoDialog(
        context: context,
        builder: (ctx) => CupertinoAlertDialog(
          title: const Text('Sin Embarcaciones'),
          content: const Text('Agregue al menos una embarcación al convoy.'),
          actions: [
            CupertinoDialogAction(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final convoyCode =
          'CNV-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      final config = <Map<String, dynamic>>[];
      for (int i = 0; i < _formation.length; i++) {
        if (_formation[i] != null) {
          config.add({
            'position': i,
            'asset_id': _formation[i]!['id'],
            'name': _formation[i]!['name'],
          });
        }
      }

      await Supabase.instance.client.from('convoys').insert({
        'name': _nameController.text,
        'convoy_code': convoyCode,
        'configuration': config,
        'status': 'active',
      });

      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('✅ Convoy Guardado'),
            content: Text('Código: $convoyCode'),
            actions: [
              CupertinoDialogAction(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        _clearFormation();
        _fetchAssets();
      }
    } catch (e) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (ctx) => CupertinoAlertDialog(
            title: const Text('Error'),
            content: Text('Error: $e'),
            actions: [
              CupertinoDialogAction(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'REMOLCADOR':
        return AppColors.orange;
      case 'TANQUE':
        return AppColors.error;
      default:
        return AppColors.blue;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'REMOLCADOR':
        return CupertinoIcons.bolt_fill;
      case 'TANQUE':
        return CupertinoIcons.drop_fill;
      default:
        return CupertinoIcons.cube_box_fill;
    }
  }

  List<Map<String, dynamic>> _defaultFleet() => [
    {'id': 1, 'name': 'R/M HERCULES', 'mapped_type': 'REMOLCADOR'},
    {'id': 2, 'name': 'R/M CENTAURO', 'mapped_type': 'REMOLCADOR'},
    {'id': 3, 'name': 'R/M TITAN', 'mapped_type': 'REMOLCADOR'},
    {'id': 4, 'name': 'B-101 SOJA', 'mapped_type': 'BARCAZA'},
    {'id': 5, 'name': 'B-102 MAIZ', 'mapped_type': 'BARCAZA'},
    {'id': 6, 'name': 'B-103 TRIGO', 'mapped_type': 'BARCAZA'},
    {'id': 7, 'name': 'B-104 GIRASOL', 'mapped_type': 'BARCAZA'},
    {'id': 8, 'name': 'B-105 ARROZ', 'mapped_type': 'BARCAZA'},
    {'id': 9, 'name': 'B-106 CEMENTO', 'mapped_type': 'BARCAZA'},
    {'id': 10, 'name': 'B-107 HIERRO', 'mapped_type': 'BARCAZA'},
    {'id': 11, 'name': 'B-108 ARENA', 'mapped_type': 'BARCAZA'},
    {'id': 12, 'name': 'B-109 CLINKER', 'mapped_type': 'BARCAZA'},
    {'id': 13, 'name': 'B-110 MINERAL', 'mapped_type': 'BARCAZA'},
    {'id': 14, 'name': 'T-501 GASOIL', 'mapped_type': 'TANQUE'},
    {'id': 15, 'name': 'T-502 NAFTA', 'mapped_type': 'TANQUE'},
    {'id': 16, 'name': 'T-503 QUIMICO', 'mapped_type': 'TANQUE'},
  ];

  String _slotLabel(int i) {
    if (i == 0) return 'REMOLCADOR (Proa)';
    if (i == 17) return 'REMOLCADOR (Popa)';
    final row = ((i - 1) ~/ 4) + 1;
    final pos = ((i - 1) % 4) + 1;
    return 'Fila $row • Pos $pos';
  }

  @override
  Widget build(BuildContext context) {
    final assignedCount = _formation.where((f) => f != null).length;

    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundPrimary.withValues(alpha: 0.95),
        middle: Text(
          'Armador de Convoyes',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: AppColors.accent),
          onPressed: () => Navigator.pop(context),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (assignedCount > 0)
              CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: _clearFormation,
                child: const Icon(
                  CupertinoIcons.trash,
                  color: AppColors.error,
                  size: 20,
                ),
              ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: _isLoading ? null : _saveConvoy,
              child: Text(
                'Guardar',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  color: AppColors.accent,
                ),
              ),
            ),
          ],
        ),
      ),
      child: SafeArea(
        child: Material(
          type: MaterialType.transparency,
          child: Column(
            children: [
              // Name input
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: CupertinoTextField(
                  controller: _nameController,
                  placeholder: 'Nombre del Convoy',
                  style: const TextStyle(color: AppColors.textPrimary),
                  placeholderStyle: const TextStyle(color: AppColors.textSecondary),
                  padding: const EdgeInsets.all(14),
                  prefix: const Padding(
                    padding: EdgeInsets.only(left: 12),
                    child: Icon(
                      CupertinoIcons.link,
                      color: AppColors.textSecondary,
                      size: 18,
                    ),
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundSecondary,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.separator),
                  ),
                ),
              ),

              // ── IA Convoy Optimizer ──
              _buildConvoyAIPanel(),

              // Formation visual
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'FORMACIÓN ($assignedCount/18)',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.systemGray2,
                        letterSpacing: 1.2,
                      ),
                    ),
                    if (_selectedAssetIndex != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Toque un slot para asignar',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppColors.success,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Formation grid - visual convoy layout
              Expanded(
                flex: 5,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.backgroundSecondary,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.separator),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        // Row: Remolcador Proa
                        _buildFormationSlot(0, fullWidth: true),
                        const SizedBox(height: 6),
                        // Divider
                        Row(
                          children: [
                            const Expanded(
                              child: Divider(color: AppColors.separator),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                              ),
                              child: Text(
                                'BARCAZAS',
                                style: GoogleFonts.inter(
                                  fontSize: 9,
                                  color: AppColors.systemGray2,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                            const Expanded(
                              child: Divider(color: AppColors.separator),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // 4 rows of 4 barcazas each
                        for (int row = 0; row < 4; row++) ...[
                          Expanded(
                            child: Row(
                              children: [
                                for (int col = 0; col < 4; col++) ...[
                                  if (col > 0) const SizedBox(width: 4),
                                  Expanded(
                                    child: _buildFormationSlot(
                                      1 + row * 4 + col,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          if (row < 3) const SizedBox(height: 4),
                        ],
                        const SizedBox(height: 6),
                        // Divider
                        Row(
                          children: [
                            const Expanded(
                              child: Divider(color: AppColors.separator),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                              ),
                              child: Text(
                                '▼ POPA',
                                style: GoogleFonts.inter(
                                  fontSize: 9,
                                  color: AppColors.systemGray2,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                            const Expanded(
                              child: Divider(color: AppColors.separator),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // Row: Remolcador Popa
                        _buildFormationSlot(17, fullWidth: true),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 8),

              // Available assets
              Container(
                height: 150,
                decoration: const BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  border: Border(top: BorderSide(color: AppColors.separator)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                      child: Text(
                        'FLOTA DISPONIBLE (${_availableAssets.length})',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.systemGray2,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    Expanded(
                      child: _isLoading
                          ? const Center(child: CupertinoActivityIndicator())
                          : _availableAssets.isEmpty
                          ? Center(
                              child: Text(
                                'Toda la flota está asignada',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: AppColors.systemGray2,
                                ),
                              ),
                            )
                          : ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                              itemCount: _availableAssets.length,
                              itemBuilder: (context, index) {
                                final asset = _availableAssets[index];
                                final isSelected = _selectedAssetIndex == index;
                                final color = _typeColor(
                                  asset['mapped_type'] ?? 'BARCAZA',
                                );

                                return Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 4,
                                    vertical: 4,
                                  ),
                                  child:
                                      LongPressDraggable<Map<String, dynamic>>(
                                        data: asset,
                                        delay: const Duration(
                                          milliseconds: 150,
                                        ),
                                        feedback: Material(
                                          color: const Color(0x00000000),
                                          child: Container(
                                            width: 100,
                                            height: 70,
                                            decoration: BoxDecoration(
                                              color: color,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: color.withValues(
                                                    alpha: 0.5,
                                                  ),
                                                  blurRadius: 12,
                                                ),
                                              ],
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(
                                              asset['name'],
                                              textAlign: TextAlign.center,
                                              style: const TextStyle(
                                                color: AppColors.textOnAccent,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                        ),
                                        childWhenDragging: Opacity(
                                          opacity: 0.3,
                                          child: _assetChip(
                                            asset,
                                            color,
                                            false,
                                          ),
                                        ),
                                        child: GestureDetector(
                                          onTap: () => setState(
                                            () => _selectedAssetIndex =
                                                isSelected ? null : index,
                                          ),
                                          child: _assetChip(
                                            asset,
                                            color,
                                            isSelected,
                                          ),
                                        ),
                                      ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _convoyAIError;

  Future<void> _runConvoyAI() async {
    setState(() { _loadingConvoyAI = true; _convoyAIError = null; });
    try {
      final result = await AIService.optimizeConvoy(destination: _destController.text);
      if (mounted) {
        setState(() {
          _convoyAISuggestion = result.isNotEmpty ? result : null;
          _loadingConvoyAI = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingConvoyAI = false;
          _convoyAIError = 'Error: $e';
        });
      }
    }
  }

  Widget _buildConvoyAIPanel() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF8B5CF6).withValues(alpha: 0.1), const Color(0xFF3B82F6).withValues(alpha: 0.1)],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF8B5CF6).withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(CupertinoIcons.wand_stars, color: Color(0xFF8B5CF6), size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Optimizador IA', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary)),
                    Text('Formación óptima según río y calados', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: CupertinoTextField(
                  controller: _destController,
                  placeholder: 'Destino (ej: Rosario)',
                  padding: const EdgeInsets.all(10),
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary),
                  placeholderStyle: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundSecondary,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.separator),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              CupertinoButton(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                color: const Color(0xFF8B5CF6),
                borderRadius: BorderRadius.circular(10),
                onPressed: _loadingConvoyAI ? null : _runConvoyAI,
                child: _loadingConvoyAI
                    ? const CupertinoActivityIndicator(color: CupertinoColors.white, radius: 8)
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(CupertinoIcons.sparkles, size: 14, color: CupertinoColors.white),
                          const SizedBox(width: 4),
                          Text('Sugerir', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: CupertinoColors.white)),
                        ],
                      ),
              ),
            ],
          ),
          if (_loadingConvoyAI)
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Center(
                child: Column(
                  children: [
                    const CupertinoActivityIndicator(radius: 12),
                    const SizedBox(height: 8),
                    Text('Gemini optimizando...\n(puede tardar hasta 60s)', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary, fontStyle: FontStyle.italic)),
                  ],
                ),
              ),
            ),
          if (_convoyAIError != null && !_loadingConvoyAI)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3)),
                ),
                child: Text(_convoyAIError!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFEF4444))),
              ),
            ),
          if (_convoyAISuggestion != null && !_loadingConvoyAI) ...[
            const SizedBox(height: 12),
            Builder(builder: (context) {
              final s = _convoyAISuggestion!;
              final f = s['formation'] as Map<String, dynamic>? ?? {};
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.separator),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Config + Risk
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('⚓ ${s['config'] ?? 'N/A'}',
                            style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18, color: const Color(0xFF8B5CF6))),
                        _buildRiskGauge(s['risk_score'] as num? ?? 0),
                      ],
                    ),
                    const SizedBox(height: 10),
                    if (f['proa'] != null) Text('🔴 Proa: ${f['proa']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary)),
                    if (f['barcazas_f1'] != null) Text('📦 Fila 1: ${(f['barcazas_f1'] as List).join(', ')}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary)),
                    if (f['barcazas_f2'] != null) Text('📦 Fila 2: ${(f['barcazas_f2'] as List).join(', ')}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary)),
                    if (f['popa'] != null) Text('🔵 Popa: ${f['popa']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary)),
                    if (s['fuel_estimate_liters'] != null) ...[
                      const SizedBox(height: 8),
                      Text('⛽ Consumo: ${s['fuel_estimate_liters']} lts', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    ],
                    if (s['warnings'] != null)
                      ...(s['warnings'] as List).map((w) =>
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text('⚠️ $w', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFF59E0B))),
                          )),
                    if (s['recommendation'] != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('🤖 ${s['recommendation']}',
                            style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary)),
                      ),
                    ],
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildRiskGauge(num score) {
    final color = score <= 30 ? const Color(0xFF10B981) : score <= 60 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444);
    return Column(
      children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 3.5),
          ),
          child: Center(child: Text('$score', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14, color: color))),
        ),
        const SizedBox(height: 2),
        Text('RIESGO', style: GoogleFonts.inter(fontSize: 8, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _assetChip(Map<String, dynamic> asset, Color color, bool selected) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 95,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: selected
            ? color.withValues(alpha: 0.2)
            : AppColors.separator,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: selected ? color : color.withValues(alpha: 0.3),
          width: selected ? 2 : 1,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _typeIcon(asset['mapped_type'] ?? 'BARCAZA'),
            color: color,
            size: 22,
          ),
          const SizedBox(height: 4),
          Text(
            asset['name'],
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            asset['mapped_type'] ?? '',
            style: GoogleFonts.inter(
              fontSize: 7,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormationSlot(int index, {bool fullWidth = false}) {
    final asset = _formation[index];
    final hasAsset = asset != null;
    final label = _slotLabel(index);
    final isTarget = _selectedAssetIndex != null;

    return DragTarget<Map<String, dynamic>>(
      onAcceptWithDetails: (details) => _assignToSlot(index, details.data),
      builder: (context, candidateData, rejectedData) {
        final isHighlighted = candidateData.isNotEmpty;

        return GestureDetector(
          onTap: () {
            if (isTarget && _selectedAssetIndex != null) {
              _assignToSlot(index, _availableAssets[_selectedAssetIndex!]);
            } else if (hasAsset) {
              _removeFromSlot(index);
            }
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            height: fullWidth ? 60 : null,
            decoration: BoxDecoration(
              color: isHighlighted
                  ? AppColors.success.withValues(alpha: 0.2)
                  : hasAsset
                  ? _typeColor(
                      asset['mapped_type'] ?? 'BARCAZA',
                    ).withValues(alpha: 0.1)
                  : isTarget
                  ? AppColors.success.withValues(alpha: 0.05)
                  : AppColors.separator.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isHighlighted
                    ? AppColors.success
                    : hasAsset
                    ? _typeColor(
                        asset['mapped_type'] ?? 'BARCAZA',
                      ).withValues(alpha: 0.6)
                    : isTarget
                    ? AppColors.success.withValues(alpha: 0.4)
                    : AppColors.separator,
                width: isHighlighted || hasAsset ? 2 : 1,
              ),
            ),
            child: hasAsset
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _typeIcon(asset['mapped_type'] ?? 'BARCAZA'),
                          color: _typeColor(asset['mapped_type'] ?? 'BARCAZA'),
                          size: 18,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          asset['name'],
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          'Toque para quitar',
                          style: GoogleFonts.inter(
                            fontSize: 7,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  )
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          isTarget
                              ? CupertinoIcons.plus_circle
                              : CupertinoIcons.square_on_square,
                          color: isTarget
                              ? AppColors.success
                              : AppColors.systemGray2,
                          size: 16,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          label,
                          style: GoogleFonts.inter(
                            fontSize: 8,
                            color: AppColors.systemGray2,
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        );
      },
    );
  }
}
