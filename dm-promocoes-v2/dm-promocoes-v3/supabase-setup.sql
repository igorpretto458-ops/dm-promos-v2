-- Tabela de promoções
create table if not exists promocoes (
  id text primary key,
  restaurante text not null,
  tipo text,
  produto text,
  preco_normal numeric,
  preco_promo numeric,
  recorrencia text,
  dias text[],
  qtd integer,
  status text,
  inc_restaurante numeric default 0,
  inc_franqueadora numeric default 0,
  inc_lvto numeric default 0,
  inc_total numeric default 0,
  responsavel text,
  cidade text,
  obs text,
  created_at timestamptz default now()
);

-- Tabela de cupons
create table if not exists cupons (
  id text primary key,
  codigo text not null,
  tipo_desconto text,
  valor numeric,
  pedido_min numeric,
  aplicar_para text,
  loja_especifica text,
  curvas text[],
  quem_banca text,
  pct_loja numeric,
  pct_franquia numeric,
  recorrencia text,
  dias text[],
  data_inicio date,
  data_fim date,
  status text default 'ATIVO',
  obs text,
  created_at timestamptz default now()
);

-- Tabela de ações de marketing
create table if not exists marketing_acoes (
  id text primary key,
  promo_id text,
  data date,
  push_agendado timestamptz,
  push_status text default 'PENDENTE',
  story_agendado timestamptz,
  story_status text default 'PENDENTE',
  post_agendado timestamptz,
  post_status text default 'PENDENTE',
  obs text,
  created_at timestamptz default now()
);

-- Liberar acesso público (RLS desativado por ora)
alter table promocoes enable row level security;
alter table cupons enable row level security;
alter table marketing_acoes enable row level security;

create policy "acesso publico promocoes" on promocoes for all using (true) with check (true);
create policy "acesso publico cupons" on cupons for all using (true) with check (true);
create policy "acesso publico marketing" on marketing_acoes for all using (true) with check (true);
