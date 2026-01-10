import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 40 }}>
      <h1>PrintShop System</h1>
      <p>Deployment OK</p>

      <Link href="/login">Go to Login</Link>
    </main>
  );
}
