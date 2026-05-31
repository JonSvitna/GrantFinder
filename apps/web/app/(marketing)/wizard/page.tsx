import { Disclaimer } from "@/components/disclaimer";
import { WizardForm } from "@/components/wizard-form";

export default function WizardPage() {
  return (
    <div style={{ display: "grid", gap: 20, margin: "24px auto", maxWidth: 820 }}>
      <WizardForm />
      <Disclaimer />
    </div>
  );
}
