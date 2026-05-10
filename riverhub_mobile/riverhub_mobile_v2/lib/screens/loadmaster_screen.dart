import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
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
    if (trimValue < -0.5) {
      return 'BY BOW (${trimValue.abs().toStringAsFixed(1)}°)';
    }
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
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Load Master',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.backgroundPrimary.withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: AppColors.accent),
          onPressed: () => Navigator.pop(context),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(LocaleService.t('loadmaster_calcular'), style: TextStyle(color: AppColors.accent, fontSize: 13, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.refresh, color: AppColors.accent, size: 20),
            ],
          ),
          onPressed: () => setState(() {
            hold1 = 0;
            hold2 = 0;
            hold3 = 0;
            fuel = 50;
            ballast = 0;
          }),
        ),
      ),
      backgroundColor: AppColors.backgroundPrimary,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Main KPIs
            Row(
              children: [
                _kpiBox(
                  LocaleService.t('dyn_key_166'),
                  '${totalLoad.toStringAsFixed(0)} TN',
                  AppColors.blue,
                ),
                const SizedBox(width: 10),
                _kpiBox(
                  LocaleService.t('dyn_key_168'),
                  '${draftValue.toStringAsFixed(2)} PIES',
                  AppColors.accent,
                ),
                const SizedBox(width: 10),
                _kpiBox('TRIM', trimStatus, trimColor),
              ],
            ),
            const SizedBox(height: 20),
            // Barge visualizer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.separator),
              ),
              child: Column(
                children: [
                  Text(
                    LocaleService.t('dyn_key_165'),
                    style: TextStyle(
                      color: AppColors.textTertiary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _holdVisual('PROA', hold1, AppColors.error),
                      _holdVisual(LocaleService.t('dyn_key_167'), hold2, AppColors.blue),
                      _holdVisual(LocaleService.t('dyn_key_170'), hold3, AppColors.success),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Stability bar
                  Text(
                    LocaleService.t('dyn_key_162'),
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 10),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppColors.separator,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: LayoutBuilder(
                      builder: (ctx, constraints) {
                        double pct = 50 + (trimValue * 5);
                        pct = pct.clamp(10, 90);
                        final barColor = (pct < 40 || pct > 60)
                            ? AppColors.error
                            : AppColors.success;
                        return Stack(
                          children: [
                            Positioned(
                              left: (pct / 100) * constraints.maxWidth - 6,
                              child: Container(
                                width: 12,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: barColor,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Sliders
            _sliderSection(
              LocaleService.t('dyn_key_169'),
              hold1,
              (v) => setState(() => hold1 = v),
              AppColors.error,
            ),
            _sliderSection(
              LocaleService.t('dyn_key_164'),
              hold2,
              (v) => setState(() => hold2 = v),
              AppColors.blue,
            ),
            _sliderSection(
              LocaleService.t('dyn_key_172'),
              hold3,
              (v) => setState(() => hold3 = v),
              AppColors.success,
            ),
            const SizedBox(height: 10),
            _sliderSection(
              LocaleService.t('dyn_key_171'),
              fuel,
              (v) => setState(() => fuel = v),
              AppColors.warning,
              max: 100,
            ),
            _sliderSection(
              LocaleService.t('dyn_key_163'),
              ballast,
              (v) => setState(() => ballast = v),
              AppColors.purple,
              max: 100,
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpiBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: AppColors.textTertiary, fontSize: 9),
            ),
          ],
        ),
      ),
    );
  }

  Widget _holdVisual(String label, double value, Color color) {
    final pct = (value / maxCapacity).clamp(0.0, 1.0);
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.textTertiary, fontSize: 10),
        ),
        const SizedBox(height: 6),
        Container(
          width: 50,
          height: 100,
          decoration: BoxDecoration(
            border: Border.all(color: color.withValues(alpha: 0.5)),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Align(
            alignment: Alignment.bottomCenter,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 50,
              height: 100 * pct,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(5),
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${value.toStringAsFixed(0)} TN',
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _sliderSection(
    String label,
    double value,
    ValueChanged<double> onChanged,
    Color color, {
    double max = 1500,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(color: AppColors.textTertiary, fontSize: 13),
              ),
              Text(
                max == 100
                    ? '${value.toStringAsFixed(0)}%'
                    : '${value.toStringAsFixed(0)} TN',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          material.Slider(
            value: value,
            min: 0,
            max: max,
            activeColor: color,
            inactiveColor: color.withValues(alpha: 0.2),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
