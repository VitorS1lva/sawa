import { AuthForm } from "@/components/auth-form/AuthForm";
import { accountPanel } from "./AccountPanel.configs";

export function AccountPanel() {
  return <AuthForm config={accountPanel} />;
}
