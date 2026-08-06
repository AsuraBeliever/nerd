import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-xl font-semibold">Esto no existe</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        La página que buscas no está aquí, o no es tuya.
      </p>
      <div className="mt-6">
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
