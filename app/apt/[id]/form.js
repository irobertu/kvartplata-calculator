'use client';

import { useState, useTransition } from 'react';
import { submitReading } from '@/lib/actions';
import { getTheme } from '@/lib/theme';

function formatMoney(value) {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toNum(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function MeterRow({ title, unit, tariff, prev, curr, onCurrChange, prevName, theme }) {
  return (
    <div className={`border ${theme.cardBorder} rounded-xl p-3 sm:p-4`}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
        <span className="font-medium text-zinc-900">{title}</span>
        <span className="text-xs text-zinc-500">
          Тариф: {tariff} ₽/{unit}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">
            Было (прошлый раз)
          </label>
          <div className="w-full px-3 py-2.5 border border-zinc-200 bg-zinc-50 rounded-lg text-zinc-700 tabular-nums text-base">
            {prev ?? '—'}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">
            Стало (сейчас)
          </label>
          <input
            name={prevName}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={curr}
            onChange={(e) => onCurrChange(e.target.value)}
            required
            className={`w-full px-3 py-2.5 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 ${theme.focusRing} text-zinc-900 bg-white text-base`}
          />
        </div>
      </div>
    </div>
  );
}

export default function ApartmentForm({ apartment, lastReading }) {
  const [elCurr, setElCurr] = useState('');
  const [cwCurr, setCwCurr] = useState('');
  const [hwCurr, setHwCurr] = useState('');
  const [status, setStatus] = useState(null);
  const [pending, startTransition] = useTransition();
  const theme = getTheme(apartment.complex);

  const elPrev = lastReading?.electricity ?? null;
  const cwPrev = lastReading?.cold_water ?? null;
  const hwPrev = lastReading?.hot_water ?? null;

  const elT = Number(apartment.tariff_electricity);
  const cwT = Number(apartment.tariff_cold_water);
  const hwT = Number(apartment.tariff_hot_water);
  const seT = Number(apartment.tariff_sewage);

  const el = Math.max(0, toNum(elCurr) - toNum(elPrev ?? 0));
  const cw = Math.max(0, toNum(cwCurr) - toNum(cwPrev ?? 0));
  const hw = Math.max(0, toNum(hwCurr) - toNum(hwPrev ?? 0));
  const sewage = cw + hw;

  const elSum = el * elT;
  const cwSum = cw * cwT;
  const hwSum = hw * hwT;
  const sewageSum = sewage * seT;
  const total = elSum + cwSum + hwSum + sewageSum;

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus(null);
    const fd = new FormData();
    fd.set('electricity', elCurr);
    fd.set('cold_water', cwCurr);
    fd.set('hot_water', hwCurr);

    startTransition(async () => {
      const res = await submitReading(apartment.id, fd);
      if (res.ok) {
        setStatus({ type: 'ok', msg: 'Показания сохранены. Спасибо!' });
        setElCurr('');
        setCwCurr('');
        setHwCurr('');
      } else {
        setStatus({ type: 'err', msg: res.error });
      }
    });
  };

  const headerParts = [];
  if (apartment.complex) headerParts.push(`ЖК «${apartment.complex}»`);
  if (apartment.apt_number != null) headerParts.push(`Студия ${apartment.apt_number}`);
  const subheader = headerParts.join(' · ');
  const title = apartment.tenant_name || apartment.name || 'Квартирант';

  return (
    <div className="min-h-screen bg-zinc-50 py-6 sm:py-10 px-3 sm:px-4">
      <main className={`relative max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-4 sm:p-8 overflow-hidden`}>
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.cardAccent}`} />
        {subheader && (
          <div className={`text-xs uppercase tracking-wide ${theme.headingText} mb-1 font-medium`}>
            {subheader}
          </div>
        )}
        <h1 className="text-xl sm:text-3xl font-semibold text-zinc-900 mb-1">
          {title}
        </h1>
        <p className="text-zinc-500 mb-5 sm:mb-6 text-sm">
          {lastReading
            ? `Прошлые показания от ${formatDate(lastReading.created_at)}. Введите текущие — итог посчитается сам.`
            : 'Прошлых показаний ещё нет. Просто введите текущие — в следующий раз они подставятся как «Было».'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <MeterRow
            title="Электроэнергия"
            unit="кВт·ч"
            tariff={elT}
            prev={elPrev}
            curr={elCurr}
            onCurrChange={setElCurr}
            prevName="electricity"
            theme={theme}
          />
          <MeterRow
            title="Холодная вода"
            unit="м³"
            tariff={cwT}
            prev={cwPrev}
            curr={cwCurr}
            onCurrChange={setCwCurr}
            prevName="cold_water"
            theme={theme}
          />
          <MeterRow
            title="Горячая вода"
            unit="м³"
            tariff={hwT}
            prev={hwPrev}
            curr={hwCurr}
            onCurrChange={setHwCurr}
            prevName="hot_water"
            theme={theme}
          />

          <div className={`border ${theme.cardBorder} rounded-xl p-3 sm:p-4`}>
            <div className="font-medium text-zinc-900">Водоотведение</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Объём = ХВ + ГВ = {sewage.toLocaleString('ru-RU')} м³ ·
              тариф {seT} ₽/м³
            </div>
          </div>

          <div className="mt-5 sm:mt-6 border-t border-zinc-200 pt-5 sm:pt-6 space-y-2 text-sm">
            <Line name={`Электроэнергия: ${el} × ${elT}`} value={elSum} />
            <Line name={`Холодная вода: ${cw} × ${cwT}`} value={cwSum} />
            <Line name={`Горячая вода: ${hw} × ${hwT}`} value={hwSum} />
            <Line name={`Водоотведение: ${sewage} × ${seT}`} value={sewageSum} />
          </div>

          <div className={`mt-4 ${theme.payBg} rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3`}>
            <span className="text-zinc-700 font-medium">Итого:</span>
            <span className={`text-xl sm:text-2xl font-semibold ${theme.payText} tabular-nums whitespace-nowrap`}>
              {formatMoney(total)} ₽
            </span>
          </div>

          {status && (
            <div
              className={`rounded-lg p-3 text-sm ${
                status.type === 'ok'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {status.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className={`w-full py-3 rounded-lg ${theme.button} text-white font-medium transition disabled:opacity-50`}
          >
            {pending ? 'Сохраняю…' : 'Отправить показания'}
          </button>
        </form>
      </main>
    </div>
  );
}

function Line({ name, value }) {
  return (
    <div className="flex justify-between gap-3 text-zinc-700">
      <span className="break-words">{name}</span>
      <span className="tabular-nums whitespace-nowrap">{formatMoney(value)} ₽</span>
    </div>
  );
}
