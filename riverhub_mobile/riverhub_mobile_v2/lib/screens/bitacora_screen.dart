import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_colors.dart';
import '../main.dart';

class BitacoraScreen extends StatefulWidget {
  const BitacoraScreen({super.key});

  @override
  State<BitacoraScreen> createState() => _BitacoraScreenState();
}

class _BitacoraScreenState extends State<BitacoraScreen> {
  List<dynamic> _logs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    try {
      final response = await Supabase.instance.client
          .from('logs')
          .select('*')
          .order('created_at', ascending: false)
          .limit(20);
      if (mounted) setState(() { _logs = response; _isLoading = false; });
    } catch (e) {
      debugPrint('Error fetching logs: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _addLogEntry() async {
    final textController = TextEditingController();
    File? selectedImage;
    bool isUploading = false;

    await showCupertinoModalPopup(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            color: AppColors.backgroundSecondary,
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    decoration: BoxDecoration(
                      border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        CupertinoButton(
                          padding: EdgeInsets.zero,
                          child: Text('Cancelar', style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 14)),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Text('Nueva Novedad', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary)),
                        isUploading
                            ? const CupertinoActivityIndicator()
                            : CupertinoButton(
                                padding: EdgeInsets.zero,
                                child: Text('Guardar', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
                                onPressed: () async {
                                  if (textController.text.isEmpty) return;
                                  setModalState(() => isUploading = true);
                                  try {
                                    final text = textController.text;
                                    String actionType = 'info';
                                    if (text.toLowerCase().contains('alerta')) actionType = 'alert';
                                    if (text.toLowerCase().contains('listo')) actionType = 'success';
                                    String? imageUrl;
                                    if (selectedImage != null) {
                                      try {
                                        final bytes = await selectedImage!.readAsBytes();
                                        final fileExt = selectedImage!.path.split('.').last;
                                        final fileName = '${DateTime.now().millisecondsSinceEpoch}.$fileExt';
                                        await Supabase.instance.client.storage.from('documents').uploadBinary('logs/$fileName', bytes);
                                        imageUrl = Supabase.instance.client.storage.from('documents').getPublicUrl('logs/$fileName');
                                      } catch (e) { debugPrint('Upload error: $e'); }
                                    }
                                    final payload = {
                                      'description': text, 'action_type': actionType,
                                      'user_id': Supabase.instance.client.auth.currentUser?.id,
                                    };
                                    if (imageUrl != null) payload['image_url'] = imageUrl;
                                    await Supabase.instance.client.from('logs').insert(payload);
                                    if (context.mounted) Navigator.pop(context);
                                    _fetchLogs();
                                  } catch (e) {
                                    debugPrint('Error saving log: $e');
                                    if (e.toString().contains('image_url')) {
                                      try {
                                        await Supabase.instance.client.from('logs').insert({
                                          'description': textController.text, 'action_type': 'info',
                                          'user_id': Supabase.instance.client.auth.currentUser?.id,
                                        });
                                        if (context.mounted) Navigator.pop(context);
                                        _fetchLogs();
                                      } catch (_) {}
                                    }
                                  } finally {
                                    if (mounted) setModalState(() => isUploading = false);
                                  }
                                },
                              ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        CupertinoTextField(
                          controller: textController,
                          placeholder: 'Escriba el suceso aquí...',
                          minLines: 3, maxLines: 5,
                          padding: const EdgeInsets.all(14),
                          placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
                          style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLow,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.separator, width: 0.5),
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (selectedImage != null)
                          Stack(
                            alignment: Alignment.topRight,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.file(selectedImage!, height: 150, width: double.infinity, fit: BoxFit.cover),
                              ),
                              CupertinoButton(
                                padding: EdgeInsets.zero,
                                onPressed: () => setModalState(() => selectedImage = null),
                                child: Container(
                                  margin: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(color: AppColors.textPrimary, shape: BoxShape.circle),
                                  child: const Icon(CupertinoIcons.clear_circled_solid, color: AppColors.textOnAccent),
                                ),
                              ),
                            ],
                          )
                        else
                          Row(
                            children: [
                              Expanded(
                                child: CupertinoButton(
                                  color: AppColors.textPrimary,
                                  borderRadius: BorderRadius.circular(10),
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  onPressed: () async {
                                    final image = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 70);
                                    if (image != null) setModalState(() => selectedImage = File(image.path));
                                  },
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(CupertinoIcons.camera_fill, color: AppColors.textOnAccent, size: 16),
                                      const SizedBox(width: 6),
                                      Text('Cámara', style: GoogleFonts.inter(color: AppColors.textOnAccent, fontSize: 13, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: CupertinoButton(
                                  color: AppColors.surfaceContainerLow,
                                  borderRadius: BorderRadius.circular(10),
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  onPressed: () async {
                                    final image = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 70);
                                    if (image != null) setModalState(() => selectedImage = File(image.path));
                                  },
                                  child: Text('Galería', style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary),
          onPressed: () => rootScaffoldKey.currentState?.openDrawer(),
        ),
        middle: Text('Bitácora', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _addLogEntry,
          child: Icon(CupertinoIcons.plus, size: 22, color: AppColors.textPrimary),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 14))
            : _logs.isEmpty
            ? Center(child: Text('Sin registros recientes', style: GoogleFonts.inter(color: AppColors.textSecondary)))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  Text('Bitácora', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('Digital.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 6),
                  Text('ÚLTIMAS ${_logs.length} NOVEDADES', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),
                  const SizedBox(height: 24),
                  ...List.generate(_logs.length, (i) {
                    final log = _logs[i];
                    final date = DateTime.tryParse(log['created_at'] ?? '') ?? DateTime.now();
                    final timeStr = '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
                    final author = log['user_id'] != null ? 'Tripulante' : 'Sistema';
                    Color dotColor = AppColors.accent;
                    if (log['action_type'] == 'alert') dotColor = AppColors.warning;
                    if (log['action_type'] == 'success') dotColor = AppColors.success;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundSecondary,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.separator, width: 0.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(width: 8, height: 8, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
                                const SizedBox(width: 10),
                                Text(
                                  (log['action_type'] ?? 'INFO').toString().toUpperCase(),
                                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5),
                                ),
                                const Spacer(),
                                Text('$author · $timeStr', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              log['description'] ?? '',
                              style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: AppColors.textPrimary),
                            ),
                            if (log['image_url'] != null && (log['image_url'] as String).isNotEmpty) ...[
                              const SizedBox(height: 12),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(
                                  log['image_url'],
                                  height: 180, width: double.infinity, fit: BoxFit.cover,
                                  errorBuilder: (c, e, s) => Container(
                                    height: 100, color: AppColors.surfaceContainerLow,
                                    child: const Center(child: Icon(CupertinoIcons.photo, color: AppColors.textSecondary)),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
      ),
    );
  }
}
