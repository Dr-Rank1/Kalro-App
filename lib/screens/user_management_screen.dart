import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/account_permission.dart';
import '../models/app_user.dart';
import '../models/farm_profile.dart';
import '../services/auth_repository.dart';
import '../services/pin_hasher.dart';
import '../theme/kalro_colors.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({
    super.key,
    required this.session,
    this.authRepository,
  });

  final UserSession session;
  final AuthRepository? authRepository;

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  late final AuthRepository _auth;
  late Future<List<AppUser>> _usersFuture;

  @override
  void initState() {
    super.initState();
    _auth = widget.authRepository ?? AuthRepository();
    _reload();
  }

  void _reload() {
    setState(() {
      _usersFuture = _auth.getUsers(widget.session.farm.id);
    });
  }

  Future<void> _addUser() async {
    final usernameController = TextEditingController();
    final nameController = TextEditingController();
    final pinController = TextEditingController();
    var permission = AccountPermission.caretaker;

    final saved = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: const Text('Add team member'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: usernameController,
                      decoration: const InputDecoration(labelText: 'Username'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(labelText: 'Display name'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: pinController,
                      decoration: const InputDecoration(labelText: 'PIN (4+ digits)'),
                      obscureText: true,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<AccountPermission>(
                      initialValue: permission,
                      decoration: const InputDecoration(labelText: 'Permission'),
                      items: AccountPermission.values
                          .map(
                            (p) => DropdownMenuItem(value: p, child: Text(p.label)),
                          )
                          .toList(),
                      onChanged: (value) {
                        if (value != null) setModalState(() => permission = value);
                      },
                    ),
                    const SizedBox(height: 12),
                    PermissionDescriptionCard(permission: permission),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                TextButton(
                  onPressed: () async {
                    final pin = pinController.text.trim();
                    if (usernameController.text.trim().isEmpty ||
                        nameController.text.trim().isEmpty ||
                        pin.length < 4) {
                      return;
                    }
                    try {
                      await _auth.createUser(
                        farmId: widget.session.farm.id,
                        username: usernameController.text,
                        displayName: nameController.text,
                        pin: pin,
                        permission: permission,
                      );
                      if (context.mounted) Navigator.pop(context, true);
                    } catch (error) {
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('$error')),
                      );
                    }
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );

    usernameController.dispose();
    nameController.dispose();
    pinController.dispose();

    if (saved == true) _reload();
  }

  Future<void> _resetPin(AppUser user) async {
    final pinController = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Reset PIN for ${user.displayName}'),
        content: TextField(
          controller: pinController,
          decoration: const InputDecoration(labelText: 'New PIN (4+ digits)'),
          obscureText: true,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              if (pinController.text.trim().length >= 4) {
                Navigator.pop(context, true);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (saved == true) {
      await _auth.updateUser(
        user.copyWith(pinHash: PinHasher.hashPin(pinController.text.trim())),
      );
      _reload();
    }
    pinController.dispose();
  }

  Future<void> _changePermission(AppUser user) async {
    var permission = user.permission;
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: Text('Change role for ${user.displayName}'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<AccountPermission>(
                    initialValue: permission,
                    decoration: const InputDecoration(labelText: 'Permission'),
                    items: AccountPermission.values
                        .map((p) => DropdownMenuItem(value: p, child: Text(p.label)))
                        .toList(),
                    onChanged: (value) {
                      if (value != null) setModalState(() => permission = value);
                    },
                  ),
                  const SizedBox(height: 12),
                  PermissionDescriptionCard(permission: permission),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );

    if (saved == true && permission != user.permission) {
      await _auth.updateUser(user.copyWith(permission: permission));
      _reload();
    }
  }

  Future<void> _deactivateUser(AppUser user) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Remove ${user.displayName}?'),
        content: const Text(
          'This deactivates the account. They will no longer be able to sign in.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _auth.deactivateUser(widget.session.farm.id, user.id);
      _reload();
    }
  }

  void _showUserActions(AppUser user) {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.lock_reset),
                title: const Text('Reset PIN'),
                onTap: () {
                  Navigator.pop(context);
                  _resetPin(user);
                },
              ),
              ListTile(
                leading: const Icon(Icons.admin_panel_settings_outlined),
                title: const Text('Change role'),
                onTap: () {
                  Navigator.pop(context);
                  _changePermission(user);
                },
              ),
              ListTile(
                leading: Icon(Icons.person_remove_outlined, color: Colors.red.shade700),
                title: Text('Remove user', style: TextStyle(color: Colors.red.shade700)),
                onTap: () {
                  Navigator.pop(context);
                  _deactivateUser(user);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminPageScaffold(
      title: 'Team users',
      onRefresh: () async => _reload(),
      actions: [
        IconButton(onPressed: _addUser, icon: const Icon(Icons.person_add_outlined)),
      ],
      body: FutureBuilder<List<AppUser>>(
        future: _usersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          final users = snapshot.data ?? [];
          if (users.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.people_outline, size: 48, color: KalroColors.textMuted),
                    const SizedBox(height: 12),
                    Text(
                      'No team members yet',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Add caretakers or viewers to share farm access.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
                    ),
                    const SizedBox(height: 20),
                    KalroPrimaryButton(label: 'Add user', onPressed: _addUser),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: users.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final user = users[index];
              final isSelf = user.id == widget.session.user.id;
              return AdminInfoCard(
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: user.permission.badgeColor.withValues(alpha: 0.15),
                      child: Icon(user.permission.icon, color: user.permission.badgeColor, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  user.displayName,
                                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                                ),
                              ),
                              if (isSelf)
                                Text(
                                  'You',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    color: KalroColors.textMuted,
                                  ),
                                ),
                            ],
                          ),
                          Text(
                            '@${user.username}',
                            style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                          ),
                          const SizedBox(height: 6),
                          PermissionBadge(permission: user.permission, compact: true),
                        ],
                      ),
                    ),
                    if (!isSelf)
                      IconButton(
                        icon: const Icon(Icons.more_vert),
                        onPressed: () => _showUserActions(user),
                      ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
