import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

class DocsScreen extends StatelessWidget {
  DocsScreen({super.key});

  final List<Map<String, dynamic>> _docs = [
    {'name': 'Manifiesto TUG-ALPHA', 'type': 'PDF', 'size': '2.4 MB', 'date': '08/03/2026', 'icon': CupertinoIcons.doc_fill},
    {'name': 'Certificado Navegabilidad', 'type': 'PDF', 'size': '1.1 MB', 'date': '05/03/2026', 'icon': CupertinoIcons.doc_text_fill},
    {'name': 'Póliza Seguro Fluvial', 'type': 'PDF', 'size': '3.8 MB', 'date': '01/03/2026', 'icon': CupertinoIcons.shield_fill},
    {'name': 'Planos BARGE-04', 'type': 'DWG', 'size': '12.5 MB', 'date': '28/02/2026', 'icon': CupertinoIcons.map_fill},
    {'name': 'Contrato Cargill', 'type': 'DOCX', 'size': '845 KB', 'date': '25/02/2026', 'icon': CupertinoIcons.doc_on_clipboard_fill},
    {'name': 'Informe Mensual Feb', 'type': 'XLSX', 'size': '1.6 MB', 'date': '01/03/2026', 'icon': CupertinoIcons.chart_bar_square_fill},
  ];

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
        middle: Text(LocaleService.t('dyn_key_107'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () {},
          child: Icon(CupertinoIcons.cloud_upload, color: AppColors.textPrimary, size: 22),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text(LocaleService.t('docs_documentos'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text(LocaleService.t('docs_operativos'), style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 6),
            Text('${_docs.length} ARCHIVOS · 22.2 MB', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 20),

            // KPIs
            Row(children: [
              _kpi('${_docs.length}', LocaleService.t('dyn_key_106'), CupertinoIcons.doc_fill),
              const SizedBox(width: 10),
              _kpi('22.2', 'MB TOTAL', CupertinoIcons.tray_full_fill),
            ]),
            const SizedBox(height: 24),

            // Docs list
            ..._docs.map((d) => _docCard(d)),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String val, String label, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
            Icon(icon, size: 14, color: AppColors.accent.withValues(alpha: 0.5)),
          ]),
          const SizedBox(height: 8),
          Text(val, style: GoogleFonts.newsreader(fontSize: 28, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1)),
        ]),
      ),
    );
  }

  Widget _docCard(Map<String, dynamic> d) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.accent.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(d['icon'] as IconData, color: AppColors.accent, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(d['name'], style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
              child: Text(d['type'], style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.accent)),
            ),
            const SizedBox(width: 8),
            Text('${d['size']} · ${d['date']}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
          ]),
        ])),
        Icon(CupertinoIcons.cloud_download, color: AppColors.textSecondary, size: 18),
      ]),
    );
  }
}
