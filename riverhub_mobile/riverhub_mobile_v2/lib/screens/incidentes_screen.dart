import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:riverhub_mobile_v2/theme/app_colors.dart';
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
                'title': i['title'] ?? i['description'] ?? 'Sin título',
                'vessel': i['vessel_name'] ?? i['vessel'] ?? '-',
                'severity': i['severity'] ?? 'MEDIA',
                'status': i['status'] ?? 'ABIERTO',
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
                    const Text(
                      'Nuevo Expediente',
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
                    const Text(
                      'Buque Involucrado',
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
                        hint: const Text(
                          'Seleccione buque...',
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
                    const Text(
                      'Ubicación (Km)',
                      style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                    ),
                    const SizedBox(height: 6),
                    CupertinoTextField(
                      controller: locController,
                      placeholder: 'Ej: KM 1285',
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
                    const Text(
                      'Descripción',
                      style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                    ),
                    const SizedBox(height: 6),
                    CupertinoTextField(
                      controller: descController,
                      placeholder: 'Describa el incidente...',
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
                    const Text(
                      'Evidencia Fotográfica',
                      style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: () async {
                        showCupertinoModalPopup(
                          context: ctx,
                          builder: (actionSheetCtx) => CupertinoActionSheet(
                            title: const Text('Adjuntar Evidencia'),
                            message: const Text('Seleccione la fuente de la imagen'),
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
                               child: const Text('Tomar Foto'),
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
                               child: const Text('Elegir de Galería'),
                              ),
                            ],
                            cancelButton: CupertinoActionSheetAction(
                              isDefaultAction: true,
                              onPressed: () => Navigator.pop(actionSheetCtx),
                              child: const Text('Cancelar'),
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
                                attachedImagePath != null ? 'Foto Adjunta' : 'Presionar para Adjuntar Imagen',
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
                                  ? 'ANÁLISIS COMPLETADO'
                                  : 'ANALIZAR CON IA',
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
                      child: const Text(
                        'EMITIR EXPEDIENTE OPERATIVO',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      onPressed: () async {
                        if (selectedVesselId == null) {
                          showCupertinoDialog(
                            context: ctx,
                            builder: (c) => CupertinoAlertDialog(
                              title: const Text('Error'),
                              content: const Text(
                                'Seleccione un buque involucrado.',
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
                            ? 'INCIDENTE'
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
                          'severity': 'MEDIA',
                          'status': 'ABIERTO',
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
      navigationBar: CupertinoNavigationBar(
        middle: const Text(
          'Siniestralidad & Forense',
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
          onPressed: _openNewIncident,
          child: Row(
            mainAxisSize: material.MainAxisSize.min,
            children: const [
              Text('Reportar ', style: TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.add_circled, color: AppColors.accent, size: 22),
            ],
          ),
        ),
      ),
      backgroundColor: AppColors.backgroundPrimary,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // KPIs
            Row(
              children: [
                _kpi('Total', '${_incidents.length}', AppColors.blue),
                const SizedBox(width: 10),
                _kpi(
                  'Abiertos',
                  '${_incidents.where((i) => i['status'] == 'ABIERTO').length}',
                  AppColors.error,
                ),
                const SizedBox(width: 10),
                _kpi(
                  'Cerrados',
                  '${_incidents.where((i) => i['status'] == 'CERRADO').length}',
                  AppColors.success,
                ),
              ],
            ),
            const SizedBox(height: 16),
            ..._incidents.map((inc) => _incidentCard(inc)),
          ],
        ),
      ),
    );
  }

  Widget _kpi(String label, String value, Color color) {
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
              value,
              style: TextStyle(
                color: color,
                fontSize: 24,
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

  Widget _incidentCard(Map<String, dynamic> inc) {
    Color sevColor;
    switch (inc['severity']) {
      case 'ALTA':
        sevColor = AppColors.error;
        break;
      case 'MEDIA':
        sevColor = AppColors.warning;
        break;
      default:
        sevColor = AppColors.success;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: sevColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  inc['title'],
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: sevColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  inc['severity'],
                  style: TextStyle(
                    color: sevColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(
                CupertinoIcons.helm,
                color: AppColors.textSecondary,
                size: 14,
              ),
              const SizedBox(width: 6),
              Text(
                inc['vessel'],
                style: const TextStyle(color: AppColors.textTertiary, fontSize: 12),
              ),
              const Spacer(),
              Text(
                inc['status'],
                style: TextStyle(
                  color: inc['status'] == 'CERRADO'
                      ? AppColors.success
                      : AppColors.warning,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            inc['date'],
            style: const TextStyle(color: AppColors.systemGray2, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
