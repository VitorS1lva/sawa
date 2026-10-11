import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Footer } from "@/components/footer/Footer";
import { UserHeader } from "@/components/header/UserHeader";
import { RequireAuth } from "@/components/require-auth/RequireAuth";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Minha área · sawa",
};

/** Página para onde o usuário vai após o login. */
export default function UserPage() {
  return (
    <RequireAuth>
      <div className={styles.page}>
        <UserHeader />
        <main className={styles.main}>
          <Dashboard />
        </main>
        <Footer />
      </div>
    </RequireAuth>
  );
}
