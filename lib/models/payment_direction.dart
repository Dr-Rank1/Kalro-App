enum PaymentDirection {
  receivable('Receivable'),
  payable('Payable');

  const PaymentDirection(this.label);

  final String label;
}
