export function createCheckout() {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/checkout`;

  console.log("🔥 Redirecting to:", url);

  // 🔥 DIRECT REDIRECT (NO FETCH)
  window.location.href = url;
}