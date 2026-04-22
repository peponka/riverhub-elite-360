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
  String? _activeFilter; // Active hashtag filter
  final List<String> _suggestedTags = [
    '#mantenimiento', '#urgente', '#convoy', '#combustible',
    '#tripulacion', '#clima', '#maniobra', '#carga', '#incidente', '#operativo',
  ];

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  // Extract hashtags from text
  List<String> _extractTags(String text) {
    final regex = RegExp(r'#\w+', caseSensitive: false);
    return regex.allMatches(text).map((m) => m.group(0)!.toLowerCase()).toSet().toList();
  }

  // Get all unique tags from logs
  List<String> _getAllTags() {
    final tags = <String>{};
    for (var log in _logs) {
      final desc = (log['description'] ?? '').toString();
      tags.addAll(_extractTags(desc));
    }
    return tags.toList()..sort();
  }

  // Get filtered logs
  List<dynamic> get _filteredLogs {
    if (_activeFilter == null) return _logs;
    return _logs.where((log) {
      final desc = (log['description'] ?? '').toString().toLowerCase();
      return desc.contains(_activeFilter!);
    }).toList();
  }

  Future<void> _fetchLogs() async {
    try {
      final response = await Supabase.instance.client
          .from('logs')
          .select('*')
          .order('created_at', ascending: false)
          .limit(30);
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
                                    if (text.toLowerCase().contains('alerta') || text.contains('#urgente')) actionType = 'alert';
                                    if (text.toLowerCase().contains('listo') || text.contains('#operativo')) actionType = 'success';
                                    if (text.contains('#incidente')) actionType = 'alert';
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
                          placeholder: 'Escriba el suceso aquí... Use #hashtags',
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
                        const SizedBox(height: 10),
                        // Suggested hashtags
                        SizedBox(
                          height: 30,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: _suggestedTags.map((tag) => Padding(
                              padding: const EdgeInsets.only(right: 6),
                              child: GestureDetector(
                                onTap: () {
                                  final cur = textController.text;
                                  textController.text = '$cur $tag';
                                  textController.selection = TextSelection.fromPosition(TextPosition(offset: textController.text.length));
                                  setModalState(() {});
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: _getTagColor(tag).withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: _getTagColor(tag).withValues(alpha: 0.3), width: 0.5),
                                  ),
                                  child: Text(tag, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: _getTagColor(tag))),
                                ),
                              ),
                            )).toList(),
                          ),
                        ),
                        const SizedBox(height: 14),
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

  Color _getTagColor(String tag) {
    final t = tag.toLowerCase();
    if (t.contains('urgente') || t.contains('incidente')) return AppColors.error;
    if (t.contains('manten')) return AppColors.warning;
    if (t.contains('convoy') || t.contains('maniobra')) return AppColors.accent;
    if (t.contains('combustible')) return const Color(0xFFF97316);
    if (t.contains('tripulacion')) return const Color(0xFF06B6D4);
    if (t.contains('clima')) return const Color(0xFF8B5CF6);
    if (t.contains('carga')) return const Color(0xFF10B981);
    if (t.contains('operativo')) return AppColors.success;
    return AppColors.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    final allTags = _getAllTags();
    final logs = _filteredLogs;

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
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                children: [
                  Text('Bitácora', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1)),
                  Text('Digital.', style: GoogleFonts.newsreader(fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1)),
                  const SizedBox(height: 6),
                  Text('ÚLTIMAS ${logs.length} NOVEDADES${_activeFilter != null ? ' · ${_activeFilter!.toUpperCase()}' : ''}',
                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5)),

                  // ── Hashtag Filter Bar ──────────────────────
                  if (allTags.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    SizedBox(
                      height: 32,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          // "All" chip
                          GestureDetector(
                            onTap: () => setState(() => _activeFilter = null),
                            child: Container(
                              margin: const EdgeInsets.only(right: 6),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: _activeFilter == null ? AppColors.textPrimary : AppColors.backgroundSecondary,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.separator, width: 0.5),
                              ),
                              child: Text('Todas', style: GoogleFonts.inter(
                                fontSize: 11, fontWeight: FontWeight.w600,
                                color: _activeFilter == null ? AppColors.textOnAccent : AppColors.textSecondary,
                              )),
                            ),
                          ),
                          // Tag chips
                          ...allTags.map((tag) => GestureDetector(
                            onTap: () => setState(() => _activeFilter = _activeFilter == tag ? null : tag),
                            child: Container(
                              margin: const EdgeInsets.only(right: 6),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: _activeFilter == tag ? _getTagColor(tag) : _getTagColor(tag).withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: _getTagColor(tag).withValues(alpha: 0.3), width: 0.5),
                              ),
                              child: Text(tag, style: GoogleFonts.inter(
                                fontSize: 11, fontWeight: FontWeight.w600,
                                color: _activeFilter == tag ? AppColors.textOnAccent : _getTagColor(tag),
                              )),
                            ),
                          )),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 18),

                  // ── Log Entries ─────────────────────────────
                  ...List.generate(logs.length, (i) {
                    final log = logs[i];
                    final desc = (log['description'] ?? '').toString();
                    final tags = _extractTags(desc);
                    final date = DateTime.tryParse(log['created_at'] ?? '') ?? DateTime.now();
                    final timeStr = '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
                    final dayStr = '${date.day}/${date.month}';
                    final author = log['user_id'] != null ? 'Tripulante' : 'Sistema';
                    Color dotColor = AppColors.accent;
                    if (log['action_type'] == 'alert') dotColor = AppColors.warning;
                    if (log['action_type'] == 'success') dotColor = AppColors.success;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundSecondary,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.separator, width: 0.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Container(width: 8, height: 8, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
                              const SizedBox(width: 10),
                              Text(
                                (log['action_type'] ?? 'INFO').toString().toUpperCase(),
                                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5),
                              ),
                              const Spacer(),
                              Text('$author · $dayStr $timeStr', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
                            ]),
                            const SizedBox(height: 10),
                            // Rich text with highlighted hashtags
                            _buildRichDescription(desc),
                            // Hashtag chips
                            if (tags.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: tags.map((tag) => GestureDetector(
                                  onTap: () => setState(() => _activeFilter = _activeFilter == tag ? null : tag),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: _getTagColor(tag).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(5),
                                    ),
                                    child: Text(tag, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: _getTagColor(tag))),
                                  ),
                                )).toList(),
                              ),
                            ],
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

  // Build text with highlighted hashtags
  Widget _buildRichDescription(String text) {
    final regex = RegExp(r'(#\w+)');
    final spans = <TextSpan>[];
    int lastEnd = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(
          text: text.substring(lastEnd, match.start),
          style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: AppColors.textPrimary),
        ));
      }
      final tag = match.group(0)!;
      spans.add(TextSpan(
        text: tag,
        style: GoogleFonts.inter(fontSize: 14, height: 1.5, fontWeight: FontWeight.w700, color: _getTagColor(tag)),
      ));
      lastEnd = match.end;
    }
    if (lastEnd < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastEnd),
        style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: AppColors.textPrimary),
      ));
    }

    return RichText(text: TextSpan(children: spans));
  }
}
