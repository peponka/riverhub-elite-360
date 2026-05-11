import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' as material;
import 'package:google_fonts/google_fonts.dart';
import '../services/supabase_service.dart';
import '../theme/app_colors.dart';
import '../main.dart';
import '../services/locale_service.dart';

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
        _messages = data.map((m) => {
          'sender': m['sender_name'] ?? m['sender'] ?? LocaleService.t('comms_unknown'),
          'content': m['message'] ?? m['content'] ?? '',
          'time': m['created_at']?.toString().substring(11, 16) ?? '-',
          'type': m['type'] ?? 'VHF',
          'isMe': m['sender_id'] == myId,
        }).toList();
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
        'sender': LocaleService.t('comms_you'),
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
    Future.delayed(const Duration(seconds: 3), () {
      if (!mounted) return;
      final replies = [
        LocaleService.t('dyn_key_68'),
        'Afirmativo, procedemos.',
        LocaleService.t('dyn_key_67'),
        'Recibido, ETA confirmado.',
      ];
      setState(() {
        _messages.add({
          'sender': 'CAPITAN TB-101',
          'content': replies[(replies.length * (DateTime.now().millisecond / 1000)).floor()],
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
      backgroundColor: AppColors.backgroundPrimary,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
        border: const Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
        leading: Navigator.of(context).canPop()
            ? CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.back, size: 22, color: AppColors.textPrimary), onPressed: () => Navigator.pop(context))
            : CupertinoButton(padding: EdgeInsets.zero, child: const Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary), onPressed: () => rootScaffoldKey.currentState?.openDrawer()),
        middle: Text('${LocaleService.t('comms_title')} $_activeChannel', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Container(
              height: 46,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: _channels.map((ch) {
                  final sel = ch == _activeChannel;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
                    child: GestureDetector(
                      onTap: () => setState(() { _activeChannel = ch; _loadMessages(); }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: sel ? AppColors.textPrimary : AppColors.backgroundSecondary,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: sel ? AppColors.textPrimary : AppColors.separator, width: 0.5),
                        ),
                        alignment: Alignment.center,
                        child: Text(ch, style: GoogleFonts.inter(
                          color: sel ? AppColors.textOnAccent : AppColors.textSecondary,
                          fontWeight: FontWeight.w600, fontSize: 12,
                        )),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(12),
                itemCount: _messages.length,
                itemBuilder: (context, i) => _messageBubble(_messages[i]),
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              decoration: BoxDecoration(
                color: AppColors.backgroundSecondary,
                border: Border(top: BorderSide(color: AppColors.separator, width: 0.5)),
              ),
              child: Row(children: [
                Expanded(child: CupertinoTextField(
                  controller: _msgController,
                  placeholder: LocaleService.t('comms_write'),
                  style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 14),
                  placeholderStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
                  decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.separator, width: 0.5)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  onSubmitted: (_) => _sendMessage(),
                )),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(12)),
                    child: Icon(CupertinoIcons.paperplane_fill, color: AppColors.backgroundPrimary, size: 18),
                  ),
                ),
              ]),
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
        padding: const EdgeInsets.all(14),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? AppColors.accent.withValues(alpha: 0.08) : AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isMe ? AppColors.accent.withValues(alpha: 0.2) : AppColors.separator, width: 0.5),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 6, height: 6, decoration: BoxDecoration(color: isMe ? AppColors.accent : AppColors.error, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(msg['sender'], style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: isMe ? AppColors.accent : AppColors.textPrimary)),
            const SizedBox(width: 8),
            Text('[${msg['time']}]', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(color: AppColors.textPrimary.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(4)),
              child: Text(msg['type'], style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.textTertiary)),
            ),
          ]),
          const SizedBox(height: 6),
          Text(msg['content'], style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary, height: 1.4)),
        ]),
      ),
    );
  }
}
