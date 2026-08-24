-- Initial schema for Delhi Collection

CREATE TABLE public.users (
  id uuid references auth.users not null primary key,
  role text not null check (role in ('admin', 'user'))
);

CREATE TABLE public.campaign (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  name_hi text,
  logo_url text,
  background_url text,
  headline text,
  headline_hi text,
  subheadline text,
  subheadline_hi text,
  cta_text text default 'Spin Now',
  cta_text_hi text,
  primary_color text default '#8C193C',
  accent_color text default '#E8B84B',
  ink_color text default '#FAF7F0',
  max_spins integer default 2,
  reset_days integer default 7,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  active boolean default true,
  redemption_instructions text,
  redemption_instructions_hi text,
  terms text,
  terms_hi text,
  win_message text,
  win_message_hi text,
  lose_message text,
  lose_message_hi text,
  claim_url text
);

CREATE TABLE public.prize (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  name_hi text,
  description text,
  description_hi text,
  image_url text,
  icon text,
  discount_value text,
  discount_value_hi text,
  probability numeric default 0,
  inventory integer default 0,
  initial_inventory integer default 0,
  expiration_days integer default 30,
  sort_order integer default 0,
  active boolean default true,
  is_try_again boolean default false
);

CREATE TABLE public.customer (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  phone_raw text,
  phone_normalized text not null,
  spins_in_cycle integer default 0,
  total_spins integer default 0,
  cycle_start_date timestamp with time zone,
  last_spin_date timestamp with time zone
);

CREATE TABLE public.spin (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_id uuid references public.customer(id) not null,
  phone_normalized text not null,
  prize_id uuid references public.prize(id),
  prize_name text,
  prize_name_hi text,
  result_type text not null check (result_type in ('won', 'try_again')),
  coupon_code text
);

CREATE TABLE public.coupon (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  code text not null unique,
  customer_id uuid references public.customer(id) not null,
  customer_name text,
  customer_phone text,
  prize_id uuid references public.prize(id) not null,
  prize_name text,
  prize_name_hi text,
  spin_id uuid references public.spin(id),
  discount_value text,
  discount_value_hi text,
  claimed boolean default false,
  claimed_date timestamp with time zone,
  expiration_date date
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on campaign" ON public.campaign FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on prize" ON public.prize FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on customer" ON public.customer FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on spin" ON public.spin FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on coupon" ON public.coupon FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- The backend API (Express server) will use a Service Role key to bypass RLS,
-- so we do not need to add public INSERT policies for the frontend.
