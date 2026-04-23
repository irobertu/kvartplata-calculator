'use client';

import { useState, useTransition } from 'react';
import { updateTariffs } from '@/lib/actions';
import { getTheme } from '@/lib/theme';

function Field({ label, name, value, onChange, unit, focusRing }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          name={name}
          type="number"
          inputMode="decimal"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-2 ${focusRing}`}
        />
        <span className="text-xs text-zinc-500 whitespace-nowrap">{unit}</span>
      </div>
    </div>
  );
}

export default function TariffForm({ complex, initial }) {
  const [el, setEl] = useState(String(initial.electricity ?? ''));
  const [cw, setCw] = useState(String(initial.cold_water ?? ''));
  const [hw, setHw] = useState(String(initial.hot_water ?? ''));
  const [se, setSe] = useState(String(initial.sewage ?? ''));
  const [status, setStatus] = useState(null);
  const [pending, startTransition] = useTransition();
  const theme = getTheme(complex);

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus(null);
    const fd = new FormData();
    fd.set('electricity', el);
    fd.set('cold_water', cw);
    fd.set('hot_water', hw);
    fd.set('sewage', se);

    startTransition(async () => {
      const res = await updateTariffs(complex, fd);
      if (res.ok) {
        setStatus({ type: 'ok', msg: 'Тарифы обновлены.' });
      } else {
        setStatus({ type: 'err', msg: res.error });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`${theme.formBg} border ${theme.formBorder} rounded-xl p-4`}
    >
      <div className="font-medium text-zinc-900 mb-3">
        Тарифы — ЖК «{complex}»
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Электроэнергия" name="electricity" value={el} onChange={setEl} unit="₽/кВт·ч" focusRing={theme.focusRing} />
        <Field label="Холодная вода" name="cold_water" value={cw} onChange={setCw} unit="₽/м³" focusRing={theme.focusRing} />
        <Field label="Горячая вода" name="hot_water" value={hw} onChange={setHw} unit="₽/м³" focusRing={theme.focusRing} />
        <Field label="Водоотведение" name="sewage" value={se} onChange={setSe} unit="₽/м³" focusRing={theme.focusRing} />
      </div>

      {status && (
        <div
          className={`mt-3 rounded-lg p-2 text-sm ${
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
        className={`mt-3 px-4 py-2 rounded-lg ${theme.button} text-white text-sm font-medium disabled:opacity-50`}
      >
        {pending ? 'Сохраняю…' : 'Сохранить тарифы'}
      </button>
    </form>
  );
}
