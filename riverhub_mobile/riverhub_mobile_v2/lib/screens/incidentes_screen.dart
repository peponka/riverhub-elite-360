import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';
class IncidentesScreen extends StatefulWidget {
  const IncidentesScreen({super.key});

  @override
  State<IncidentesScreen> createState() => _IncidentesScreenState();
}

class _IncidentesScreenState extends State<IncidentesScreen> {
  List<Map<String, dynamic>> _incidents = [];
  List<Map<String, dynamic>> _vesselsData = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    _loadIncidents();
    final v = await SupabaseService.getVessels();
    if (mounted) setState(() => _vesselsData = v);
  }

  Future<void> _loadIncidents() async {
    final data = await SupabaseService.getIncidents();
    setState(() {
      if (data.isNotEmpty) {
        _incidents = data
            .map(
              (i) => {
                'title': i['title'] ?? i['description'] ?? LocaleService.t('dyn_key_139'),
                'vessel': i['vessel_name'] ?? i['vessel'] ?? '-',
                'severity': i['severity'] ?? LocaleService.t('dyn_key_140'),
                'status': i['status'] ?? LocaleService.t('dyn_key_129'),
                'date': i['created_at']?.toString().substring(0, 10) ?? '-',
              },
            )
            .toList();
      } else {
        _incidents = [];
      }
    });
  }

  void _openNewIncident() {
    String? selectedVesselId;
    final locController = TextEditingController();
    final descController = TextEditingController();
    bool aiAnalyzed = false;
    String? attachedImagePath;
    final ImagePicker picker = ImagePicker();

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: AppColors.backgroundSecondary,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: AppColors.separator)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      LocaleService.t('dyn_key_121'),
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      child: const Icon(
                        CupertinoIcons.xmark_circle_fill,
                        color: AppColors.textSecondary,
                      ),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(
                      LocaleService.t('dyn_key_132'),
                      style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppColors.separator,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: material.DropdownButton<String>(
                        value: selectedVesselId,
                        hint: Text(
                          LocaleService.t('dyn_key_124'),
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                        dropdownColor: AppColors.separator,
                        isExpanded: true,
                        underline: const SizedBox(),
                        style: const TextStyle(color: AppColors.textPrimary),
                        items: _vesselsData
                            .map(
                              (v) => material.DropdownMenuItem(
                                value: v['id'] as String,
                                child: Text(v['name'] ?? '-'),
                              ),
                            )
                            .toList(),
                        onChanged: (val) =>
                            setModalState(() => selectedVesselId = val),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      LocaleService.t('dyn_key_127'),
                      style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                    ),
                    const SizedBox(height: 6),
                    CupertinoTextField(
                      controller: locController,
                      placeholder: LocaleService.t('incidentes_ej_km_1285'),
                      style: const TextStyle(color: AppColors.textPrimary),
                      placeholderStyle: const TextStyle(
                        color: AppColors.textSecondary,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.separator,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.all(12),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      LocaleService.t('dyn_key_131'),
                      style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                    ),
                    const SizedBox(height: 6),
                    CupertinoTextField(
                      controller: descController,
                      placeholder: LocaleService.t('incidentes_describa_el_incident'),
                      maxLines: 4,
                      style: const TextStyle(color: AppColors.textPrimary),
                      placeholderStyle: const TextStyle(
                        color: AppColors.textSecondary,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.separator,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.all(12),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      LocaleService.t('dyn_key_135'),
                      style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: () async {
                        showCupertinoModalPopup(
                          context: ctx,
                          builder: (actionSheetCtx) => CupertinoActionSheet(
                            title: Text(LocaleService.t('incidentes_adjuntar_evidencia')),
                            message: Text(LocaleService.t('incidentes_seleccione_la_fuente')),
                            actions: [
                              CupertinoActionSheetAction(
                               onPressed: () async {
                                 Navigator.pop(actionSheetCtx);
                                 try {
                                   final XFile? image = await picker.pickImage(
                                     source: ImageSource.camera, 
                                     imageQuality: 70
                                   );
                                   if (image != null) {
                                     setModalState(() {
                                       attachedImagePath = image.path;
                                     });
                                   }
                                 } catch (e) {
                                   debugPrint("Error tomando foto: $e");
                                 }
                               },
                               child: Text(LocaleService.t('incidentes_tomar_foto')),
                              ),
                              CupertinoActionSheetAction(
                               onPressed: () async {
                                 Navigator.pop(actionSheetCtx);
                                 try {
                                   final XFile? image = await picker.pickImage(
                                     source: ImageSource.gallery, 
                                     imageQuality: 70
                                   );
                                   if (image != null) {
                                     setModalState(() {
                                       attachedImagePath = image.path;
                                     });
                                   }
                                 } catch (e) {
                                   debugPrint("Error seleccionando foto: $e");
                                 }
                               },
                               child: Text(LocaleService.t('incidentes_elegir_de_galeria')),
                              ),
                            ],
                            cancelButton: CupertinoActionSheetAction(
                              isDefaultAction: true,
                              onPressed: () => Navigator.pop(actionSheetCtx),
                              child: Text(LocaleService.t('incidentes_cancelar')),
                            ),
                          ),
                        );
                      },
                      child: Container(
                        height: 100,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppColors.separator,
                          borderRadius: BorderRadius.circular(10),
                          image: attachedImagePath != null
                              ? DecorationImage(
                                  image: FileImage(File(attachedImagePath!)),
                                  fit: BoxFit.cover,
                                  colorFilter: ColorFilter.mode(
                                    AppColors.textPrimary.withValues(alpha: 0.3),
                                    BlendMode.darken,
                                  ),
                                )
                              : null,
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                  attachedImagePath != null ? CupertinoIcons.checkmark_alt_circle : CupertinoIcons.camera_fill,
                                  color: attachedImagePath != null ? AppColors.success : AppColors.textSecondary,
                                  size: 32,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                attachedImagePath != null ? LocaleService.t('dyn_key_123') : LocaleService.t('dyn_key_126'),
                                style: TextStyle(
                                  color: attachedImagePath != null ? AppColors.textOnAccent : AppColors.textSecondary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // IA Button
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      onPressed: () {
                        setModalState(() => aiAnalyzed = false);
                        Future.delayed(const Duration(seconds: 2), () {
                          setModalState(() {
                            aiAnalyzed = true;
                            descController.text =
                                '[IA AUTO-FILL] Correlación detectada: Caída brusca de RPM en motor estribor (14:32 hrs) coincidente con alerta de impacto en casco.';
                          });
                        });
                      },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: aiAnalyzed
                              ? AppColors.success.withValues(alpha: 0.2)
                              : AppColors.separator,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: aiAnalyzed
                                ? AppColors.success
                                : AppColors.accent,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              aiAnalyzed
                                  ? CupertinoIcons.checkmark_alt_circle_fill
                                  : CupertinoIcons.bolt_fill,
                              color: aiAnalyzed
                                  ? AppColors.success
                                  : AppColors.accent,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              aiAnalyzed
                                  ? LocaleService.t('dyn_key_125')
                                  : LocaleService.t('dyn_key_130'),
                              style: TextStyle(
                                color: aiAnalyzed
                                    ? AppColors.success
                                    : AppColors.accent,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    CupertinoButton.filled(
                      child: Text(
                        LocaleService.t('dyn_key_138'),
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      onPressed: () async {
                        if (selectedVesselId == null) {
                          showCupertinoDialog(
                            context: ctx,
                            builder: (c) => CupertinoAlertDialog(
                              title: Text(LocaleService.t('incidentes_error')),
                              content: Text(
                                LocaleService.t('dyn_key_128'),
                              ),
                              actions: [
                                CupertinoDialogAction(
                                  child: const Text('OK'),
                                  onPressed: () => Navigator.pop(c),
                                ),
                              ],
                            ),
                          );
                          return;
                        }

                        // We can show a loading indicator here in a real app, but for now we just wait
                        String title = locController.text.isEmpty
                            ? LocaleService.t('dyn_key_137')
                            : 'INCIDENTE - ${locController.text}';
                        
                        String? uploadedImageUrl;

                        if (attachedImagePath != null) {
                          try {
                            final bytes = await File(attachedImagePath!).readAsBytes();
                            final fileExt = attachedImagePath!.split('.').last;
                            final fileName = '${DateTime.now().millisecondsSinceEpoch}.$fileExt';
                            
                            await SupabaseService.client.storage
                                .from('documents')
                                .uploadBinary('incidents/$fileName', bytes);
                                
                            uploadedImageUrl = SupabaseService.client.storage
                                .from('documents')
                                .getPublicUrl('incidents/$fileName');
                          } catch (e) {
                            debugPrint('Error uploading incident image: $e');
                          }
                        }

                        final payload = {
                          'title': title,
                          'description': descController.text,
                          'vessel_id': selectedVesselId,
                          'severity': LocaleService.t('dyn_key_140'),
                          'status': LocaleService.t('dyn_key_129'),
                          'reported_by': SupabaseService.currentUserId,
                          'location': locController.text,
                        };

                        if (uploadedImageUrl != null) {
                           payload['photo_url'] = uploadedImageUrl;
                        }

                        try {
                           await SupabaseService.insertIncident(payload);
                        } catch(e) {
                           debugPrint('Insert error: $e');
                        }

                        if (context.mounted) Navigator.pop(ctx);
                        _loadIncidents();
                      },
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
        middle: Text('Incidentes', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(padding: EdgeInsets.zero, onPressed: _openNewIncident, child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Text('Siniestralidad', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
            Text('& Forense', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
            const SizedBox(height: 6),
            Text('${_incidents.length} REGISTROS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
            const SizedBox(height: 20),
            // KPIs
            Row(children: [
              _kpi(LocaleService.t('dyn_key_133'), '${_incidents.length}', AppColors.accent),
              const SizedBox(width: 8),
              _kpi(LocaleService.t('dyn_key_120'), '${_incidents.where((i) => i['status'] == LocaleService.t('dyn_key_129')).length}', AppColors.error),
              const SizedBox(width: 8),
              _kpi(LocaleService.t('dyn_key_122'), '${_incidents.where((i) => i['status'] == LocaleService.t('dyn_key_136')).length}', AppColors.success),
            ]),
            const SizedBox(height: 20),
            if (_incidents.isEmpty)
              Center(child: Padding(padding: const EdgeInsets.all(30), child: Column(children: [
                Icon(CupertinoIcons.shield, size: 40, color: AppColors.textTertiary),
                const SizedBox(height: 12),
                Text('Sin incidentes', style: GoogleFonts.newsreader(fontSize: 18, color: AppColors.textSecondary)),
              ])))
            else
              ..._incidents.map((inc) => _incidentCard(inc)),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String value, Color color) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5)),
          Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        ]),
        const SizedBox(height: 8),
        Text(value, style: GoogleFonts.newsreader(fontSize: 24, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1)),
      ]),
    ));
  }

  Widget _incidentCard(Map<String, dynamic> inc) {
    Color sevColor;
    switch (inc['severity']) {
      case 'ALTA': sevColor = AppColors.error; break;
      case 'MEDIA': sevColor = AppColors.warning; break;
      default: sevColor = AppColors.success;
    }
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Text(inc['title'], style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: sevColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
            child: Text(inc['severity'], style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: sevColor, letterSpacing: 0.5)),
          ),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          Icon(CupertinoIcons.helm, color: AppColors.textSecondary, size: 14),
          const SizedBox(width: 6),
          Text(inc['vessel'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
          const Spacer(),
          Text(inc['status'], style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: inc['status'] == LocaleService.t('dyn_key_136') ? AppColors.success : AppColors.warning)),
        ]),
        const SizedBox(height: 4),
        Text(inc['date'], style: GoogleFonts.inter(fontSize: 10, color: AppColors.textTertiary)),
      ]),
    );
  }
}
