// Shared class strings of the creation forms (mission + resource), so every
// field in them looks the same (PLAN_MISSION_FORM_REDESIGN — visual tokens).
export const lbl = 'mb-2 block text-sm font-bold text-[#2a1420]';
export const fieldBox =
  'rounded-xl border-[1.5px] border-[#e4d9c4] bg-[#fffdf8] text-[#2a1420] transition focus-within:border-[#c8155f] focus-within:ring-[3px] focus-within:ring-[#c8155f]/15';
export const inp =
  'h-[52px] w-full min-w-0 rounded-xl border-[1.5px] border-[#e4d9c4] bg-[#fffdf8] px-4 text-[17px] font-medium text-[#2a1420] outline-none transition placeholder:text-[#9b8a92] focus:border-[#c8155f] focus:ring-[3px] focus:ring-[#c8155f]/15';
export const ghost =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border-[1.5px] border-[#e4d9c4] bg-white px-3 text-[13px] font-medium text-[#2a1420] transition hover:border-[#c8155f] hover:text-[#c8155f] disabled:opacity-50';
export const segBtn = (/** @type {boolean} */ on) =>
  `h-10 rounded-[9px] px-4 text-[15px] transition ${
    on ? 'bg-white font-bold text-[#c8155f] shadow-sm' : 'text-[#6b5560] hover:text-[#2a1420]'
  }`;
