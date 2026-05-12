-- =============================================
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================

-- Products table
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  name_hi text,
  category text default 'Other',
  unit text default '1 kg',
  emoji text default '📦',
  description text,
  image_url text,
  in_stock boolean default true,
  price_note text default 'Call for price',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Settings table (single row)
create table if not exists settings (
  id int primary key default 1,
  store_name text default 'Jinendra Enterprises',
  tagline text default 'Your trusted kirana store for fresh groceries and daily essentials.',
  address text default 'Manasa, Madhya Pradesh',
  phone text default '+91 99774 69984',
  whatsapp text default '919977469984',
  timing text default 'Mon–Sun: 7 AM – 9 PM',
  delivery_area text default 'Manasa & nearby areas',
  localities text default 'Manasa,Neemuch,Ratlam',
  updated_at timestamptz default now()
);

-- Orders table
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  customer_name text,
  customer_phone text,
  customer_address text,
  locality text,
  items jsonb,
  total numeric,
  status text default 'pending',
  note text,
  created_at timestamptz default now()
);

-- Insert default settings row
insert into settings (id) values (1) on conflict (id) do nothing;

-- Insert sample products
insert into products (name, name_hi, category, unit, emoji, description, in_stock, price_note) values
  ('Aashirvaad Atta', 'आशीर्वाद आटा', 'Atta & Flour', '5 kg', '🌾', 'Premium chakki fresh atta', true, 'Call for price'),
  ('Fortune Sunflower Oil', 'फॉर्च्यून तेल', 'Oil', '1 L', '🫙', 'Refined sunflower cooking oil', true, 'Call for price'),
  ('Toor Dal', 'तुअर दाल', 'Dal & Pulses', '1 kg', '🫘', 'Fresh premium quality toor dal', true, 'Call for price'),
  ('Basmati Rice', 'बासमती चावल', 'Rice', '5 kg', '🍚', 'Long grain aged basmati rice', true, 'Call for price')
on conflict do nothing;

-- Enable Row Level Security
alter table products enable row level security;
alter table settings enable row level security;
alter table orders enable row level security;

-- Public can READ products and settings
create policy "Public read products" on products for select using (true);
create policy "Public read settings" on settings for select using (true);
create policy "Public insert orders" on orders for insert with check (true);

-- Only authenticated users can write products/settings (you control this via service role in API routes)
-- API routes use service_role key which bypasses RLS
