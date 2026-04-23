import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';
import ApartmentForm from './form';

export const dynamic = 'force-dynamic';

export default async function ApartmentPage({ params }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: apartment } = await supabase
    .from('apartments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!apartment) notFound();

  const { data: lastReading } = await supabase
    .from('readings')
    .select('*')
    .eq('apartment_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <ApartmentForm
      apartment={apartment}
      lastReading={lastReading ?? null}
    />
  );
}
