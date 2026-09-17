import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../l10n/translator.dart';
import '../../models/app_user.dart';
import '../../theme/kalro_colors.dart';

class FarmTeamStrip extends StatelessWidget {
  const FarmTeamStrip({
    super.key,
    required this.members,
    required this.currentUserId,
    this.onManage,
  });

  final List<AppUser> members;
  final String currentUserId;
  final VoidCallback? onManage;

  @override
  Widget build(BuildContext context) {
    final countLabel = members.length == 1
        ? 'Only you on this farm'.tr
        : Translator.fill('{n} people', {'n': '${members.length}'});
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onManage,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: KalroColors.divider),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'People on this farm'.tr,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                    ),
                  ),
                  Text(
                    countLabel,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: KalroColors.textMuted,
                    ),
                  ),
                  if (onManage != null)
                    const Icon(Icons.chevron_right, color: KalroColors.textLight),
                ],
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 64,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: members.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final member = members[index];
                    final you = member.id == currentUserId;
                    return SizedBox(
                      width: 72,
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor:
                                KalroColors.primaryGreen.withValues(alpha: 0.12),
                            child: Text(
                              _initials(member.farmerFacingName),
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: KalroColors.primaryGreen,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            you ? 'You'.tr : member.farmerFacingName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(fontSize: 11),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first.substring(0, 1)}${parts.last.substring(0, 1)}'
        .toUpperCase();
  }
}
