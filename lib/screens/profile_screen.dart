import 'package:flutter/material.dart';

import 'package:google_fonts/google_fonts.dart';



import '../utils/kalro_formatters.dart';



import '../components/components.dart';

import '../models/profile_summary.dart';

import '../models/farm_profile.dart';

import '../services/app_repositories.dart';

import '../services/notification_service.dart';

import '../services/permission_service.dart';

import '../services/profile_service.dart';

import '../services/user_preferences.dart';

import '../theme/kalro_colors.dart';

import 'admin_hub_screen.dart';

import 'farmer_hub_screen.dart';

import 'reports_screen.dart';
import 'package:kalro/l10n/translator.dart';



class ProfileScreen extends StatefulWidget {

  ProfileScreen({

    super.key,

    required this.repositories,

    required this.userPreferences,

    required this.session,

    this.notificationService,

    this.onDataChanged,

    this.onFarmUpdated,

    this.onLogout,

    this.onNavigateToTab,

  });



  final AppRepositories repositories;

  final UserPreferences userPreferences;

  final UserSession session;

  final NotificationService? notificationService;

  final VoidCallback? onDataChanged;

  final ValueChanged<FarmProfile>? onFarmUpdated;

  final VoidCallback? onLogout;

  final ValueChanged<int>? onNavigateToTab;



  @override

  State<ProfileScreen> createState() => _ProfileScreenState();

}



class _ProfileScreenState extends State<ProfileScreen> {

  final _profileService = ProfileService();

  static const _permissions = PermissionService();

  late Future<ProfileSummary> _profileFuture;



  bool get _isAdmin => _permissions.canManageUsers(widget.session.user);



  @override

  void initState() {

    super.initState();

    _reload();

  }



  void _reload() {

    setState(() {

      _profileFuture = _profileService.load(

        repositories: widget.repositories,

        userPreferences: widget.userPreferences,

      );

    });

  }



  Future<void> _editProfile(ProfileSummary profile) async {

    final nameController = TextEditingController(text: profile.name);

    final orgController = TextEditingController(text: profile.org);



    final saved = await showDialog<bool>(

      context: context,

      builder: (context) {

        return AlertDialog(

          title: Text(_isAdmin ? 'Edit profile' : 'Edit my name'),

          content: Column(

            mainAxisSize: MainAxisSize.min,

            children: [

              TextField(

                controller: nameController,

                decoration: InputDecoration(labelText: 'Display name'),

              ),

              if (_isAdmin) ...[

                SizedBox(height: 12),

                TextField(

                  controller: orgController,

                  decoration: InputDecoration(labelText: 'Organization'),

                ),

              ],

            ],

          ),

          actions: [

            TextButton(

              onPressed: () => Navigator.of(context).pop(false),

              child: Text('Cancel'.tr),

            ),

            TextButton(

              onPressed: () => Navigator.of(context).pop(true),

              child: Text('Save'.tr),

            ),

          ],

        );

      },

    );



    if (saved != true) return;



    await widget.userPreferences.updateProfile(

      name: nameController.text,

      orgName: _isAdmin ? orgController.text : null,

    );

    _reload();

  }



  void _openAdminHub() {

    Navigator.of(context).push(

      MaterialPageRoute(

        builder: (_) => AdminHubScreen(

          session: widget.session,

          repositories: widget.repositories,

          userPreferences: widget.userPreferences,

          notificationService: widget.notificationService,

          onDataChanged: widget.onDataChanged,

          onFarmUpdated: widget.onFarmUpdated,

        ),

      ),

    ).then((_) => _reload());

  }



  void _openFarmerHub() {

    Navigator.of(context).push(

      MaterialPageRoute(

        builder: (_) => FarmerHubScreen(

          session: widget.session,

          repositories: widget.repositories,

          userPreferences: widget.userPreferences,

          notificationService: widget.notificationService,

          onNavigateToTab: widget.onNavigateToTab,

        ),

      ),

    ).then((_) => _reload());

  }



  void _openReports() {

    Navigator.of(context).push(

      MaterialPageRoute(

        builder: (_) => ReportsScreen(

          repositories: widget.repositories,

          userPreferences: widget.userPreferences,

        ),

      ),

    );

  }



  void _showComingSoon(String feature) {

    ScaffoldMessenger.of(context).showSnackBar(

      SnackBar(content: Text('$feature coming soon'.tr)),

    );

  }



  String _formatFeed(double grams) {

    if (grams >= 1000) return '${(grams / 1000).toStringAsFixed(1)} kg';

    return '${grams.round()} g';

  }



  @override

  Widget build(BuildContext context) {

    return KalroBackground(

      child: SafeArea(

        child: AsyncContent(

          future: _profileFuture,

          builder: (context, profile) {

            return RefreshIndicator(

              onRefresh: () async => _reload(),

              child: ListView(

                padding: EdgeInsets.fromLTRB(0, 8, 0, 24),

                children: [

                  _buildHeader(profile),

                  SizedBox(height: 20),

                  if (_isAdmin)

                    _buildAdminStats(profile)

                  else

                    _buildFarmerStats(profile),

                  Divider(height: 32),

                  if (_isAdmin) ..._buildAdminMenu() else ..._buildFarmerMenu(),

                  ..._buildCommonFooter(profile),

                ],

              ),

            );

          },

        ),

      ),

    );

  }



  Widget _buildHeader(ProfileSummary profile) {

    final permission = widget.session.user.permission;



    return Column(

      children: [

        Padding(

          padding: EdgeInsets.symmetric(horizontal: 8),

          child: Row(

            children: [

              SizedBox(width: 48),

              Spacer(),

              IconButton(

                onPressed: () => _editProfile(profile),

                icon: Icon(Icons.edit_outlined),

              ),

            ],

          ),

        ),

        Padding(

          padding: EdgeInsets.symmetric(horizontal: 20),

          child: ProfileHeader(

            orgName: profile.org,

            displayName: widget.session.user.displayName,

            userId: profile.id,

          ),

        ),

        Padding(

          padding: EdgeInsets.fromLTRB(20, 8, 20, 0),

          child: Row(

            children: [

              PermissionBadge(permission: permission, compact: true),

              SizedBox(width: 8),

              Expanded(

                child: Text(

                  _isAdmin

                      ? 'Farm manager · Sync ${widget.session.farm.syncCode}'

                      : '${profile.role.label} · ${profile.org}',

                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),

                ),

              ),

            ],

          ),

        ),

      ],

    );

  }



  Widget _buildAdminStats(ProfileSummary profile) {

    final currency = KalroFormatters.currency;



    return Padding(

      padding: EdgeInsets.symmetric(horizontal: 20),

      child: Column(

        children: [

          Text(

            'Farm operations',

            style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),

          ),

          SizedBox(height: 12),

          Row(

            children: [

              Expanded(

                child: PaymentSummaryCard(

                  title: 'Active Batches'.tr,

                  value: profile.activeBatchCount.toString(),

                  icon: Icons.layers_outlined,

                ),

              ),

              SizedBox(width: 12),

              Expanded(

                child: PaymentSummaryCard(

                  title: 'Purchases'.tr,

                  value: profile.totalPurchases.toString(),

                  icon: Icons.shopping_bag_outlined,

                ),

              ),

            ],

          ),

          SizedBox(height: 12),

          Row(

            children: [

              Expanded(

                child: PaymentSummaryCard(

                  title: 'Payables'.tr,

                  value: currency.format(profile.pendingPayables),

                  icon: Icons.payments_outlined,

                ),

              ),

              SizedBox(width: 12),

              Expanded(

                child: PaymentSummaryCard(

                  title: 'Feed Logged'.tr,

                  value: _formatFeed(profile.totalFeedGrams),

                  icon: Icons.restaurant_outlined,

                ),

              ),

            ],

          ),

        ],

      ),

    );

  }



  Widget _buildFarmerStats(ProfileSummary profile) {

    return Padding(

      padding: EdgeInsets.symmetric(horizontal: 20),

      child: Column(

        children: [

          Text(

            'My rearing snapshot',

            style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),

          ),

          SizedBox(height: 12),

          StockSplitRow(

            leftTitle: 'Bombyx Stock',

            leftValue: '${profile.bombyxLarvaeCount} larvae',

            rightTitle: 'Eri Stock',

            rightValue: '${profile.eriLarvaeCount} larvae',

          ),

          SizedBox(height: 12),

          Row(

            children: [

              Expanded(

                child: PaymentSummaryCard(

                  title: 'Active Batches'.tr,

                  value: profile.activeBatchCount.toString(),

                  icon: Icons.layers_outlined,

                ),

              ),

              SizedBox(width: 12),

              Expanded(

                child: PaymentSummaryCard(

                  title: 'Feed Logged'.tr,

                  value: _formatFeed(profile.totalFeedGrams),

                  icon: Icons.restaurant_outlined,

                ),

              ),

            ],

          ),

        ],

      ),

    );

  }



  List<Widget> _buildAdminMenu() {

    return [

      Padding(

        padding: EdgeInsets.fromLTRB(20, 0, 20, 8),

        child: Text(

          'Farm management',

          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),

        ),

      ),

      KalroMenuTile(

        icon: Icons.admin_panel_settings_outlined,

        title: 'Farm management hub'.tr,

        onTap: _openAdminHub,

      ),

      KalroMenuTile(

        icon: Icons.show_chart,

        title: 'Reports & exports'.tr,

        onTap: _openReports,

      ),

    ];

  }



  List<Widget> _buildFarmerMenu() {

    final canEdit = _permissions.canEditData(widget.session.user);



    return [

      Padding(

        padding: EdgeInsets.fromLTRB(20, 0, 20, 8),

        child: Text(

          'My work',

          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),

        ),

      ),

      KalroMenuTile(

        icon: Icons.agriculture_outlined,

        title: 'My farm work'.tr,

        onTap: _openFarmerHub,

      ),

      KalroMenuTile(

        icon: Icons.show_chart,

        title: 'Reports'.tr,

        onTap: _openReports,

      ),

      if (canEdit) ...[

        Divider(height: 32),

        Padding(

          padding: EdgeInsets.fromLTRB(20, 0, 20, 8),

          child: Text(

            'Help',

            style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),

          ),

        ),

        KalroMenuTile(

          icon: Icons.menu_book_outlined,

          title: 'Field guides'.tr,

          onTap: () => _showComingSoon('Field guides'),

        ),

        KalroMenuTile(

          icon: Icons.help_outline,

          title: 'FAQs'.tr,

          onTap: () => _showComingSoon('FAQs'),

        ),

        KalroMenuTile(

          icon: Icons.support_agent,

          title: 'Support'.tr,

          onTap: () => _showComingSoon('Support'),

        ),

      ],

    ];

  }



  List<Widget> _buildCommonFooter(ProfileSummary profile) {

    return [

      if (_isAdmin) ...[

        Divider(height: 32),

        KalroMenuTile(

          icon: Icons.description_outlined,

          title: 'Terms & Conditions'.tr,

          onTap: () => _showComingSoon('Terms & Conditions'),

        ),

        KalroMenuTile(

          icon: Icons.lock_outline,

          title: 'Privacy Policy'.tr,

          onTap: () => _showComingSoon('Privacy Policy'),

        ),

      ],

      if (widget.onLogout != null)

        KalroMenuTile(

          icon: Icons.logout,

          title: 'Sign out'.tr,

          onTap: widget.onLogout!,

        ),

      Padding(

        padding: EdgeInsets.all(20),

        child: Text(

          _isAdmin

              ? 'Administrator · ${profile.language}'

              : '${profile.role.label} · ${profile.language}',

          style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),

        ),

      ),

    ];

  }

}


