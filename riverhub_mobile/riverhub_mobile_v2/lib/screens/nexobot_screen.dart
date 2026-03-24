import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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

  final String _agentName = "Antigravity";
  final String _userName = "Operador";

  @override
  void initState() {
    super.initState();
    // Initial greeting
    _addMessage(
      _agentName,
      "Hola, soy Antigravity, tu agente de inteligencia de RiverHub. ¿En qué puedo ayudarte hoy Capitán?",
      true,
    );
  }

  void _addMessage(String sender, String text, bool isAgent) {
    setState(() {
      _messages.add(Message(sender: sender, text: text, isAgent: isAgent));
    });
    // Scroll to bottom
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

    // Simulate network delay / AI thinking
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
      // Intent 1: Flota/Barcos
      if (lower.contains('barco') ||
          lower.contains('flota') ||
          lower.contains('buque') ||
          lower.contains('remolcador')) {
        final response = await Supabase.instance.client
            .from('fleet_assets')
            .select('name, status');
        final actives = List.from(response);
        if (actives.isEmpty) {
          return "No encuentro embarcaciones activas en ruta en este momento.";
        }

        String list = actives.take(3).map((v) => "• ${v['name']}").join("\n");
        return "📊 **Estado de Flota:**\nTienes ${actives.length} unidades operativas actualmente.\nDestacadas:\n$list";
      }

      // Intent 2: Viajes/Rutas
      if (lower.contains('viaje') ||
          lower.contains('ruta') ||
          lower.contains('manifiesto')) {
        final response = await Supabase.instance.client
            .from('voyages')
            .select('origin_port, destination_port, status')
            .eq('status', 'live');
        final trips = List.from(response);
        if (trips.isEmpty) {
          return "Actualmente no tienes viajes transmitiendo en vivo.";
        }
        return "🚢 **Viajes Activos:**\nTienes ${trips.length} viaje(s) en curso.\nÚltima ruta: ${trips[0]['origin_port']} -> ${trips[0]['destination_port']}";
      }

      // Greetings / Fallback
      if (lower.contains('hola') || lower.contains('buen')) {
        return "¡Hola! Soy Antigravity. Pregúntame sobre tus barcos o los viajes en curso.";
      }
      if (lower.contains('gracias')) {
        return "De nada. Estoy aquí monitoreando el río 24/7.";
      }

      return "Entiendo tu consulta, pero necesito que seas más específico. Prueba preguntar por 'estado de la flota' o 'viajes activos'.";
    } catch (e) {
      debugPrint('AI Error: $e');
      return "Lo siento, tuve un error al consultar tu base de datos segura. Revisa tu conexión.";
    }
  }

  Widget _buildMessageBubble(Message message) {
    final isAgent = message.isAgent;
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: isAgent
            ? MainAxisAlignment.start
            : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (isAgent) ...[
            Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: CupertinoColors.activeBlue,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                CupertinoIcons.sparkles,
                color: CupertinoColors.white,
                size: 16,
              ),
            ),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isAgent
                    ? CupertinoColors.white
                    : CupertinoColors.activeBlue,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isAgent
                      ? const Radius.circular(4)
                      : const Radius.circular(16),
                  bottomRight: isAgent
                      ? const Radius.circular(16)
                      : const Radius.circular(4),
                ),
                boxShadow: [
                  BoxShadow(
                    color: CupertinoColors.systemGrey4.withValues(alpha: 0.5),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                message.text,
                style: GoogleFonts.inter(
                  color: isAgent
                      ? CupertinoColors.black
                      : CupertinoColors.white,
                  fontSize: 15,
                  height: 1.4,
                ),
              ),
            ),
          ),
          if (!isAgent) ...[
            Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: CupertinoColors.systemGrey5,
                shape: BoxShape.circle,
                border: Border.all(color: CupertinoColors.systemGrey4),
              ),
              child: const Icon(
                CupertinoIcons.person_fill,
                color: CupertinoColors.systemGrey,
                size: 16,
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: CupertinoColors.systemGroupedBackground,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CupertinoColors.white.withValues(alpha: 0.85),
        middle: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              CupertinoIcons.sparkles,
              color: CupertinoColors.activeBlue,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              'NexoBot IA',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  return _buildMessageBubble(_messages[index]);
                },
              ),
            ),

            if (_isTyping)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 8.0,
                ),
                child: Row(
                  children: [
                    const CupertinoActivityIndicator(radius: 8),
                    const SizedBox(width: 12),
                    Text(
                      'Antigravity está analizando la flota...',
                      style: TextStyle(
                        color: CupertinoColors.systemGrey,
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: CupertinoColors.white,
                border: Border(
                  top: BorderSide(color: CupertinoColors.systemGrey4),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: CupertinoTextField(
                      controller: _textController,
                      placeholder: 'Pregúntale a NexoBot...',
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      maxLines: null,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      decoration: BoxDecoration(
                        color: CupertinoColors.systemGroupedBackground,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: CupertinoColors.systemGrey5),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _sendMessage,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: CupertinoColors.activeBlue,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        CupertinoIcons.paperplane_fill,
                        color: CupertinoColors.white,
                        size: 20,
                      ),
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
}
