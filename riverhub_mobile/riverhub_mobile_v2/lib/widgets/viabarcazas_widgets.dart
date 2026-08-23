import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../main.dart';

/// ViaBarcazas-style navigation bar reusable across all screens
class ViaBarcazasNavBar extends CupertinoNavigationBar {
  ViaBarcazasNavBar({
    super.key,
    required String title,
    bool showDrawer = false,
    Widget? trailingWidget,
  }) : super(
    backgroundColor: AppColors.backgroundSecondary.withValues(alpha: 0.95),
    border: Border(bottom: BorderSide(color: AppColors.separator, width: 0.5)),
    leading: showDrawer
        ? Builder(
            builder: (context) => CupertinoButton(
              padding: EdgeInsets.zero,
              child: Icon(CupertinoIcons.bars, size: 24, color: AppColors.textPrimary),
              onPressed: () => rootScaffoldKey.currentState?.openDrawer(),
            ),
          )
        : null,
    middle: Text(
      title,
      style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary, fontSize: 16),
    ),
    trailing: trailingWidget,
    previousPageTitle: '',
  );
}

/// Standard ViaBarcazas page title (Newsreader serif split into two lines)
class ViaBarcazasTitle extends StatelessWidget {
  final String line1;
  final String line2;
  final String? subtitle;

  const ViaBarcazasTitle({
    super.key,
    required this.line1,
    required this.line2,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          line1,
          style: GoogleFonts.newsreader(
            fontSize: 34, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.1,
          ),
        ),
        Text(
          line2,
          style: GoogleFonts.newsreader(
            fontSize: 34, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic, color: AppColors.textPrimary, height: 1.1,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: GoogleFonts.inter(
              fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5,
            ),
          ),
        ],
      ],
    );
  }
}

/// Standard ViaBarcazas KPI card
class ViaBarcazasKpiCard extends StatelessWidget {
  final String label;
  final String value;
  final Color dotColor;

  const ViaBarcazasKpiCard({
    super.key,
    required this.label,
    required this.value,
    this.dotColor = AppColors.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.separator, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 8, height: 8,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.newsreader(
              fontSize: 32, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Standard ViaBarcazas list card
class ViaBarcazasListCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const ViaBarcazasListCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.separator, width: 0.5),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.textSecondary, size: 20),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Icon(CupertinoIcons.chevron_right, size: 14, color: AppColors.separator),
          ],
        ),
      ),
    );
  }
}

/// Section header widget
class ViaBarcazasSectionHeader extends StatelessWidget {
  final String title;

  const ViaBarcazasSectionHeader({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.5,
        ),
      ),
    );
  }
}
