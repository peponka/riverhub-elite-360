import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../services/ai_service.dart';
import '../services/locale_service.dart';

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

  // AI States
  bool _loadingMaint = false;
  bool _loadingFuel = false;
  List<Map<String, dynamic>> _maintPredictions = [];
  List<Map<String, dynamic>> _fuelAnomalies = [];
  int _selectedTab = 0; // 0=IA Modules, 1=Chat

  final String _agentName = "NexoBot";
  final String _userName = "Operador";

  @override
  void initState() {
    super.initState();
    _addMessage(
      _agentName,
      "Buen día, Capitán. 🚢 Soy NexoBot con IA Gemini. Preguntame lo que quieras sobre tu flota.",
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

    // Call real Gemini API
    final response = await AIService.chat(text);

    if (mounted) {
      setState(() => _isTyping = false);
      _addMessage(_agentName, response, true);
    }
  }

  String? _maintError;
  String? _fuelError;

  Future<void> _runPredictiveMaintenance() async {
    setState(() { _loadingMaint = true; _maintError = null; });
    try {
      final results = await AIService.predictMaintenance();
      if (mounted) {
        setState(() {
          _maintPredictions = results;
          _loadingMaint = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingMaint = false;
          _maintError = 'Error: $e';
        });
      }
    }
  }

  Future<void> _runFuelAnomalies() async {
    setState(() { _loadingFuel = true; _fuelError = null; });
    try {
      final results = await AIService.fuelAnomalies();
      if (mounted) {
        setState(() {
          _fuelAnomalies = results;
          _loadingFuel = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingFuel = false;
          _fuelError = 'Error: $e';
        });
      }
    }
  }

  Color _severityColor(String severity) {
    switch (severity) {
      case 'critical': return const Color(0xFFEF4444);
      case 'high': return const Color(0xFFF59E0B);
      case 'medium': return const Color(0xFF3B82F6);
      default: return const Color(0xFF10B981);
    }
  }

  String _severityLabel(String severity) {
    switch (severity) {
      case 'critical': return LocaleService.t('dyn_key_184');
      case 'high': return LocaleService.t('dyn_key_181');
      case 'medium': return LocaleService.t('dyn_key_111');
      default: return LocaleService.t('dyn_key_186');
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
            Text(LocaleService.t('nexobot_copiloto_ia'), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          ],
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // ─── Tab Selector ──────────────────────
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  _buildTab('🧠 IA Avanzada', 0),
                  _buildTab('💬 Chat', 1),
                ],
              ),
            ),

            // ─── Content ──────────────────────
            Expanded(
              child: _selectedTab == 0 ? _buildAIModules() : _buildChat(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(String label, int index) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.textPrimary : CupertinoColors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isSelected ? AppColors.textOnAccent : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════
  // IA MODULES TAB
  // ═══════════════════════════════════════════
  Widget _buildAIModules() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      children: [
        // ── Mantenimiento Predictivo ──
        _buildAICard(
          icon: CupertinoIcons.wrench,
          gradient: const [Color(0xFFF59E0B), Color(0xFFEF4444)],
          title: 'Mantenimiento Predictivo',
          subtitle: LocaleService.t('dyn_key_190'),
          buttonLabel: LocaleService.t('dyn_key_187'),
          loading: _loadingMaint,
          onTap: _runPredictiveMaintenance,
          errorText: _maintError,
          results: _maintPredictions.isEmpty
              ? null
              : Column(
                  children: _maintPredictions.map((p) => _buildMaintCard(p)).toList(),
                ),
        ),
        const SizedBox(height: 16),

        // ── Anomalías de Consumo ──
        _buildAICard(
          icon: CupertinoIcons.flame,
          gradient: const [Color(0xFF10B981), Color(0xFF3B82F6)],
          title: LocaleService.t('dyn_key_180'),
          subtitle: LocaleService.t('dyn_key_185'),
          buttonLabel: LocaleService.t('dyn_key_188'),
          loading: _loadingFuel,
          onTap: _runFuelAnomalies,
          errorText: _fuelError,
          results: _fuelAnomalies.isEmpty
              ? null
              : Column(
                  children: _fuelAnomalies.map((a) => _buildAnomalyCard(a)).toList(),
                ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildAICard({
    required IconData icon,
    required List<Color> gradient,
    required String title,
    required String subtitle,
    required String buttonLabel,
    required bool loading,
    required VoidCallback onTap,
    String? errorText,
    Widget? results,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: gradient),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: CupertinoColors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textPrimary)),
                    Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              CupertinoButton(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                color: AppColors.textPrimary,
                borderRadius: BorderRadius.circular(10),
                onPressed: loading ? null : onTap,
                child: loading
                    ? const CupertinoActivityIndicator(color: CupertinoColors.white, radius: 8)
                    : Text(buttonLabel, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textOnAccent)),
              ),
            ],
          ),
          if (loading)
            Padding(
              padding: const EdgeInsets.only(top: 20),
              child: Center(
                child: Column(
                  children: [
                    const CupertinoActivityIndicator(radius: 14),
                    const SizedBox(height: 10),
                    Text(LocaleService.t('nexobot_gemini_esta_analizan'), 
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic)),
                  ],
                ),
              ),
            ),
          if (errorText != null && !loading)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3)),
                ),
                child: Text(errorText, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFEF4444))),
              ),
            ),
          if (results != null && !loading && errorText == null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: results,
            ),
          if (results == null && !loading && errorText == null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Center(
                child: Text(
                  'Tocá "$buttonLabel" para iniciar el análisis con IA',
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMaintCard(Map<String, dynamic> p) {
    final severity = p['severity'] as String? ?? 'low';
    final color = _severityColor(severity);
    final prob = (p['probability'] as num?)?.toInt() ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: color, width: 4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text('🚢 ${p['vessel'] ?? ''}', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(6)),
                child: Text(_severityLabel(severity), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: CupertinoColors.white)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text('⚙️ ${p['component'] ?? ''}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(height: 4),
          Text('${p['action'] ?? ''}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(LocaleService.t('nexobot_'), style: GoogleFonts.inter(fontSize: 11)),
              Text('$prob%', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
              const SizedBox(width: 16),
              Text('📅 ${p['days_until'] ?? '?'} días', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
            ],
          ),
          const SizedBox(height: 6),
          // Progress bar
          Container(
            height: 5,
            decoration: BoxDecoration(color: AppColors.separator, borderRadius: BorderRadius.circular(3)),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: prob / 100,
              child: Container(
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnomalyCard(Map<String, dynamic> a) {
    final severity = a['severity'] as String? ?? 'low';
    final color = _severityColor(severity);
    final type = a['type'] as String? ?? '';
    final icon = type == 'theft_risk' ? '🚨' : type == 'overconsumption' ? '📈' : type == 'spike' ? '⚡' : type == 'trend' ? '📉' : '✅';
    final typeLabel = type == 'theft_risk' ? LocaleService.t('dyn_key_182') : type == 'overconsumption' ? LocaleService.t('dyn_key_191') : type == 'spike' ? 'PICO' : type == 'trend' ? LocaleService.t('dyn_key_183') : LocaleService.t('dyn_key_189');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: color, width: 4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(child: Text('$icon ${a['vessel'] ?? ''}', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(6)),
                child: Text(typeLabel, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: CupertinoColors.white)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text('${a['description'] ?? ''}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textPrimary)),
          if (a['deviation_pct'] != null) ...[
            const SizedBox(height: 4),
            Text(
              'Desviación: ${(a['deviation_pct'] as num) > 0 ? '+' : ''}${a['deviation_pct']}%',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color),
            ),
          ],
          const SizedBox(height: 4),
          Text('💡 ${a['recommendation'] ?? ''}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════
  // CHAT TAB
  // ═══════════════════════════════════════════
  Widget _buildChat() {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            itemCount: _messages.length,
            itemBuilder: (context, index) => _buildBubble(_messages[index]),
          ),
        ),
        if (_isTyping)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              children: [
                const CupertinoActivityIndicator(radius: 8),
                const SizedBox(width: 10),
                Text(LocaleService.t('nexobot_nexobot_esta_analiza'), style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 12, fontStyle: FontStyle.italic)),
              ],
            ),
          ),
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
                  placeholder: LocaleService.t('nexobot_preguntale_a_nexobot'),
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
                  decoration: BoxDecoration(color: AppColors.textPrimary, shape: BoxShape.circle),
                  child: const Icon(CupertinoIcons.paperplane_fill, color: AppColors.textOnAccent, size: 18),
                ),
              ),
            ],
          ),
        ),
      ],
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
              decoration: BoxDecoration(color: AppColors.textPrimary, borderRadius: BorderRadius.circular(8)),
              child: const Icon(CupertinoIcons.bolt_fill, color: AppColors.textOnAccent, size: 14),
            ),
          Flexible(
            child: Column(
              crossAxisAlignment: isAgent ? CrossAxisAlignment.start : CrossAxisAlignment.end,
              children: [
                Text(
                  isAgent ? 'NEXOBOT' : LocaleService.t('dyn_key_192'),
                  style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5),
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
                    style: GoogleFonts.inter(color: isAgent ? AppColors.textPrimary : AppColors.textOnAccent, fontSize: 14, height: 1.5),
                  ),
                ),
                const SizedBox(height: 4),
                Text(timeStr, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textTertiary)),
              ],
            ),
          ),
          if (!isAgent)
            Container(
              margin: const EdgeInsets.only(left: 10, top: 4),
              width: 28, height: 28,
              decoration: BoxDecoration(color: AppColors.surfaceContainerLow, borderRadius: BorderRadius.circular(8)),
              child: Center(child: Text(LocaleService.t('nexobot_op'), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary))),
            ),
        ],
      ),
    );
  }
}
