import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _shipments = [];

  @override
  void initState() {
    super.initState();
    _fetchShipments();
  }

  Future<void> _fetchShipments() async {
    setState(() => _isLoading = true);
    try {
      final response = await Supabase.instance.client
          .from('voyages')
          .select('*')
          .order('created_at', ascending: false);
      final data = List<Map<String, dynamic>>.from(response);

      if (data.isNotEmpty) {
        _shipments = data.map((v) {
          final vessel =
              v['vessel_name'] ??
              v['voyage_number'] ??
              LocaleService.t('dyn_key_173');
          final status = _mapStatus(v['status'] ?? 'planned');
          return {
            'id': v['id'],
            'vessel': vessel,
            'vessel_type': 'Remolcador',
            'product': v['cargo_type'] ?? LocaleService.t('dyn_key_222'),
            'qty': v['cargo_quantity'] != null
                ? '${v['cargo_quantity']} TN'
                : '-',
            'origin': v['origin_port'] ?? 'N/A',
            'dest': v['destination_port'] ?? 'N/A',
            'status': status,
            'status_raw': v['status'] ?? 'planned',
            'eta': _formatEta(v['eta']),
            'progress': _calculateProgress(
              v['status'] ?? 'planned',
              v['created_at'],
              v['eta'],
            ),
            'voyage_number': v['voyage_number'] ?? '',
          };
        }).toList();
      }
    } catch (e) {
      debugPrint('Error fetching shipments: $e');
      _shipments = [];
    }
    if (mounted) setState(() => _isLoading = false);
  }

  String _mapStatus(String raw) {
    switch (raw) {
      case 'active':
      case 'live':
        return LocaleService.t('dyn_key_224');
      case 'loading':
        return LocaleService.t('dyn_key_219');
      case 'completed':
        return LocaleService.t('dyn_key_220');
      case 'docked':
      case 'planned':
        return LocaleService.t('dyn_key_218');
      default:
        return LocaleService.t('dyn_key_228');
    }
  }

  String _formatEta(dynamic eta) {
    if (eta == null) return '-';
    try {
      final date = DateTime.parse(eta.toString());
      final now = DateTime.now();
      if (date.difference(now).inDays == 0) {
        return '${date.hour}:${date.minute.toString().padLeft(2, '0')}';
      }
      return '${date.day}/${date.month.toString().padLeft(2, '0')}';
    } catch (e) {
      return eta.toString().split('T').first;
    }
  }

  double _calculateProgress(String status, dynamic createdAt, dynamic eta) {
    if (status == 'completed') return 1.0;
    if (status == 'planned' || status == 'docked') return 0.0;
    if (status == 'loading') return 0.15;
    // For active voyages, estimate based on time elapsed
    if (createdAt != null && eta != null) {
      try {
        final start = DateTime.parse(createdAt.toString());
        final end = DateTime.parse(eta.toString());
        final now = DateTime.now();
        final total = end.difference(start).inMinutes;
        final elapsed = now.difference(start).inMinutes;
        if (total > 0) return (elapsed / total).clamp(0.05, 0.95);
      } catch (e) {
        /* fallback */
      }
    }
    return 0.5;
  }

  @override
  Widget build(BuildContext context) {
    final inTransit = _shipments
        .where((s) => s['status'] == LocaleService.t('dyn_key_224'))
        .length;
    final inPort = _shipments
        .where(
          (s) =>
              s['status'] == LocaleService.t('dyn_key_218') ||
              s['status'] == LocaleService.t('dyn_key_228'),
        )
        .length;
    final loading = _shipments
        .where((s) => s['status'] == LocaleService.t('dyn_key_219'))
        .length;
    final completed = _shipments
        .where((s) => s['status'] == LocaleService.t('dyn_key_220'))
        .length;

    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(
          bottom: BorderSide(color: AppColors.separator, width: 0.5),
        ),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                child: Icon(
                  CupertinoIcons.back,
                  size: 22,
                  color: AppColors.textPrimary,
                ),
                onPressed: () => Navigator.pop(context),
              )
            : CupertinoButton(
                padding: EdgeInsets.zero,
                child: Icon(
                  CupertinoIcons.bars,
                  size: 24,
                  color: AppColors.textPrimary,
                ),
                onPressed: () => rootScaffoldKey.currentState?.openDrawer(),
              ),
        middle: Text(
          LocaleService.t('tracking_tracking'),
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  CupertinoSliverRefreshControl(onRefresh: _fetchShipments),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 20,
                    ),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        Text(
                          LocaleService.t('tracking_tracking_de'),
                          style: GoogleFonts.newsreader(
                            fontSize: 34,
                            fontWeight: FontWeight.w400,
                            color: AppColors.textPrimary,
                            height: 1.1,
                          ),
                        ),
                        Text(
                          LocaleService.t('tracking_cargas'),
                          style: GoogleFonts.newsreader(
                            fontSize: 34,
                            fontWeight: FontWeight.w300,
                            fontStyle: FontStyle.italic,
                            color: AppColors.textPrimary,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${_shipments.length} MANIFIESTOS',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSecondary,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // KPIs
                        Row(
                          children: [
                            _kpi('$inTransit', LocaleService.t('dyn_key_224')),
                            const SizedBox(width: 10),
                            _kpi('$inPort', LocaleService.t('dyn_key_218')),
                            const SizedBox(width: 10),
                            _kpi('$loading', LocaleService.t('dyn_key_219')),
                            if (completed > 0) ...[
                              const SizedBox(width: 10),
                              _kpi(
                                '$completed',
                                LocaleService.t('dyn_key_226'),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Section header
                        Row(
                          children: [
                            Text(
                              LocaleService.t('tracking_embarques'),
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textSecondary,
                                letterSpacing: 1.5,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '${_shipments.length} activos',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: AppColors.textTertiary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        if (_shipments.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(40),
                            child: Column(
                              children: [
                                Icon(
                                  CupertinoIcons.cube_box,
                                  size: 40,
                                  color: AppColors.textTertiary,
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  LocaleService.t('tracking_sin_embarques'),
                                  style: GoogleFonts.newsreader(
                                    fontSize: 18,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  LocaleService.t(
                                    'tracking_crea_un_viaje_para_c',
                                  ),
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: AppColors.textTertiary,
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          ..._shipments.map((s) => _shipmentCard(s)),
                      ]),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _kpi(String val, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(
          children: [
            Text(
              val,
              style: GoogleFonts.newsreader(
                fontSize: 24,
                fontWeight: FontWeight.w400,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 9,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _shipmentCard(Map<String, dynamic> s) {
    final double progress = (s['progress'] as num?)?.toDouble() ?? 0.0;

    return GestureDetector(
      onTap: () => _showDetail(s),
      child: Container(
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
                Expanded(
                  child: Row(
                    children: [
                      Icon(
                        CupertinoIcons.helm,
                        color: AppColors.textSecondary,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              s['vessel'] ?? '',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              '${s['product']} • ${s['qty']}',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.textPrimary.withValues(
                      alpha: s['status'] == LocaleService.t('dyn_key_224')
                          ? 0.08
                          : 0.04,
                    ),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.separator, width: 0.5),
                  ),
                  child: Text(
                    s['status'] ?? '',
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(
                  CupertinoIcons.location,
                  color: AppColors.textSecondary,
                  size: 13,
                ),
                const SizedBox(width: 4),
                Text(
                  s['origin'] ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(
                    CupertinoIcons.arrow_right,
                    color: AppColors.separator,
                    size: 12,
                  ),
                ),
                Text(
                  s['dest'] ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const Spacer(),
                Text(
                  'ETA: ${s['eta']}',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Progress bar
            Container(
              height: 4,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.textPrimary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(2),
              ),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: progress.clamp(0.0, 1.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.textPrimary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetail(Map<String, dynamic> s) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.backgroundPrimary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(
            top: BorderSide(color: AppColors.separator, width: 0.5),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
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
            const SizedBox(height: 18),
            Text(
              s['vessel'] ?? '',
              style: GoogleFonts.newsreader(
                fontSize: 24,
                fontWeight: FontWeight.w400,
                color: AppColors.textPrimary,
              ),
            ),
            if (s['voyage_number'] != null &&
                s['voyage_number'].toString().isNotEmpty)
              Text(
                s['voyage_number'],
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                  letterSpacing: 1.5,
                ),
              ),
            const SizedBox(height: 20),
            _detailRow(LocaleService.t('dyn_key_221'), s['product'] ?? '-'),
            _detailRow(LocaleService.t('dyn_key_223'), s['qty'] ?? '-'),
            _detailRow(LocaleService.t('dyn_key_204'), s['origin'] ?? '-'),
            _detailRow(LocaleService.t('dyn_key_206'), s['dest'] ?? '-'),
            _detailRow(LocaleService.t('dyn_key_229'), s['status'] ?? '-'),
            _detailRow('ETA', s['eta'] ?? '-'),
            const SizedBox(height: 20),

            // Progress indicator
            Row(
              children: [
                Text(
                  LocaleService.t('tracking_progreso'),
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.5,
                  ),
                ),
                const Spacer(),
                Text(
                  '${((s['progress'] as num? ?? 0) * 100).round()}%',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              height: 6,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.textPrimary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(3),
              ),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: ((s['progress'] as num?)?.toDouble() ?? 0.0).clamp(
                  0.0,
                  1.0,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.textPrimary,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Update status button
            GestureDetector(
              onTap: () => _updateStatus(ctx, s),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: AppColors.textPrimary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    LocaleService.t('tracking_actualizar_estado'),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: AppColors.backgroundPrimary,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _updateStatus(BuildContext parentCtx, Map<String, dynamic> s) {
    Navigator.pop(parentCtx);
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(
          'Cambiar estado de ${s['vessel']}',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        actions: [
          CupertinoActionSheetAction(
            child: Text(
              LocaleService.t('tracking_en_puerto'),
              style: GoogleFonts.inter(),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _setStatus(s, 'planned');
            },
          ),
          CupertinoActionSheetAction(
            child: Text(
              LocaleService.t('tracking_cargando'),
              style: GoogleFonts.inter(),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _setStatus(s, 'loading');
            },
          ),
          CupertinoActionSheetAction(
            child: Text(
              LocaleService.t('tracking_en_transito'),
              style: GoogleFonts.inter(),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _setStatus(s, 'active');
            },
          ),
          CupertinoActionSheetAction(
            child: Text(
              LocaleService.t('tracking_completado'),
              style: GoogleFonts.inter(),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _setStatus(s, 'completed');
            },
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          isDestructiveAction: true,
          child: Text(
            LocaleService.t('tracking_cancelar'),
            style: GoogleFonts.inter(),
          ),
          onPressed: () => Navigator.pop(ctx),
        ),
      ),
    );
  }

  Future<void> _setStatus(Map<String, dynamic> s, String newStatus) async {
    try {
      if (s['id'] != null) {
        await Supabase.instance.client
            .from('voyages')
            .update({'status': newStatus})
            .eq('id', s['id']);
      }
      _fetchShipments();
    } catch (e) {
      debugPrint('Error updating status: $e');
    }
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
