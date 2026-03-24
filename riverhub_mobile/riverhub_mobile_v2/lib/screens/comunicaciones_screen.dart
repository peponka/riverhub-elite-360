import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import '../services/supabase_service.dart';

class ComunicacionesScreen extends StatefulWidget {
  const ComunicacionesScreen({super.key});

  @override
  State<ComunicacionesScreen> createState() => _ComunicacionesScreenState();
}

class _ComunicacionesScreenState extends State<ComunicacionesScreen> {
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _activeChannel = 'CH-16';

  final List<String> _channels = ['CH-16', 'CH-06', 'CH-72', 'CH-13'];

  List<Map<String, dynamic>> _messages = [];

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    final data = await SupabaseService.getComms(channel: _activeChannel);
    setState(() {
      if (data.isNotEmpty) {
        final myId = SupabaseService.currentUserId;
        _messages = data
            .map(
              (m) => {
                'sender': m['sender_name'] ?? m['sender'] ?? 'DESCONOCIDO',
                'content': m['message'] ?? m['content'] ?? '',
                'time': m['created_at']?.toString().substring(11, 16) ?? '-',
                'type': m['type'] ?? 'VHF',
                'isMe': m['sender_id'] == myId,
              },
            )
            .toList();
      } else {
        _messages = [];
      }
    });
  }

  void _sendMessage() {
    final text = _msgController.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add({
        'sender': 'OPERADOR',
        'content': text,
        'time': material.TimeOfDay.now().format(context),
        'type': 'VHF',
        'isMe': true,
      });
      _msgController.clear();
    });
    Future.delayed(const Duration(milliseconds: 100), () {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
    // Auto-reply
    Future.delayed(const Duration(seconds: 3), () {
      if (!mounted) return;
      final replies = [
        'Copiado Central.',
        'Afirmativo, procedemos.',
        'Enterado, mantengo escucha.',
        'Recibido, ETA confirmado.',
      ];
      setState(() {
        _messages.add({
          'sender': 'CAPITAN TB-101',
          'content':
              replies[(replies.length * (DateTime.now().millisecond / 1000))
                  .floor()],
          'time': material.TimeOfDay.now().format(context),
          'type': 'VHF',
          'isMe': false,
        });
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(
          'Comunicaciones $_activeChannel',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF0A0E1A).withValues(alpha: 0.95),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Icon(CupertinoIcons.back, color: Color(0xFF00E5FF)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: const Color(0xFF0A0E1A),
      child: SafeArea(
        child: Column(
          children: [
            // Channel selector
            Container(
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: _channels.map((ch) {
                  final sel = ch == _activeChannel;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
                    child: GestureDetector(
                      onTap: () => setState(() => _activeChannel = ch),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: sel
                              ? const Color(0xFF00E5FF)
                              : const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(20),
                          border: sel
                              ? null
                              : Border.all(color: const Color(0xFF334155)),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          ch,
                          style: TextStyle(
                            color: sel
                                ? material.Colors.black
                                : material.Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            // Messages
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(12),
                itemCount: _messages.length,
                itemBuilder: (context, i) => _messageBubble(_messages[i]),
              ),
            ),
            // Input
            Container(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
                border: Border(top: BorderSide(color: Color(0xFF1E293B))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: CupertinoTextField(
                      controller: _msgController,
                      placeholder: 'Transmitir mensaje...',
                      style: const TextStyle(
                        color: material.Colors.white,
                        fontSize: 14,
                      ),
                      placeholderStyle: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 14,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E5FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        CupertinoIcons.paperplane_fill,
                        color: material.Colors.black,
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

  Widget _messageBubble(Map<String, dynamic> msg) {
    final isMe = msg['isMe'] as bool;
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          color: isMe
              ? const Color(0xFF06B6D4).withValues(alpha: 0.15)
              : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isMe
                ? const Color(0xFF06B6D4).withValues(alpha: 0.3)
                : const Color(0xFF334155),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '● ${msg['sender']}',
                  style: TextStyle(
                    color: isMe
                        ? const Color(0xFF06B6D4)
                        : const Color(0xFFEF4444),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '[${msg['time']}]',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 10,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF334155),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    msg['type'],
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 9,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              msg['content'],
              style: const TextStyle(
                color: material.Colors.white,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
