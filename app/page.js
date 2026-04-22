'use client';

import { useState, useEffect } from 'react';

const DEFAULT_TARIFFS = {
  electricity: 8.6,
  coldWater: 66.87,
  hotWater: 66.87,
  sewage: 52.48,
};

const STORAGE_KEY = 'kvartplata-tariffs';

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

function MeterRow({ title, unit, tariff, onTariffChange, prev, curr, onPrevChange, onCurrChange }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="font-medium text-zinc-900">{title}</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Тариф</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={tariff}
            onChange={(e) => onTariffChange(e.target.value)}
            className="w-24 px-2 py-1 border border-zinc-300 rounded-md text-right text-zinc-900 bg-white"
          />
          <span className="text-zinc-500">₽/{unit}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Было</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={prev}
            onChange={(e) => onPrevChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Стало</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={curr}
            onChange={(e) => onCurrChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTariffs({ ...DEFAULT_TARIFFS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tariffs));
    } catch {}
  }, [tariffs]);

  const setTariff = (key) => (value) => {
    setTariffs((prev) => ({ ...prev, [key]: value }));
  };

  const [elPrev, setElPrev] = useState('');
  const [elCurr, setElCurr] = useState('');
  const [cwPrev, setCwPrev] = useState('');
  const [cwCurr, setCwCurr] = useState('');
  const [hwPrev, setHwPrev] = useState('');
  const [hwCurr, setHwCurr] = useState('');

  const elT = toNum(tariffs.electricity);
  const cwT = toNum(tariffs.coldWater);
  const hwT = toNum(tariffs.hotWater);
  const seT = toNum(tariffs.sewage);

  const el = Math.max(0, toNum(elCurr) - toNum(elPrev));
  const cw = Math.max(0, toNum(cwCurr) - toNum(cwPrev));
  const hw = Math.max(0, toNum(hwCurr) - toNum(hwPrev));
  const sewage = cw + hw;

  const elSum = el * elT;
  const cwSum = cw * cwT;
  const hwSum = hw * hwT;
  const sewageSum = sewage * seT;
  const total = elSum + cwSum + hwSum + sewageSum;

  const resetReadings = () => {
    setElPrev(''); setElCurr('');
    setCwPrev(''); setCwCurr('');
    setHwPrev(''); setHwCurr('');
  };

  const resetTariffs = () => setTariffs(DEFAULT_TARIFFS);

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <main className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 mb-1">
          Расчёт коммуналки
        </h1>
        <p className="text-zinc-500 mb-6 text-sm">
          Введите показания счётчиков (Было → Стало). Тарифы можно править —
          они сохранятся в браузере.
        </p>

        <div className="space-y-4">
          <MeterRow
            title="Электроэнергия"
            unit="кВт·ч"
            tariff={tariffs.electricity}
            onTariffChange={setTariff('electricity')}
            prev={elPrev}
            curr={elCurr}
            onPrevChange={setElPrev}
            onCurrChange={setElCurr}
          />
          <MeterRow
            title="Холодная вода"
            unit="м³"
            tariff={tariffs.coldWater}
            onTariffChange={setTariff('coldWater')}
            prev={cwPrev}
            curr={cwCurr}
            onPrevChange={setCwPrev}
            onCurrChange={setCwCurr}
          />
          <MeterRow
            title="Горячая вода"
            unit="м³"
            tariff={tariffs.hotWater}
            onTariffChange={setTariff('hotWater')}
            prev={hwPrev}
            curr={hwCurr}
            onPrevChange={setHwPrev}
            onCurrChange={setHwCurr}
          />

          <div className="border border-zinc-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-medium text-zinc-900">Водоотведение</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                Объём = ХВ + ГВ = {sewage.toLocaleString('ru-RU')} м³
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Тариф</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={tariffs.sewage}
                onChange={(e) => setTariff('sewage')(e.target.value)}
                className="w-24 px-2 py-1 border border-zinc-300 rounded-md text-right text-zinc-900 bg-white"
              />
              <span className="text-zinc-500">₽/м³</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-200 pt-6 space-y-2 text-sm">
          <Line name={`Электроэнергия: ${el} × ${elT}`} value={elSum} />
          <Line name={`Холодная вода: ${cw} × ${cwT}`} value={cwSum} />
          <Line name={`Горячая вода: ${hw} × ${hwT}`} value={hwSum} />
          <Line name={`Водоотведение: ${sewage} × ${seT}`} value={sewageSum} />
        </div>

        <div className="mt-6 bg-blue-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-zinc-700 font-medium">Итого к оплате:</span>
          <span className="text-2xl font-semibold text-blue-700">
            {formatMoney(total)} ₽
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={resetReadings}
            className="py-2.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition"
          >
            Очистить показания
          </button>
          <button
            onClick={resetTariffs}
            className="py-2.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition"
          >
            Сбросить тарифы
          </button>
        </div>
      </main>
    </div>
  );
}

function Line({ name, value }) {
  return (
    <div className="flex justify-between text-zinc-700">
      <span>{name}</span>
      <span className="tabular-nums">{formatMoney(value)} ₽</span>
    </div>
  );
}
