import type { Metadata } from "next";
import { DeleteAccount } from "@/components/delete-account/DeleteAccount";
import { Footer } from "@/components/footer/Footer";
import { UserHeader } from "@/components/header/UserHeader";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Configurações da conta · sawa",
};

/** Configurações da conta, aberta pelo ícone de usuário no menu. */
export default function AccountSettingsPage() {
  return (
    <div className={styles.page}>
      <UserHeader />
      <main className={styles.main}>
        <DeleteAccount />
      </main>
      <Footer />
    </div>
  );
}
