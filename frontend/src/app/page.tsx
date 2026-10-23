export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">AMANA</h1>
      <p className="mt-2 text-gray-600">Secure device registration and second-hand transaction safety.</p>
      <nav className="mt-6 flex gap-4">
        <a className="underline" href="/login">Login</a>
        <a className="underline" href="/register">Register</a>
        <a className="underline" href="/lookup">Device lookup</a>
      </nav>
    </main>
  );
}
