'use client';

import { useState, useTransition } from 'react';
import { updateApartment } from '@/lib/actions';

export default function ApartmentEdit({ apartment }) {
  const [name, setName] = useState(apartment.tenant_name ?? '');
  const [num, setNum] = useState(
    apartment.apt_number != null ? String(apartment.apt_number) : ''
  );
  const [status, setStatus] = useState(null);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    setStatus(null);
    const fd = new FormData();
    fd.set('tenant_name', name);
    fd.set('apt_number', num);

    startTransition(async () => {
      const res = await updateApartment(apartment.id, fd);
      if (res.ok) {
        setStatus('ok');
        setTimeout(() => setStatus(null), 1500);
      } else {
        setStatus('err');
      }
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500">Студия</span>
      <input
        type="number"
        min="1"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded text-zinc-900 bg-white"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Имя квартиранта"
        className="px-2 py-1 text-sm border border-zinc-300 rounded text-zinc-900 bg-white"
      />
      <button
        onClick={handleSave}
        disabled={pending}
        className="px-3 py-1 text-xs rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-800 disabled:opacity-50"
      >
        {pending ? '...' : status === 'ok' ? '✓' : 'Сохранить'}
      </button>
      {status === 'err' && (
        <span className="text-xs text-red-600">Ошибка</span>
      )}
    </div>
  );
}
