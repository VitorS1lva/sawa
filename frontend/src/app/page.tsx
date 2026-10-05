import { Footer } from "@/components/footer/Footer";
import { LandingHeader } from "@/components/header/LandingHeader";
import { Hero } from "@/components/hero/Hero";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <LandingHeader />
      <main className={styles.main}>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
