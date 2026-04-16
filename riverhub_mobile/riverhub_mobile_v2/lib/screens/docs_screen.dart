import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:riverhub_mobile_v2/theme/app_colors.dart';

class DocsScreen extends StatelessWidget {
  const DocsScreen({super.key});

  final List<Map<String, dynamic>> _docs = const [
    {
      'name': 'Manifiesto TUG-ALPHA',
      'type': 'PDF',
      'size': '2.4 MB',
      'date': '08/03/2026',
      'icon': CupertinoIcons.doc_fill,
    },
    {
      'name': 'Certificado Navegación',
      'type': 'PDF',
      'size': '1.1 MB',
      'date': '05/03/2026',
      'icon': CupertinoIcons.doc_text_fill,
    },
    {
      'name': 'Póliza Seguro Flota',
      'type': 'PDF',
      'size': '3.8 MB',
      'date': '01/03/2026',
      'icon': CupertinoIcons.shield_fill,
    },
    {
      'name': 'Planos BARGE-04',
      'type': 'DWG',
      'size': '12.5 MB',
      'date': '28/02/2026',
      'icon': CupertinoIcons.map_fill,
    },
    {
      'name': 'Contrato Cargill',
      'type': 'DOCX',
      'size': '845 KB',
      'date': '25/02/2026',
      'icon': CupertinoIcons.doc_on_clipboard_fill,
    },
    {
      'name': 'Informe Mensual Feb',
      'type': 'XLSX',
      'size': '1.6 MB',
      'date': '01/03/2026',
      'icon': CupertinoIcons.chart_bar_square_fill,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Documentación',
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
          onPressed: () {},
          child: Row(
            mainAxisSize: material.MainAxisSize.min,
            children: const [
              Text('Subir ', style: TextStyle(color: AppColors.accent, fontSize: 13, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.cloud_upload, color: AppColors.accent, size: 22),
            ],
          ),
        ),
      ),
      backgroundColor: AppColors.backgroundPrimary,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                _kpi('Documentos', '${_docs.length}', AppColors.blue),
                const SizedBox(width: 10),
                _kpi('Espacio', '22.2 MB', AppColors.purple),
              ],
            ),
            const SizedBox(height: 16),
            ..._docs.map((d) => _docCard(d)),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String val, Color color) {
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
            Text(
              val,
              style: TextStyle(
                color: color,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: AppColors.textTertiary, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _docCard(Map<String, dynamic> d) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.separator),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.blue.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              d['icon'] as IconData,
              color: AppColors.blue,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  d['name'],
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      d['type'],
                      style: const TextStyle(
                        color: AppColors.accent,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      ' • ',
                      style: TextStyle(color: AppColors.systemGray2),
                    ),
                    Text(
                      d['size'],
                      style: const TextStyle(
                        color: AppColors.textTertiary,
                        fontSize: 11,
                      ),
                    ),
                    const Text(
                      ' • ',
                      style: TextStyle(color: AppColors.systemGray2),
                    ),
                    Text(
                      d['date'],
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(
            CupertinoIcons.cloud_download,
            color: AppColors.textSecondary,
            size: 20,
          ),
        ],
      ),
    );
  }
}
