-- E-Coupon System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table users (
  user_id uuid primary key default uuid_generate_v4(),
  name varchar(100) not null,
  email varchar(255) unique not null,
  role varchar(10) not null default 'user' check (role in ('user', 'vendor', 'admin')),
  stall_name varchar(100),
  stall_code varchar(10),
  bank_account varchar(50),
  bank_name varchar(100),
  otp_code varchar(6),
  otp_expires_at timestamptz,
  otp_attempts int default 0,
  is_verified boolean default false,
  settlement_status varchar(10) check (settlement_status in ('pending', 'paid')),
  created_at timestamptz default now()
);

-- Wallets table
create table wallets (
  wallet_id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references users(user_id),
  balance decimal(10,2) default 0.00 check (balance >= 0),
  total_received decimal(10,2) default 0.00,
  total_spent decimal(10,2) default 0.00,
  updated_at timestamptz default now()
);

-- Transactions table
create table transactions (
  tx_id uuid primary key default uuid_generate_v4(),
  type varchar(10) not null check (type in ('topup', 'payment', 'donation')),
  from_user_id uuid references users(user_id),
  to_user_id uuid references users(user_id),
  amount decimal(10,2) not null check (amount > 0),
  idempotency_key varchar(255) unique,
  status varchar(10) not null default 'success' check (status in ('success', 'failed', 'blocked')),
  notes varchar(500),
  created_at timestamptz default now()
);

create index idx_transactions_created_at on transactions(created_at desc);
create index idx_transactions_from_user on transactions(from_user_id);
create index idx_transactions_to_user on transactions(to_user_id);

-- Donations table
create table donations (
  donation_id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(user_id),
  tx_id uuid not null references transactions(tx_id),
  amount decimal(10,2) not null check (amount > 0),
  donation_type varchar(10) not null check (donation_type in ('full', 'partial')),
  created_at timestamptz default now()
);

-- Settlements table
create table settlements (
  settlement_id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references users(user_id),
  admin_id uuid not null references users(user_id),
  amount decimal(10,2) not null check (amount > 0),
  bank_ref varchar(100),
  status varchar(10) not null default 'pending' check (status in ('pending', 'paid')),
  settled_at timestamptz,
  created_at timestamptz default now()
);

-- Sessions table
create table sessions (
  session_id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(user_id),
  device_info varchar(500),
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  is_active boolean default true
);

create index idx_sessions_user on sessions(user_id);

-- Function: Create wallet automatically when a user is created
create or replace function create_wallet_for_user()
returns trigger as $$
begin
  insert into wallets (user_id) values (new.user_id);
  return new;
end;
$$ language plpgsql;

create trigger trigger_create_wallet
after insert on users
for each row execute function create_wallet_for_user();

-- Function: Process payment atomically
create or replace function process_payment(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount decimal,
  p_idempotency_key varchar
)
returns json as $$
declare
  v_sender_balance decimal;
  v_tx_id uuid;
  v_new_balance decimal;
  v_existing_tx uuid;
begin
  -- Check idempotency
  select tx_id into v_existing_tx from transactions where idempotency_key = p_idempotency_key;
  if v_existing_tx is not null then
    select balance into v_new_balance from wallets where user_id = p_from_user_id;
    return json_build_object('success', true, 'tx_id', v_existing_tx, 'new_balance', v_new_balance, 'duplicate', true);
  end if;

  -- Cannot pay yourself
  if p_from_user_id = p_to_user_id then
    raise exception 'You cannot pay yourself';
  end if;

  -- Lock sender wallet and check balance
  select balance into v_sender_balance from wallets where user_id = p_from_user_id for update;
  if v_sender_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  -- Debit sender
  update wallets set balance = balance - p_amount, total_spent = total_spent + p_amount, updated_at = now()
  where user_id = p_from_user_id;

  -- Credit receiver
  update wallets set balance = balance + p_amount, total_received = total_received + p_amount, updated_at = now()
  where user_id = p_to_user_id;

  -- Create transaction record
  insert into transactions (type, from_user_id, to_user_id, amount, idempotency_key, status)
  values ('payment', p_from_user_id, p_to_user_id, p_amount, p_idempotency_key, 'success')
  returning tx_id into v_tx_id;

  -- Get new balance
  select balance into v_new_balance from wallets where user_id = p_from_user_id;

  return json_build_object('success', true, 'tx_id', v_tx_id, 'new_balance', v_new_balance, 'duplicate', false);
end;
$$ language plpgsql;

-- Function: Process top-up atomically
create or replace function process_topup(
  p_admin_id uuid,
  p_user_id uuid,
  p_amount decimal
)
returns json as $$
declare
  v_tx_id uuid;
  v_new_balance decimal;
begin
  -- Credit user wallet
  update wallets set balance = balance + p_amount, total_received = total_received + p_amount, updated_at = now()
  where user_id = p_user_id;

  -- Create transaction record
  insert into transactions (type, from_user_id, to_user_id, amount, status, notes)
  values ('topup', p_admin_id, p_user_id, p_amount, 'success', 'Admin top-up')
  returning tx_id into v_tx_id;

  -- Get new balance
  select balance into v_new_balance from wallets where user_id = p_user_id;

  return json_build_object('success', true, 'tx_id', v_tx_id, 'new_balance', v_new_balance);
end;
$$ language plpgsql;

-- Function: Process donation atomically
create or replace function process_donation(
  p_user_id uuid,
  p_amount decimal,
  p_donation_type varchar
)
returns json as $$
declare
  v_balance decimal;
  v_tx_id uuid;
  v_donation_id uuid;
  v_new_balance decimal;
begin
  -- Lock wallet and check balance
  select balance into v_balance from wallets where user_id = p_user_id for update;
  if v_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  -- Debit user wallet
  update wallets set balance = balance - p_amount, total_spent = total_spent + p_amount, updated_at = now()
  where user_id = p_user_id;

  -- Create transaction record
  insert into transactions (type, from_user_id, amount, status, notes)
  values ('donation', p_user_id, p_amount, 'success', 'Charity donation')
  returning tx_id into v_tx_id;

  -- Create donation record
  insert into donations (user_id, tx_id, amount, donation_type)
  values (p_user_id, v_tx_id, p_amount, p_donation_type)
  returning donation_id into v_donation_id;

  -- Get new balance
  select balance into v_new_balance from wallets where user_id = p_user_id;

  return json_build_object('success', true, 'donation_id', v_donation_id, 'new_balance', v_new_balance);
end;
$$ language plpgsql;

-- Enable realtime for transactions (for vendor notifications)
alter publication supabase_realtime add table transactions;

-- RLS Policies (using service role key bypasses RLS, but adding for safety)
alter table users enable row level security;
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table sessions enable row level security;
alter table donations enable row level security;
alter table settlements enable row level security;
