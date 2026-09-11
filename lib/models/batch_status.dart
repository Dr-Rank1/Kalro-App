enum BatchStatus {
  active('Active'),
  mounting('Mounting'),
  cocooning('Cocooning'),
  harvested('Harvested'),
  closed('Closed');

  const BatchStatus(this.label);

  final String label;
}
