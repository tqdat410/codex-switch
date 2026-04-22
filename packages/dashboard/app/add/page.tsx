import { AppShell } from '../components/app-shell';
import { AddForm } from './add-form';

export default function AddPage() {
  return (
    <AppShell
      title="Add an account"
      description="The OAuth flow runs in a dedicated terminal so the native Codex login experience stays intact. When it finishes, the new auth snapshot is copied into your vault."
    >
      <AddForm />
    </AppShell>
  );
}
