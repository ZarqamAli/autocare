import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_CONFIG = {
  url: 'https://zthsfeivxjwenrjxykwj.supabase.co',
  // Safe to expose publicly — this is the anon/public key. Access is controlled by
  // Row Level Security (RLS) policies in Supabase, not by keeping this key secret.
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDg4MDMsImV4cCI6MjA5MzcyNDgwM30.eBvCxyl9EbZJvJFpPxINgP4SlU19KXI6LfWBYLTuZ7E'
};

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  return data;
}

export async function isLoggedIn() {
  const user = await getCurrentUser();
  return !!user;
}

// All prices are stored as minor units (bigint). Divide by 100 for PKR display.
export const formatPKR = (minor) => '₨ ' + (minor / 100).toLocaleString('en-PK');

export async function redirectIfNotLoggedIn(role = null) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) {
    const expired = error?.message?.toLowerCase().includes('expired') || error?.status === 401;
    window.location.replace(expired ? '../login.html?expired=1' : '../login.html');
    return;
  }
  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!profile) {
    const { data: created } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      primary_role: 'buyer'
    }).select().maybeSingle();
    profile = created;
    if (!profile) { window.location.replace('../login.html'); return; }
  }
  if (role === 'admin') {
    if (!profile.is_admin) window.location.replace('../login.html');
  } else if (role && profile.primary_role !== role) {
    window.location.replace('../login.html');
  }
}

export const PAKISTAN_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Sialkot','Gujranwala',
  'Hyderabad','Bahawalpur','Sargodha','Sukkur','Larkana',
  'Sheikhupura','Rahim Yar Khan','Gujrat','Mardan','Abbottabad',
  'Kasur','Dera Ghazi Khan','Sahiwal','Okara','Wah Cantonment',
  'Kohat','Mingora','Mirpur AJK','Nawabshah','Chiniot'
];

export async function initUnreadBadge(selector) {
  const user = await getCurrentUser();
  if (!user) return;
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
  if (!convs?.length) {
    document.querySelectorAll(selector).forEach(el => { el.style.display = 'none'; });
    return;
  }
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convs.map(c => c.id))
    .is('read_at', null)
    .neq('sender_id', user.id);
  document.querySelectorAll(selector).forEach(el => {
    if (count > 0) { el.textContent = count > 99 ? '99+' : String(count); el.removeAttribute('style'); }
    else el.style.display = 'none';
  });
}
