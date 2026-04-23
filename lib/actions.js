'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from './supabase';

function toNum(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export async function submitReading(apartmentId, formData) {
  const electricity = toNum(formData.get('electricity'));
  const coldWater = toNum(formData.get('cold_water'));
  const hotWater = toNum(formData.get('hot_water'));

  if (!apartmentId || [electricity, coldWater, hotWater].some(Number.isNaN)) {
    return { ok: false, error: 'Введите все три числа' };
  }

  const supabase = createSupabaseServerClient();

  const { data: apt } = await supabase
    .from('apartments')
    .select('id')
    .eq('id', apartmentId)
    .maybeSingle();

  if (!apt) return { ok: false, error: 'Квартира не найдена' };

  const { error } = await supabase.from('readings').insert({
    apartment_id: apartmentId,
    electricity,
    cold_water: coldWater,
    hot_water: hotWater,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/apt/${apartmentId}`);
  revalidatePath(`/admin`, 'layout');
  return { ok: true };
}

export async function updateTariffs(complex, formData) {
  if (!complex) return { ok: false, error: 'Не указан ЖК' };

  const electricity = toNum(formData.get('electricity'));
  const coldWater = toNum(formData.get('cold_water'));
  const hotWater = toNum(formData.get('hot_water'));
  const sewage = toNum(formData.get('sewage'));

  if ([electricity, coldWater, hotWater, sewage].some(Number.isNaN)) {
    return { ok: false, error: 'Все 4 тарифа должны быть числами' };
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from('apartments')
    .update({
      tariff_electricity: electricity,
      tariff_cold_water: coldWater,
      tariff_hot_water: hotWater,
      tariff_sewage: sewage,
    })
    .eq('complex', complex);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function updateApartment(apartmentId, formData) {
  if (!apartmentId) return { ok: false, error: 'Не указана квартира' };

  const tenantName = String(formData.get('tenant_name') ?? '').trim();
  const aptNumberRaw = formData.get('apt_number');
  const aptNumber = aptNumberRaw === null || aptNumberRaw === ''
    ? null
    : parseInt(String(aptNumberRaw), 10);

  if (aptNumber !== null && Number.isNaN(aptNumber)) {
    return { ok: false, error: 'Номер студии должен быть числом' };
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from('apartments')
    .update({
      tenant_name: tenantName || null,
      apt_number: aptNumber,
    })
    .eq('id', apartmentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin', 'layout');
  revalidatePath(`/apt/${apartmentId}`);
  return { ok: true };
}
