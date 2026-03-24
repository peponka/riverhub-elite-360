import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;

class ReportesScreen extends StatelessWidget {
  const ReportesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Reportes & Analytics',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF0A0E1A).withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: Color(0xFF00E5FF)),
          onPressed: () => Navigator.pop(context),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(
            CupertinoIcons.printer,
            color: Color(0xFF00E5FF),
            size: 20,
          ),
          onPressed: () {},
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // P&L Summary
            _sectionTitle('Estado de Resultados'),
            const SizedBox(height: 10),
            Row(
              children: [
                _metricCard(
                  'Ingresos',
                  '\$2.4M',
                  const Color(0xFF10B981),
                  CupertinoIcons.arrow_up_right,
                ),
                const SizedBox(width: 10),
                _metricCard(
                  'Gastos',
                  '\$1.8M',
                  const Color(0xFFEF4444),
                  CupertinoIcons.arrow_down_right,
                ),
                const SizedBox(width: 10),
                _metricCard(
                  'Margen',
                  '25%',
                  const Color(0xFF3B82F6),
                  CupertinoIcons.chart_bar_fill,
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Monthly bars
            _chartContainer('Ingresos vs Gastos (6 meses)', _buildBarChart()),
            const SizedBox(height: 16),
            // Fuel efficiency
            _sectionTitle('Eficiencia Combustible'),
            const SizedBox(height: 10),
            _chartContainer('Consumo Lt/Km por Embarcación', _buildFuelChart()),
            const SizedBox(height: 16),
            // Operational pie
            _sectionTitle('Estado Operacional'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _pieSlice('Navegando', '60%', const Color(0xFF10B981)),
                  _pieSlice('En Puerto', '25%', const Color(0xFFF59E0B)),
                  _pieSlice('Taller', '10%', const Color(0xFFEF4444)),
                  _pieSlice('Dique', '5%', const Color(0xFF64748B)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Quick report buttons
            _sectionTitle('Generar Reporte'),
            const SizedBox(height: 10),
            _reportButton(
              'Reporte Operacional Mensual',
              CupertinoIcons.doc_chart_fill,
              const Color(0xFF3B82F6),
            ),
            _reportButton(
              'Informe de Combustible',
              CupertinoIcons.drop_fill,
              const Color(0xFFF59E0B),
            ),
            _reportButton(
              'Estado de Flota PDF',
              CupertinoIcons.helm,
              const Color(0xFF10B981),
            ),
            _reportButton(
              'Balance Financiero',
              CupertinoIcons.money_dollar_circle_fill,
              const Color(0xFF8B5CF6),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: material.Colors.white,
        fontSize: 16,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _metricCard(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chartContainer(String title, Widget chart) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
          ),
          const SizedBox(height: 12),
          chart,
        ],
      ),
    );
  }

  Widget _buildBarChart() {
    final months = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
    final income = [350, 400, 380, 420, 390, 440];
    final expense = [280, 310, 300, 320, 295, 340];

    return SizedBox(
      height: 120,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(months.length, (i) {
          final incPct = income[i] / 500;
          final expPct = expense[i] / 500;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        width: 10,
                        height: 100 * incPct,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 2),
                      Container(
                        width: 10,
                        height: 100 * expPct,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    months[i],
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 9,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildFuelChart() {
    final vessels = ['TB-PY01', 'HERCULES', 'CENTAURO', 'SOJA K.', 'ENERGY'];
    final values = [4.2, 5.1, 6.3, 3.8, 4.5];

    return Column(
      children: List.generate(vessels.length, (i) {
        final pct = values[i] / 8;
        final color = values[i] > 5.5
            ? const Color(0xFFEF4444)
            : values[i] > 4.5
            ? const Color(0xFFF59E0B)
            : const Color(0xFF10B981);
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              SizedBox(
                width: 70,
                child: Text(
                  vessels[i],
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 11,
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  height: 14,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: pct,
                    child: Container(
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(7),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${values[i]}',
                style: TextStyle(
                  color: color,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _pieSlice(String label, String pct, Color color) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 2),
          ),
          child: Center(
            child: Text(
              pct,
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
        ),
      ],
    );
  }

  Widget _reportButton(String title, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(color: material.Colors.white, fontSize: 14),
            ),
          ),
          const Icon(
            CupertinoIcons.arrow_right,
            color: Color(0xFF64748B),
            size: 16,
          ),
        ],
      ),
    );
  }
}
