import 'package:flutter/cupertino.dart';

/// RiverHub — Paleta de colores Cupertino (Light Mode)
///
/// Todos los colores del proyecto deben referenciarse desde aquí.
/// Nunca usar hex hardcodeados en los widgets.
abstract class AppColors {
  // ─── Fondos ────────────────────────────────────────────────────────────────
  /// Fondo principal de la app (equivalente a systemGroupedBackground de iOS)
  static const Color backgroundPrimary = Color(0xFFF2F2F7);

  /// Fondo de tarjetas / superficies secundarias
  static const Color backgroundSecondary = Color(0xFFFFFFFF);

  /// Inicio de gradiente sutil (azul muy claro)
  static const Color gradientStart = Color(0xFFEBF4FF);

  /// Fin de gradiente sutil (blanco)
  static const Color gradientEnd = Color(0xFFFFFFFF);

  // ─── Texto ─────────────────────────────────────────────────────────────────
  /// Texto principal (label primario de iOS — negro en light)
  static const Color textPrimary = Color(0xFF000000);

  /// Texto secundario (label secundario de iOS — gris medio)
  static const Color textSecondary = Color(0xFF8E8E93);

  /// Texto terciario / placeholder
  static const Color textTertiary = Color(0xFFAEAEB2);

  /// Texto sobre fondos de color / botones de acento (siempre blanco)
  static const Color textOnAccent = Color(0xFFFFFFFF);

  // ─── Separadores y bordes ──────────────────────────────────────────────────
  /// Separador principal (líneas entre celdas, bordes de tarjeta)
  static const Color separator = Color(0xFFC6C6C8);

  /// Separador más claro
  static const Color separatorLight = Color(0xFFD1D1D6);

  /// Relleno de celdas de formulario (systemFill de iOS)
  static const Color cellFill = Color(0xFFE5E5EA);

  // ─── Acento principal ──────────────────────────────────────────────────────
  /// Azul iOS — reemplaza el cyan eléctrico anterior (activeBlue)
  static const Color accent = Color(0xFF007AFF);

  /// Azul iOS más claro (systemTeal / link)
  static const Color accentTeal = Color(0xFF32ADE6);

  /// Azul iOS puro (alias de accent, para gradientes / variantes)
  static const Color blue = Color(0xFF007AFF);

  // ─── Semánticos ────────────────────────────────────────────────────────────
  /// Verde éxito (systemGreen iOS)
  static const Color success = Color(0xFF34C759);

  /// Rojo error / peligro (systemRed iOS)
  static const Color error = Color(0xFFFF3B30);

  /// Amarillo advertencia (systemYellow iOS)
  static const Color warning = Color(0xFFFF9F0A);

  /// Naranja (systemOrange iOS)
  static const Color orange = Color(0xFFFF9500);

  /// Púrpura (systemPurple iOS)
  static const Color purple = Color(0xFFAF52DE);

  // ─── Grises del sistema ────────────────────────────────────────────────────
  /// Gris 1 — systemGrey iOS
  static const Color systemGray1 = Color(0xFF8E8E93);

  /// Gris 2 — systemGrey2 iOS
  static const Color systemGray2 = Color(0xFFAEAEB2);

  /// Gris 3 — systemGrey3 iOS
  static const Color systemGray3 = Color(0xFFC7C7CC);

  /// Gris 4 — systemGrey4 iOS
  static const Color systemGray4 = Color(0xFFD1D1D6);

  /// Gris 5 — systemGrey5 iOS (fondos de input)
  static const Color systemGray5 = Color(0xFFE5E5EA);

  /// Gris 6 — systemGrey6 iOS (fondos muy claros)
  static const Color systemGray6 = Color(0xFFF2F2F7);
}
