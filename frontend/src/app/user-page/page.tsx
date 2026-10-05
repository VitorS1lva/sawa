import type { Metadata } from "next";
import { Footer } from "@/components/footer/Footer";
import { UserHeader } from "@/components/header/UserHeader";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Minha área · sawa",
};

/** Página para onde o usuário vai após o login. Por enquanto só tem o menu. */
export default function UserPage() {
  return (
    <div className={styles.page}>
      <UserHeader />
      <main className={styles.main} />
      <Footer />
    </div>
  );
}
