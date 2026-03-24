import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
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
          .select('*, profiles:user_id(full_name)')
          .order('created_at', ascending: false)
          .limit(20);

      if (mounted) {
        setState(() {
          _logs = response;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching logs: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
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
            color: CupertinoColors.systemBackground,
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CupertinoNavigationBar(
                    backgroundColor: CupertinoColors.white.withAlpha(200),
                    leading: CupertinoButton(
                      padding: EdgeInsets.zero,
                      child: const Text('Cancelar'),
                      onPressed: () => Navigator.pop(context),
                    ),
                    middle: const Text('Nueva Novedad'),
                    trailing: isUploading
                        ? const CupertinoActivityIndicator()
                        : CupertinoButton(
                            padding: EdgeInsets.zero,
                            child: const Text('Guardar', style: TextStyle(fontWeight: FontWeight.bold)),
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
                                    
                                    await Supabase.instance.client.storage
                                        .from('documents')
                                        .uploadBinary('logs/$fileName', bytes);
                                        
                                    imageUrl = Supabase.instance.client.storage
                                        .from('documents')
                                        .getPublicUrl('logs/$fileName');
                                  } catch (e) {
                                    debugPrint('Error uploading image: $e');
                                    // Continuaremos guardando el log incluso si falla la foto
                                  }
                                }

                                final payload = {
                                  'description': text,
                                  'action_type': actionType,
                                  'user_id': Supabase.instance.client.auth.currentUser?.id,
                                };
                                
                                // Intentar incluir la imagen si la columna existe en BD o tolerar si falla
                                if (imageUrl != null) {
                                  payload['image_url'] = imageUrl;
                                }

                                final response = await Supabase.instance.client.from('logs').insert(payload);
                                
                                if (context.mounted) Navigator.pop(context);
                                _fetchLogs();
                              } catch (e) {
                                debugPrint('Error saving log: $e');
                                // Si falló por la columna image_url (que quizá no existe)
                                if (e.toString().contains('image_url')) {
                                   try {
                                     final fallbackPayload = {
                                        'description': textController.text,
                                        'action_type': 'info',
                                        'user_id': Supabase.instance.client.auth.currentUser?.id,
                                     };
                                     await Supabase.instance.client.from('logs').insert(fallbackPayload);
                                     if (context.mounted) Navigator.pop(context);
                                     _fetchLogs();
                                   } catch (fallbackErr) {
                                     debugPrint('Fallback error: $fallbackErr');
                                   }
                                }
                              } finally {
                                if (mounted) setModalState(() => isUploading = false);
                              }
                            },
                          ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        CupertinoTextField(
                          controller: textController,
                          placeholder: 'Escriba el suceso aquí...',
                          minLines: 3,
                          maxLines: 5,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: CupertinoColors.systemGrey6,
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (selectedImage != null)
                          Stack(
                            alignment: Alignment.topRight,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.file(
                                  selectedImage!,
                                  height: 150,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              CupertinoButton(
                                padding: EdgeInsets.zero,
                                onPressed: () => setModalState(() => selectedImage = null),
                                child: Container(
                                  margin: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(
                                    color: CupertinoColors.black,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(CupertinoIcons.clear_circled_solid, color: CupertinoColors.white),
                                ),
                              ),
                            ],
                          )
                        else
                          Row(
                            children: [
                              Expanded(
                                child: CupertinoButton.filled(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  onPressed: () async {
                                    final ImagePicker picker = ImagePicker();
                                    final XFile? image = await picker.pickImage(
                                      source: ImageSource.camera,
                                      imageQuality: 70, // Reducir tamaño
                                    );
                                    if (image != null) {
                                      setModalState(() {
                                        selectedImage = File(image.path);
                                      });
                                    }
                                  },
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(CupertinoIcons.camera_fill),
                                      SizedBox(width: 8),
                                      Text('Tomar Foto'),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: CupertinoButton(
                                  color: CupertinoColors.systemGrey5,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  onPressed: () async {
                                    final ImagePicker picker = ImagePicker();
                                    final XFile? image = await picker.pickImage(
                                      source: ImageSource.gallery,
                                      imageQuality: 70,
                                    );
                                    if (image != null) {
                                      setModalState(() {
                                        selectedImage = File(image.path);
                                      });
                                    }
                                  },
                                  child: const Text('Galería', style: TextStyle(color: CupertinoColors.activeBlue)),
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
      backgroundColor: CupertinoColors.systemGroupedBackground,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CupertinoColors.white.withValues(alpha: 0.85),
        border: null,
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.bars, size: 28),
          onPressed: () {
            rootScaffoldKey.currentState?.openDrawer();
          },
        ),
        middle: Text(
          'Bitácora Digital',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _addLogEntry,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text('Nueva ', style: TextStyle(color: CupertinoColors.activeBlue, fontSize: 13, fontWeight: FontWeight.bold)),
              Icon(CupertinoIcons.add_circled_solid, size: 28),
            ],
          ),
        ),
      ),
      child: SafeArea(
        child: _isLoading
            ? const Center(child: CupertinoActivityIndicator(radius: 16))
            : _logs.isEmpty
            ? Center(
                child: Text(
                  'Sin registros recientes',
                  style: GoogleFonts.inter(color: CupertinoColors.systemGrey),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20.0,
                  vertical: 16.0,
                ),
                itemCount: _logs.length,
                itemBuilder: (context, index) {
                  final log = _logs[index];
                  // parse date
                  final date =
                      DateTime.tryParse(log['created_at'] ?? '') ??
                      DateTime.now();
                  final hour = date.hour.toString().padLeft(2, '0');
                  final minute = date.minute.toString().padLeft(2, '0');
                  final timeString = '$hour:$minute';

                  final authorName = log['profiles'] != null
                      ? log['profiles']['full_name'] ?? 'Usuario'
                      : 'Sistema';

                  IconData icon = CupertinoIcons.info_circle_fill;
                  Color iconColor = CupertinoColors.activeBlue;

                  if (log['action_type'] == 'alert') {
                    icon = CupertinoIcons.exclamationmark_triangle_fill;
                    iconColor = CupertinoColors.systemOrange;
                  } else if (log['action_type'] == 'success') {
                    icon = CupertinoIcons.check_mark_circled_solid;
                    iconColor = CupertinoColors.activeGreen;
                  }

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: _buildLogCard(
                      context,
                      time: timeString,
                      title: log['action_type'].toString().toUpperCase(),
                      user: authorName.toString(),
                      content: log['description'] ?? '',
                      icon: icon,
                      iconColor: iconColor,
                      imageUrl: log['image_url']?.toString(),
                    ),
                  );
                },
              ),
      ),
    );
  }

  Widget _buildLogCard(
    BuildContext context, {
    required String time,
    required String title,
    required String user,
    required String content,
    required IconData icon,
    required Color iconColor,
    String? imageUrl,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: CupertinoColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: CupertinoColors.systemGrey.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: CupertinoColors.black,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$user • $time',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: CupertinoColors.systemGrey,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            content,
            style: GoogleFonts.inter(
              fontSize: 15,
              height: 1.5,
              color: CupertinoColors.darkBackgroundGray,
            ),
          ),
          if (imageUrl != null && imageUrl.isNotEmpty) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                imageUrl,
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 200,
                  color: CupertinoColors.systemGrey6,
                  child: const Center(
                    child: Icon(CupertinoIcons.photo, color: CupertinoColors.systemGrey),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
