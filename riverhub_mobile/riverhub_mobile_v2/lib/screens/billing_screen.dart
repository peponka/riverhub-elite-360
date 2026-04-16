import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class BillingScreen extends StatelessWidget {
  const BillingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Facturación',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.backgroundPrimary.withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: AppColors.accent),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: AppColors.backgroundPrimary,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Current plan
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.gradientStart, AppColors.backgroundSecondary],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.accent.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Plan Actual',
                        style: TextStyle(
                          color: AppColors.textTertiary,
                          fontSize: 12,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'ACTIVO',
                          style: TextStyle(
                            color: AppColors.success,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Enterprise Fleet',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '\$2,499/mes',
                    style: TextStyle(
                      color: AppColors.accent,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: const [
                      Icon(
                        CupertinoIcons.checkmark_circle_fill,
                        color: AppColors.success,
                        size: 16,
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Flota ilimitada',
                        style: TextStyle(
                          color: AppColors.textTertiary,
                          fontSize: 12,
                        ),
                      ),
                      SizedBox(width: 16),
                      Icon(
                        CupertinoIcons.checkmark_circle_fill,
                        color: AppColors.success,
                        size: 16,
                      ),
                      SizedBox(width: 6),
                      Text(
                        'IA incluida',
                        style: TextStyle(
                          color: AppColors.textTertiary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Historial de Pagos',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _paymentRow(
              'Marzo 2026',
              '\$2,499',
              'Pagado',
              AppColors.success,
            ),
            _paymentRow(
              'Febrero 2026',
              '\$2,499',
              'Pagado',
              AppColors.success,
            ),
            _paymentRow(
              'Enero 2026',
              '\$2,499',
              'Pagado',
              AppColors.success,
            ),
            _paymentRow(
              'Diciembre 2025',
              '\$1,999',
              'Pagado',
              AppColors.success,
            ),
            const SizedBox(height: 20),
            const Text(
              'Uso del Mes',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _usageRow('Embarcaciones rastreadas', '14 / ∞'),
            _usageRow('Consultas IA (NexoBot)', '245 / 1000'),
            _usageRow('Almacenamiento docs', '22 MB / 50 GB'),
            _usageRow('Usuarios activos', '8 / 25'),
          ],
        ),
      ),
    );
  }

  Widget _paymentRow(String month, String amount, String status, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.separator),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              month,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            ),
          ),
          Text(
            amount,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              status,
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _usageRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: AppColors.textTertiary, fontSize: 13),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.accent,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
