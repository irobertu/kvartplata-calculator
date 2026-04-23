import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';
import TariffForm from './tariff-form';
import ApartmentEdit from './apartment-edit';

export const dynamic = 'force-dynamic';

function formatMoney(value) {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcBreakdown(apartment, curr, prev) {
  if (!curr) return null;
  const el = Math.max(0, Number(curr.electricity) - Number(prev?.electricity ?? 0));
  const cw = Math.max(0, Number(curr.cold_water) - Number(prev?.cold_water ?? 0));
  const hw = Math.max(0, Number(curr.hot_water) - Number(prev?.hot_water ?? 0));
  const sewage = cw + hw;
  const total =
    el * Number(apartment.tariff_electricity) +
    cw * Number(apartment.tariff_cold_water) +
    hw * Number(apartment.tariff_hot_water) +
    sewage * Number(apartment.tariff_sewage);
  return { el, cw, hw, sewage, total };
}

function ApartmentsTable({ apartments, lastByApt, prevByApt }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 border-b border-zinc-200">
            <th className="py-2 pr-3">Студия / Квартирант</th>
            <th className="py-2 pr-3">Дата</th>
            <th className="py-2 pr-3">Эл-во</th>
            <th className="py-2 pr-3">ХВ</th>
            <th className="py-2 pr-3">ГВ</th>
            <th className="py-2 pr-3">Водоотв.</th>
            <th className="py-2 pr-3">К оплате</th>
            <th className="py-2 pr-3">Ссылка</th>
          </tr>
        </thead>
        <tbody>
          {apartments.map((apt) => {
            const last = lastByApt[apt.id];
            const prev = prevByApt[apt.id];
            const b = calcBreakdown(apt, last, prev);
            return (
              <tr key={apt.id} className="border-b border-zinc-100 align-top">
                <td className="py-3 pr-3">
                  <ApartmentEdit apartment={apt} />
                </td>
                <td className="py-3 pr-3 text-zinc-600">
                  {formatDate(last?.created_at)}
                </td>
                <td className="py-3 pr-3 tabular-nums text-zinc-700">
                  {last ? `${last.electricity} (+${b.el})` : '—'}
                </td>
                <td className="py-3 pr-3 tabular-nums text-zinc-700">
                  {last ? `${last.cold_water} (+${b.cw})` : '—'}
                </td>
                <td className="py-3 pr-3 tabular-nums text-zinc-700">
                  {last ? `${last.hot_water} (+${b.hw})` : '—'}
                </td>
                <td className="py-3 pr-3 tabular-nums text-zinc-700">
                  {b ? `${b.sewage} м³` : '—'}
                </td>
                <td className="py-3 pr-3 tabular-nums font-semibold text-blue-700">
                  {b ? `${formatMoney(b.total)} ₽` : '—'}
                </td>
                <td className="py-3 pr-3">
                  <a
                    href={`/apt/${apt.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    /apt/{apt.id} ↗
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPage({ params }) {
  const { secret } = await params;
  const expected = process.env.ADMIN_SECRET;

  if (!expected || secret !== expected) {
    notFound();
  }

  const supabase = createSupabaseServerClient();

  const { data: apartments } = await supabase
    .from('apartments')
    .select('*')
    .order('complex')
    .order('apt_number');

  const aptIds = (apartments ?? []).map((a) => a.id);
  const { data: allReadings } = await supabase
    .from('readings')
    .select('*')
    .in('apartment_id', aptIds.length ? aptIds : ['__none__'])
    .order('created_at', { ascending: false });

  const lastByApt = {};
  const prevByApt = {};
  for (const r of allReadings ?? []) {
    if (!lastByApt[r.apartment_id]) {
      lastByApt[r.apartment_id] = r;
    } else if (!prevByApt[r.apartment_id]) {
      prevByApt[r.apartment_id] = r;
    }
  }

  const groups = new Map();
  for (const apt of apartments ?? []) {
    const key = apt.complex || 'Без ЖК';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(apt);
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <main className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 mb-1">
          Админка
        </h1>
        <p className="text-zinc-500 mb-6 text-sm">
          Тарифы по каждому ЖК, последние показания и сумма к оплате по каждой
          студии. Имя и номер студии можно править прямо здесь.
        </p>

        <div className="space-y-10">
          {[...groups.entries()].map(([complex, apts]) => {
            const first = apts[0];
            const initial = {
              electricity: first.tariff_electricity,
              cold_water: first.tariff_cold_water,
              hot_water: first.tariff_hot_water,
              sewage: first.tariff_sewage,
            };
            return (
              <section key={complex}>
                <h2 className="text-xl font-semibold text-zinc-900 mb-3">
                  ЖК «{complex}»
                </h2>
                <div className="mb-4">
                  <TariffForm complex={complex} initial={initial} />
                </div>
                <ApartmentsTable
                  apartments={apts}
                  lastByApt={lastByApt}
                  prevByApt={prevByApt}
                />
              </section>
            );
          })}
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <div className="font-medium mb-1">
            Перед отправкой ссылок квартирантам
          </div>
          <p>
            Откройте каждую ссылку из колонки «Ссылка» и введите там{' '}
            <strong>текущие показания счётчиков как «Стало»</strong>. Они
            сохранятся, и в следующем месяце квартиранты увидят их в поле «Было».
          </p>
        </div>
      </main>
    </div>
  );
}
