import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_colors.dart';

class Message {
  final String sender;
  final String text;
  final bool isAgent;
  final DateTime time;

  Message({required this.sender, required this.text, required this.isAgent})
    : time = DateTime.now();
}

class NexoBotScreen extends StatefulWidget {
  const NexoBotScreen({super.key});

  @override
  State<NexoBotScreen> createState() => _NexoBotScreenState();
}

class _NexoBotScreenState extends State<NexoBotScreen> {
  final List<Message> _messages = [];
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isTyping = false;

  final String _agentName = "NexoBot";
  final String _userName = "Operador";

  @override
  void initState() {
    super.initState();
    _addMessage(
      _agentName,
      "Buen día, Capitán. 🚢 Soy NexoBot, tu copiloto de inteligencia para la Hidrovía Paraguay-Paraná.\n\n¿En qué puedo asistirte hoy?",
      true,
    );
  }

  void _addMessage(String sender, String text, bool isAgent) {
    setState(() {
      _messages.add(Message(sender: sender, text: text, isAgent: isAgent));
    });
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _textController.clear();
    _addMessage(_userName, text, false);
    setState(() => _isTyping = true);

    await Future.delayed(const Duration(milliseconds: 1500));
    final response = await _generateAIResponse(text);

    if (mounted) {
      setState(() => _isTyping = false);
      _addMessage(_agentName, response, true);
    }
  }

  Future<String> _generateAIResponse(String input) async {
    final lower = input.toLowerCase();
    try {
      if (lower.contains('barco') || lower.contains('flota') || lower.contains('buque') || lower.contains('remolcador')) {
        final response = await Supabase.instance.client.from('fleet_assets').select('name, status');
        final actives = List.from(response);
        if (actives.isEmpty) return "No encuentro embarcaciones activas en ruta en este momento.";
        String list = actives.take(3).map((v) => "• ${v['name']}").join("\n");
        return "📊 Estado de Flota:\nTienes ${actives.length} unidades operativas.\n\n$list";
      }
      if (lower.contains('viaje') || lower.contains('ruta') || lower.contains('manifiesto')) {
        final response = await Supabase.instance.client.from('voyages').select('origin_port, destination_port, status').eq('status', 'live');
        final trips = List.from(response);
        if (trips.isEmpty) return "Actualmente no tienes viajes transmitiendo en vivo.";
        return "🚢 Viajes Activos:\nTienes ${trips.length} viaje(s) en curso.\nÚltima ruta: ${trips[0]['origin_port']} → ${trips[0]['destination_port']}";
      }
      if (lower.contains('hola') || lower.contains('buen')) return "¡Hola! Pregúntame sobre tus barcos o los viajes en curso.";
      if (lower.contains('gracias')) return "De nada. Estoy aquí monitoreando el río 24/7. ⚓";
      return "Entiendo tu consulta, pero necesito que seas más específico. Prueba 'estado de la flota' o 'viajes activos'.";
    } catch (e) {
      debugPrint('AI Error: $e');
      return "Lo siento, tuve un error al consultar la base de datos. Revisa tu conexión.";
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        middle: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(CupertinoIcons.bolt_fill, color: AppColors.textPrimary, size: 16),
            const SizedBox(width: 6),
            Text('NexoBot', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          ],
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // ─── Chat Messages ──────────────────────
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                itemCount: _messages.length,
                itemBuilder: (context, index) => _buildBubble(_messages[index]),
              ),
            ),

            // ─── Typing Indicator ───────────────────
            if (_isTyping)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Row(
                  children: [
                    const CupertinoActivityIndicator(radius: 8),
                    const SizedBox(width: 10),
                    Text(
                      'NexoBot está analizando...',
                      style: GoogleFonts.inter(
                        color: AppColors.textSecondary, fontSize: 12, fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),

            // ─── Input Area ─────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: CupertinoTextField(
                      controller: _textController,
                      placeholder: 'Preguntale a NexoBot...',
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      maxLines: null,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
                      style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.separator, width: 0.5),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _sendMessage,
                    child: Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.textPrimary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(CupertinoIcons.paperplane_fill, color: AppColors.textOnAccent, size: 18),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBubble(Message message) {
    final isAgent = message.isAgent;
    final timeStr = '${message.time.hour.toString().padLeft(2, '0')}:${message.time.minute.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: isAgent ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isAgent)
            Container(
              margin: const EdgeInsets.only(right: 10, top: 4),
              width: 28, height: 28,
              decoration: BoxDecoration(
                color: AppColors.textPrimary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(CupertinoIcons.bolt_fill, color: AppColors.textOnAccent, size: 14),
            ),
          Flexible(
            child: Column(
              crossAxisAlignment: isAgent ? CrossAxisAlignment.start : CrossAxisAlignment.end,
              children: [
                Text(
                  isAgent ? 'NEXOBOT' : 'TÚ',
                  style: GoogleFonts.inter(
                    fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isAgent ? AppColors.backgroundSecondary : AppColors.textPrimary,
                    borderRadius: BorderRadius.circular(14),
                    border: isAgent ? Border.all(color: AppColors.separator, width: 0.5) : null,
                  ),
                  child: Text(
                    message.text,
                    style: GoogleFonts.inter(
                      color: isAgent ? AppColors.textPrimary : AppColors.textOnAccent,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  timeStr,
                  style: GoogleFonts.inter(fontSize: 10, color: AppColors.textTertiary),
                ),
              ],
            ),
          ),
          if (!isAgent)
            Container(
              margin: const EdgeInsets.only(left: 10, top: 4),
              width: 28, height: 28,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text('PE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
              ),
            ),
        ],
      ),
    );
  }
}
