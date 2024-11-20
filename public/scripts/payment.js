function processPayment() {
    const upiId = document.getElementById('upi-id').value;
    const amount = document.getElementById('amount').value;
    const statusMessage = document.getElementById('status-message');

    if (!upiId || !amount) {
        statusMessage.textContent = 'Please fill in all fields.';
        statusMessage.style.color = 'red';
        return;
    }

    // Dummy payment processing
    statusMessage.textContent = `Processing payment of ₹${amount} to ${upiId}...`;
    statusMessage.style.color = 'green';

    // Simulate payment success after a delay
    setTimeout(() => {
        statusMessage.textContent = `Payment of ₹${amount} to ${upiId} successful!`;
        statusMessage.style.color = 'green';
    }, 2000);
}
