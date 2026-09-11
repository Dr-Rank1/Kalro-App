import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/report_chart_data.dart';
import '../../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class FeedTrendChart extends StatelessWidget {
  FeedTrendChart({super.key, required this.points});

  final List<ChartPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.every((p) => p.value == 0)) {
      return _emptyState('No feed logged in the last 14 days');
    }

    final maxY = points.map((p) => p.value).reduce((a, b) => a > b ? a : b);

    return SizedBox(
      height: 200,
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: maxY * 1.2,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: maxY > 0 ? maxY / 4 : 1,
          ),
          titlesData: FlTitlesData(
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 36,
                getTitlesWidget: (value, meta) => Text(
                  value >= 1000 ? '${(value / 1000).toStringAsFixed(0)}k' : value.toInt().toString(),
                  style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
                ),
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 2,
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index < 0 || index >= points.length) return SizedBox.shrink();
                  return Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      points[index].label,
                      style: GoogleFonts.poppins(fontSize: 9, color: KalroColors.textMuted),
                    ),
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: [
                for (var i = 0; i < points.length; i++)
                  FlSpot(i.toDouble(), points[i].value),
              ],
              isCurved: true,
              color: KalroColors.headerGreen,
              barWidth: 3,
              dotData: FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: KalroColors.headerGreen.withValues(alpha: 0.12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class MortalityTrendChart extends StatelessWidget {
  MortalityTrendChart({super.key, required this.points});

  final List<ChartPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.every((p) => p.value == 0)) {
      return _emptyState('No mortality recorded in the last 14 days');
    }

    final maxY = points.map((p) => p.value).reduce((a, b) => a > b ? a : b);

    return SizedBox(
      height: 200,
      child: BarChart(
        BarChartData(
          maxY: maxY < 1 ? 1 : maxY * 1.2,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: maxY > 0 ? (maxY / 4).clamp(1, double.infinity) : 1,
          ),
          titlesData: FlTitlesData(
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 28,
                getTitlesWidget: (value, meta) => Text(
                  value.toInt().toString(),
                  style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
                ),
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 2,
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index < 0 || index >= points.length) return SizedBox.shrink();
                  return Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      points[index].label,
                      style: GoogleFonts.poppins(fontSize: 9, color: KalroColors.textMuted),
                    ),
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          barGroups: [
            for (var i = 0; i < points.length; i++)
              BarChartGroupData(
                x: i,
                barRods: [
                  BarChartRodData(
                    toY: points[i].value,
                    color: Colors.orange.shade400,
                    width: 10,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(4)),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class SpeciesSplitChart extends StatelessWidget {
  SpeciesSplitChart({
    super.key,
    required this.bombyxLarvae,
    required this.eriLarvae,
  });

  final int bombyxLarvae;
  final int eriLarvae;

  @override
  Widget build(BuildContext context) {
    final total = bombyxLarvae + eriLarvae;
    if (total == 0) {
      return _emptyState('No active larvae to display');
    }

    return SizedBox(
      height: 180,
      child: Row(
        children: [
          Expanded(
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 36,
                sections: [
                  PieChartSectionData(
                    value: bombyxLarvae.toDouble(),
                    color: KalroColors.headerGreen,
                    title: bombyxLarvae > 0 ? '${((bombyxLarvae / total) * 100).round()}%' : '',
                    radius: 52,
                    titleStyle: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  PieChartSectionData(
                    value: eriLarvae.toDouble(),
                    color: KalroColors.accentBrown,
                    title: eriLarvae > 0 ? '${((eriLarvae / total) * 100).round()}%' : '',
                    radius: 52,
                    titleStyle: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _LegendDot(color: KalroColors.headerGreen, label: 'Bombyx: $bombyxLarvae'),
              SizedBox(height: 8),
              _LegendDot(color: KalroColors.accentBrown, label: 'Eri: $eriLarvae'),
            ],
          ),
          SizedBox(width: 12),
        ],
      ),
    );
  }
}

class BatchComparisonTable extends StatelessWidget {
  BatchComparisonTable({super.key, required this.rows});

  final List<BatchComparisonRow> rows;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return _emptyState('No active batches to compare');
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingTextStyle: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: KalroColors.textDark,
        ),
        dataTextStyle: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
        columns: const [
          DataColumn(label: Text('Species'.tr)),
          DataColumn(label: Text('Started'.tr)),
          DataColumn(label: Text('Live'.tr)),
          DataColumn(label: Text('Survival'.tr)),
          DataColumn(label: Text('Feed'.tr)),
          DataColumn(label: Text('Harvest'.tr)),
          DataColumn(label: Text('Status'.tr)),
        ],
        rows: rows
            .map(
              (row) => DataRow(
                cells: [
                  DataCell(Text(row.speciesLabel)),
                  DataCell(Text(row.startDateLabel)),
                  DataCell(Text('${row.liveCount}/${row.startingCount}'.tr)),
                  DataCell(Text('${row.survivalPercent.toStringAsFixed(0)}%'.tr)),
                  DataCell(Text(_formatGrams(row.totalFeedGrams))),
                  DataCell(Text(_formatGrams(row.harvestWeightGrams))),
                  DataCell(Text(row.statusLabel)),
                ],
              ),
            )
            .toList(),
      ),
    );
  }

  static String _formatGrams(double grams) {
    if (grams == 0) return '—';
    if (grams >= 1000) return '${(grams / 1000).toStringAsFixed(1)} kg';
    return '${grams.round()} g';
  }
}

Widget _emptyState(String message) {
  return Container(
    height: 120,
    alignment: Alignment.center,
    padding: EdgeInsets.all(16),
    child: Text(
      message,
      style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
      textAlign: TextAlign.center,
    ),
  );
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        SizedBox(width: 6),
        Text(label, style: GoogleFonts.poppins(fontSize: 12)),
      ],
    );
  }
}
