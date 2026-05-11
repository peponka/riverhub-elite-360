import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class LoadMasterScreen extends StatefulWidget {
  const LoadMasterScreen({super.key});
  @override
  State<LoadMasterScreen> createState() => _LoadMasterScreenState();
}

class _LoadMasterScreenState extends State<LoadMasterScreen> {
  double hold1 = 0, hold2 = 0, hold3 = 0;
  double fuel = 50, ballast = 0;
  final double maxCapacity = 1500;

  double get totalLoad => hold1 + hold2 + hold3;
  double get trimValue => ((hold3 * 20) - (hold1 * 20)) / 1000;
  double get draftValue => 2.0 + (totalLoad + fuel * 0.8 + ballast) / 350;

  String get trimStatus {
    if (trimValue > 0.5) return 'BY STERN (${trimValue.toStringAsFixed(1)}°)';
    if (trimValue < -0.5) return 'BY BOW (${trimValue.abs().toStringAsFixed(1)}°)';
    return 'EVEN KEEL';
  }

  Color get trimColor {
    if (trimValue > 0.5) return AppColors.success;
    if (trimValue < -0.5) return AppColors.error;
    return AppColors.warning;
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: const Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text('Load Master', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Icon(CupertinoIcons.arrow_counterclockwise, color: AppColors.textSecondary, size: 20),
          onPressed: () => setState(() { hold1 = 0; hold2 = 0; hold3 = 0; fuel = 50; ballast = 0; }),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Distribución de', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('Carga & Estabilidad', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 6),
            Text('LOAD MASTER', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 20),

            // KPIs
            Row(children: [
              _kpi(LocaleService.t('dyn_key_166'), '${totalLoad.toStringAsFixed(0)} TN', CupertinoIcons.cube_box_fill, AppColors.accent),
              const SizedBox(width: 8),
              _kpi(LocaleService.t('dyn_key_168'), '${draftValue.toStringAsFixed(2)} ft', CupertinoIcons.arrow_down_to_line, const Color(0xFF06B6D4)),
              const SizedBox(width: 8),
              _kpi('TRIM', trimStatus.length > 10 ? trimStatus.substring(0, 10) : trimStatus, CupertinoIcons.arrow_left_right, trimColor),
            ]),
            const SizedBox(height: 20),

            // Barge visualizer
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.separator, width: 0.5),
              ),
              child: Column(children: [
                Text(LocaleService.t('dyn_key_165'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                const SizedBox(height: 16),
                Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                  _holdVisual('PROA', hold1, AppColors.error),
                  _holdVisual(LocaleService.t('dyn_key_167'), hold2, AppColors.accent),
                  _holdVisual(LocaleService.t('dyn_key_170'), hold3, AppColors.success),
                ]),
                const SizedBox(height: 16),
                Text(LocaleService.t('dyn_key_162'), style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
                const SizedBox(height: 8),
                Container(
                  height: 6,
                  decoration: BoxDecoration(color: AppColors.textPrimary.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(3)),
                  child: LayoutBuilder(builder: (ctx, constraints) {
                    double pct = 50 + (trimValue * 5);
                    pct = pct.clamp(10, 90);
                    final barColor = (pct < 40 || pct > 60) ? AppColors.error : AppColors.success;
                    return Stack(children: [
                      Positioned(
                        left: (pct / 100) * constraints.maxWidth - 8,
                        child: Container(width: 16, height: 6, decoration: BoxDecoration(color: barColor, borderRadius: BorderRadius.circular(3))),
                      ),
                    ]);
                  }),
                ),
              ]),
            ),
            const SizedBox(height: 20),

            // Sliders
            _sliderSection(LocaleService.t('dyn_key_169'), hold1, (v) => setState(() => hold1 = v), AppColors.error),
            _sliderSection(LocaleService.t('dyn_key_164'), hold2, (v) => setState(() => hold2 = v), AppColors.accent),
            _sliderSection(LocaleService.t('dyn_key_172'), hold3, (v) => setState(() => hold3 = v), AppColors.success),
            const SizedBox(height: 10),
            _sliderSection(LocaleService.t('dyn_key_171'), fuel, (v) => setState(() => fuel = v), AppColors.warning, max: 100),
            _sliderSection(LocaleService.t('dyn_key_163'), ballast, (v) => setState(() => ballast = v), const Color(0xFF8B5CF6), max: 100),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String val, IconData icon, Color color) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
          Icon(icon, size: 12, color: color.withValues(alpha: 0.5)),
        ]),
        const SizedBox(height: 6),
        Text(val, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
      ]),
    ));
  }

  Widget _holdVisual(String label, double value, Color color) {
    final pct = (value / maxCapacity).clamp(0.0, 1.0);
    return Column(children: [
      Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
      const SizedBox(height: 6),
      Container(
        width: 56, height: 100,
        decoration: BoxDecoration(
          border: Border.all(color: color.withValues(alpha: 0.3), width: 1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: 56, height: 100 * pct,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(7),
            ),
          ),
        ),
      ),
      const SizedBox(height: 4),
      Text('${value.toStringAsFixed(0)} TN', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
    ]);
  }

  Widget _sliderSection(String label, double value, ValueChanged<double> onChanged, Color color, {double max = 1500}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
            Text(
              max == 100 ? '${value.toStringAsFixed(0)}%' : '${value.toStringAsFixed(0)} TN',
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: color),
            ),
          ]),
          const SizedBox(height: 4),
          material.SliderTheme(
            data: material.SliderThemeData(
              activeTrackColor: color,
              inactiveTrackColor: color.withValues(alpha: 0.15),
              thumbColor: color,
              overlayColor: color.withValues(alpha: 0.1),
              trackHeight: 4,
            ),
            child: material.Slider(value: value, min: 0, max: max, onChanged: onChanged),
          ),
        ]),
      ),
    );
  }
}
