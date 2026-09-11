enum PaymentStatus {
  pending('Pending'),
  settled('Settled');

  const PaymentStatus(this.label);

  final String label;
}
