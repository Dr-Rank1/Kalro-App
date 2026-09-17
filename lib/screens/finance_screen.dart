import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../services/app_repositories.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'payments_screen.dart';
import 'purchase_screen.dart';
import 'package:kalro/l10n/translator.dart';

class FinanceScreen extends StatelessWidget {
  FinanceScreen({
    super.key,
    required this.repositories,
    required this.userPreferences,
    this.readOnly = false,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final bool readOnly;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: KalroBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: KalroToolbar(
                  title: 'Finance'.tr,
                  subtitle: 'Payments, receivables, and seed purchases.'.tr,
                ),
              ),
              TabBar(
                labelColor: KalroColors.headerGreen,
                unselectedLabelColor: KalroColors.textMuted,
                indicatorColor: KalroColors.headerGreen,
                labelStyle: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                tabs: [
                  Tab(text: 'Payments'),
                  Tab(text: 'Purchases'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    PaymentsScreen(
                      repositories: repositories,
                      userPreferences: userPreferences,
                      readOnly: readOnly,
                      showToolbar: false,
                    ),
                    PurchaseScreen(
                      repositories: repositories,
                      userPreferences: userPreferences,
                      readOnly: readOnly,
                      showToolbar: false,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
