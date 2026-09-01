import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmizjlytwedkufcxsdpt.supabase.co';
const supabaseAnonKey = 'sb_publishable_Q44hEXWud0LPIEKl1ZVQAA_rPSx6h71';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
