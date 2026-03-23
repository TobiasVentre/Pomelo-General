import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import { resolveAdminSession } from "../../lib/admin-session";

interface AdminLoginPageProps {
  initialError: string | null;
}

export default function AdminLoginPage({
  initialError
}: AdminLoginPageProps): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pomelo.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password })
    });

    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(data.message ?? "No se pudo iniciar sesion");
      setIsSubmitting(false);
      return;
    }

    await router.push("/admin");
  };

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-90px)] max-w-[1400px] items-center px-5 py-16 md:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[32px] border border-[#ddd4c8] bg-[linear-gradient(135deg,#f8f2e8_0%,#efe4d4_100%)] p-8 md:p-12">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7a7167]">
              Acceso interno
            </p>
            <h1 className="mt-3 font-display text-4xl text-[#1f1b16] md:text-6xl">
              Admin Pomelo
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[#5b5249] md:text-base">
              Inicia sesion con un usuario administrador de AuthMS para gestionar
              colecciones y productos del catalogo.
            </p>
            <div className="mt-8 rounded-2xl border border-[#d8ccbd] bg-white/70 p-5 text-sm text-[#4f473f]">
              <p className="font-medium text-[#1f1b16]">Necesario para entrar</p>
              <p className="mt-2">
                La cuenta debe tener rol <code>Admin</code> y un token valido emitido por AuthMS.
              </p>
            </div>
          </article>

          <article className="rounded-[28px] border border-[#ddd4c8] bg-white p-6 shadow-[0_30px_80px_rgba(35,26,19,0.08)] md:p-8">
            <p className="text-xs uppercase tracking-[0.16em] text-[#7a7167]">Login</p>
            <h2 className="mt-2 font-display text-3xl text-[#1f1b16]">Sesion de administrador</h2>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-[#4f473f]">
                <span>Email</span>
                <input
                  type="email"
                  className="rounded-xl border border-[#d9d0c3] px-4 py-3 text-sm outline-none transition focus:border-[#1f1b16]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="grid gap-2 text-sm text-[#4f473f]">
                <span>Password</span>
                <input
                  type="password"
                  className="rounded-xl border border-[#d9d0c3] px-4 py-3 text-sm outline-none transition focus:border-[#1f1b16]"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              {error ? (
                <p className="rounded-xl border border-[#efc4b4] bg-[#fff4ef] px-4 py-3 text-sm text-[#9a3412]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="mt-2 rounded-xl bg-[#1f1b16] px-4 py-3 text-sm font-medium text-white disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Ingresando..." : "Ingresar al admin"}
              </button>
            </form>
          </article>
        </div>
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<AdminLoginPageProps> = async (
  context
) => {
  const session = await resolveAdminSession(context.req, context.res);

  if (session) {
    return {
      redirect: {
        destination: "/admin",
        permanent: false
      }
    };
  }

  return {
    props: {
      initialError: null
    }
  };
};
