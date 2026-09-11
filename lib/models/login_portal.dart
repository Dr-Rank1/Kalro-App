enum LoginPortal {
  field('Field operations', 'Daily rearing, feeding, and batch work'),
  management('Farm management', 'Team, finance, backups, and farm settings');

  const LoginPortal(this.title, this.subtitle);

  final String title;
  final String subtitle;
}
