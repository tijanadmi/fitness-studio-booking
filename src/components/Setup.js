export default function Setup() {
  return (
    <div className="notice" role="status">
      <strong>Povežite studio sa Supabase-om.</strong>
      <p>
        Zakazivanje još nije aktivno. Podesite promenljive iz .env.example i
        primenite SQL migracije prema README uputstvu. Nijedna rezervacija se
        trenutno ne čuva.
      </p>
    </div>
  );
}
