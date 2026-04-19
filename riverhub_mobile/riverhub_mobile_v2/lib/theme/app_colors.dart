import 'package:flutter/cupertino.dart';

/// RiverHub Meridian — Paleta "Fluvia" (Editorial Light Mode)
///
/// Diseño editorial No-Line: separación por capas tonales,
/// tipografía dual Newsreader (títulos) + Inter (datos).
abstract class AppColors {
  // ─── Fondos (Capas Tonales) ─────────────────────────────────────────────
  /// Fondo principal de la app (superficie base)
  static const Color backgroundPrimary = Color(0xFFF8F9FA);

  /// Fondo de tarjetas / superficies elevadas
  static const Color backgroundSecondary = Color(0xFFFFFFFF);

  /// Surface container low (sidebar, áreas secundarias)
  static const Color surfaceContainerLow = Color(0xFFF1F5F9);

  /// Gradiente sutil
  static const Color gradientStart = Color(0xFFF8F9FA);
  static const Color gradientEnd = Color(0xFFFFFFFF);

  // ─── Texto ─────────────────────────────────────────────────────────────────
  /// Texto principal (casi negro editorial)
  static const Color textPrimary = Color(0xFF1A1A2E);

  /// Texto secundario (gris medio editorial)
  static const Color textSecondary = Color(0xFF94A3B8);

  /// Texto terciario / placeholder
  static const Color textTertiary = Color(0xFFCBD5E1);

  /// Texto sobre fondos de color / botones de acento
  static const Color textOnAccent = Color(0xFFFFFFFF);

  // ─── Separadores y bordes ──────────────────────────────────────────────────
  /// Borde principal Fluvia (muy sutil)
  static const Color separator = Color(0xFFE2E8F0);

  /// Borde más claro
  static const Color separatorLight = Color(0xFFF1F5F9);

  /// Relleno de celdas de formulario
  static const Color cellFill = Color(0xFFF1F5F9);

  // ─── Acento principal ──────────────────────────────────────────────────────
  /// Azul editorial Fluvia
  static const Color accent = Color(0xFF3B82F6);

  /// Azul teal (links, secundario)
  static const Color accentTeal = Color(0xFF0EA5E9);

  /// Azul alias
  static const Color blue = Color(0xFF3B82F6);

  // ─── Semánticos ────────────────────────────────────────────────────────────
  /// Verde éxito (status-ok Fluvia)
  static const Color success = Color(0xFF2EA043);

  /// Rojo error / peligro
  static const Color error = Color(0xFFDC2626);

  /// Amarillo advertencia
  static const Color warning = Color(0xFFF59E0B);

  /// Naranja
  static const Color orange = Color(0xFFF97316);

  /// Púrpura
  static const Color purple = Color(0xFF8B5CF6);

  // ─── Grises del sistema (escala Fluvia) ────────────────────────────────────
  static const Color systemGray1 = Color(0xFF94A3B8);
  static const Color systemGray2 = Color(0xFFCBD5E1);
  static const Color systemGray3 = Color(0xFFE2E8F0);
  static const Color systemGray4 = Color(0xFFF1F5F9);
  static const Color systemGray5 = Color(0xFFF8FAFC);
  static const Color systemGray6 = Color(0xFFF8F9FA);
}
