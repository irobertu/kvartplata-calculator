import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';
import { getTheme } from '@/lib/theme';
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
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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

function ReadingRow({ label, prev, diff, unit, diffText }) {
  return (
    <div className="flex justify-between items-baseline text-sm py-1.5 border-b border-zinc-100 last:border-b-0">
      <span className="text-zinc-600">{label}</span>
      <span className="tabular-nums text-zinc-900">
        {prev != null ? (
          <>
            {prev}
            {diff != null && (
              <span className={`${diffText} ml-1.5`}>+{diff}</span>
            )}
            {unit && <span className="text-zinc-400 text-xs ml-1">{unit}</span>}
          </>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </span>
    </div>
  );
}

function ApartmentCard({ apartment, last, prev, theme }) {
  const b = calcBreakdown(apartment, last, prev);
  const date = formatDate(last?.created_at);

  return (
    <div className={`relative border ${theme.cardBorder} rounded-xl p-4 bg-white overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${theme.cardAccent}`} />

      <ApartmentEdit apartment={apartment} />

      <div className="text-xs text-zinc-500 mt-3">
        {date ? `Последняя сдача: ${date}` : 'Показаний пока нет'}
      </div>

      <div className="mt-3 space-y-0">
        <ReadingRow
          label="Электроэнергия"
          prev={last?.electricity}
          diff={b?.el}
          unit="кВт·ч"
          diffText={theme.diffText}
        />
        <ReadingRow
          label="Холодная вода"
          prev={last?.cold_water}
          diff={b?.cw}
          unit="м³"
          diffText={theme.diffText}
        />
        <ReadingRow
          label="Горячая вода"
          prev={last?.hot_water}
          diff={b?.hw}
          unit="м³"
          diffText={theme.diffText}
        />
        <ReadingRow
          label="Водоотведение"
          prev={b ? b.sewage : null}
          diff={null}
          unit="м³"
          diffText={theme.diffText}
        />
      </div>

      <div className={`mt-3 ${theme.payBg} rounded-lg p-3 flex items-baseline justify-between`}>
        <span className="text-sm text-zinc-700">К оплате:</span>
        <span className={`text-lg font-semibold ${theme.payText} tabular-nums`}>
          {b ? `${formatMoney(b.total)} ₽` : '—'}
        </span>
      </div>

      <a
        href={`/apt/${apartment.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-3 block text-center text-sm ${theme.payText} hover:opacity-80 ${theme.payBg} py-2 rounded-lg transition`}
      >
        Открыть страницу квартиранта ↗
      </a>
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
    <div className="min-h-screen bg-zinc-50 py-6 sm:py-10 px-3 sm:px-4">
      <main className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-4 sm:p-8">
        <h1 className="text-xl sm:text-3xl font-semibold text-zinc-900 mb-1">
          Админка
        </h1>
        <p className="text-zinc-500 mb-6 text-sm">
          Тарифы по каждому ЖК и показания всех студий.
        </p>

        <div className="space-y-8 sm:space-y-10">
          {[...groups.entries()].map(([complex, apts]) => {
            const theme = getTheme(complex);
            const first = apts[0];
            const initial = {
              electricity: first.tariff_electricity,
              cold_water: first.tariff_cold_water,
              hot_water: first.tariff_hot_water,
              sewage: first.tariff_sewage,
            };
            return (
              <section key={complex}>
                <h2 className={`text-lg sm:text-xl font-semibold ${theme.headingText} mb-3`}>
                  ЖК «{complex}»
                </h2>
                <div className="mb-4">
                  <TariffForm complex={complex} initial={initial} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {apts.map((apt) => (
                    <ApartmentCard
                      key={apt.id}
                      apartment={apt}
                      last={lastByApt[apt.id]}
                      prev={prevByApt[apt.id]}
                      theme={theme}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <div className="font-medium mb-1">
            Перед отправкой ссылок квартирантам
          </div>
          <p>
            Откройте страницу каждого квартиранта и введите{' '}
            <strong>текущие показания счётчиков как «Стало»</strong>. Они
            сохранятся, и в следующем месяце квартиранты увидят их в поле «Было».
          </p>
        </div>
      </main>
    </div>
  );
}
