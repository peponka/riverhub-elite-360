import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;

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
        backgroundColor: const Color(0xFF0A0E1A).withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: Color(0xFF00E5FF)),
          onPressed: () => Navigator.pop(context),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () {},
          child: Row(
            mainAxisSize: material.MainAxisSize.min,
            children: const [
              Text('Subir ', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 13, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.cloud_upload, color: Color(0xFF00E5FF), size: 22),
            ],
          ),
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                _kpi('Documentos', '${_docs.length}', const Color(0xFF3B82F6)),
                const SizedBox(width: 10),
                _kpi('Espacio', '22.2 MB', const Color(0xFF8B5CF6)),
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
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
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
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              d['icon'] as IconData,
              color: const Color(0xFF3B82F6),
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
                    color: material.Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      d['type'],
                      style: const TextStyle(
                        color: Color(0xFF00E5FF),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      ' • ',
                      style: TextStyle(color: Color(0xFF475569)),
                    ),
                    Text(
                      d['size'],
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                      ),
                    ),
                    const Text(
                      ' • ',
                      style: TextStyle(color: Color(0xFF475569)),
                    ),
                    Text(
                      d['date'],
                      style: const TextStyle(
                        color: Color(0xFF64748B),
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
            color: Color(0xFF64748B),
            size: 20,
          ),
        ],
      ),
    );
  }
}
