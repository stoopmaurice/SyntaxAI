
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxtprkpkvtwwznkkuakp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_upz2wd6tu80Gpj-yY5ih0A_lOc1NNag';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
