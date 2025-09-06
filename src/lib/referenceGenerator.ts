let lastPaymentId = 0;


export function generatePaymentReference(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // Reset counter if it's a new day
  const today = now.toDateString();
  const lastRun = localStorage.getItem('lastPaymentRefDate');
  
  if (lastRun !== today) {
    lastPaymentId = 0;
    localStorage.setItem('lastPaymentRefDate', today);
  }
  
  // Increment and format the sequential number
  lastPaymentId++;
  const seqNumber = lastPaymentId.toString().padStart(4, '0');
  
  return `PAY-${datePart}-${seqNumber}`;
}

// Initialize lastPaymentId from localStorage if available
try {
  const storedCount = localStorage.getItem('lastPaymentRefCount');
  if (storedCount) {
    lastPaymentId = parseInt(storedCount, 10) || 0;
  }
} catch (e) {
  console.warn('Failed to load last payment reference count', e);
}
