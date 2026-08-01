// Temporary placeholder for routes being built out in later phases.
// Keeps the nav functional (no 404s) while content is filled in.
export default function PageStub({
  eyebrow = "Free Flow Fitness",
  title,
  note,
}: {
  eyebrow?: string;
  title: string;
  note: string;
}) {
  return (
    <main className="page">
      <div className="wrap">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="page-title">{title}</h1>
        <p className="page-note">{note}</p>
      </div>
    </main>
  );
}
