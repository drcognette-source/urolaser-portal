-- =====================================================================
-- Urolaser · Área Operação (secretária) · rodar UMA vez no SQL Editor
-- Projeto Supabase: urolaser-fluxo (xxhwhkmsknleqqdozlwx)
-- Idempotente: pode rodar de novo sem duplicar nada.
-- =====================================================================

-- 1) Equipe e papéis ---------------------------------------------------
create table if not exists public.equipe (
  email  text primary key,
  nome   text not null,
  papel  text not null check (papel in ('socio','secretaria'))
);
insert into public.equipe (email, nome, papel) values
  ('drmarcel.uro@gmail.com',       'Marcel',      'socio'),
  ('anselmopaulaorlando@gmail.com','Anselmo',     'socio'),
  ('andreluizmed@gmail.com',       'André',       'socio'),
  ('rodrigocidlima@yahoo.com.br',  'Rodrigo',     'socio'),
  ('mtcruvinel@yahoo.com.br',      'Marco Túlio', 'socio'),
  ('silvane_maia@hotmail.com',     'Silvane',     'secretaria')
on conflict (email) do update set nome = excluded.nome, papel = excluded.papel;

create or replace function public.meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.equipe where email = lower(coalesce(auth.jwt() ->> 'email',''))
$$;
create or replace function public.e_socio() returns boolean
language sql stable security definer set search_path = public as $$ select public.meu_papel() = 'socio' $$;
create or replace function public.e_equipe() returns boolean
language sql stable security definer set search_path = public as $$ select public.meu_papel() is not null $$;

alter table public.equipe enable row level security;
drop policy if exists equipe_ler on public.equipe;
create policy equipe_ler on public.equipe for select to authenticated using (public.e_equipe());

-- 2) Liberar o cadastro da Silvane na trava de e-mails autorizados -----
-- ATENÇÃO: conferir o nome da coluna de e-mail em allowed_socios antes de rodar.
insert into public.allowed_socios (email) values ('silvane_maia@hotmail.com')
on conflict do nothing;

-- 3) Finanças dos sócios: fechar para quem não é sócio -----------------
-- Política RESTRITIVA: soma-se às políticas atuais (AND), sem precisar alterá-las.
alter table public.cashflow_meses enable row level security;
drop policy if exists so_socios on public.cashflow_meses;
create policy so_socios on public.cashflow_meses as restrictive for all to authenticated
  using (public.e_socio()) with check (public.e_socio());

alter table public.regras_categoria enable row level security;
drop policy if exists so_socios on public.regras_categoria;
create policy so_socios on public.regras_categoria as restrictive for all to authenticated
  using (public.e_socio()) with check (public.e_socio());

-- 4) Tabela de preços (sócios editam, equipe lê) -----------------------
create table if not exists public.op_precos (
  id                text primary key,            -- ex.: 'L60_HOLEP'
  laser             text not null check (laser in ('60W','100W')),
  procedimento      text not null,
  valor_vista       numeric(10,2) not null,
  valor_3x          numeric(10,2),                -- null = sem opção 3x
  valor_socio       numeric(10,2),                -- null = sem preço de sócio
  descricao_nota    text not null default 'REFERENTE AO EQUIPAMENTO E FIBRA LASER UTILIZADO NA CIRURGIA NO HOSPITAL {HOSPITAL}.',  -- {HOSPITAL} e {DATA} são trocados
  zapsign_template  text,                         -- token do modelo do contrato na ZapSign
  campos_contrato   jsonb not null default '{}'::jsonb,  -- {"{{NOME}}":"paciente_nome", ...}
  ativo             boolean not null default true,
  ordem             int not null default 0
);
insert into public.op_precos (id, laser, procedimento, valor_vista, valor_3x, valor_socio, ordem) values
  ('L60_HOLEP',   '60W',  'HoLEP · kit 22 Fr com RTU bipolar',                    8000,  null, null, 1),
  ('L60_HOLEPP',  '60W',  'HoLEP com proctoria',                                  12000, null, null, 2),
  ('L60_FIBRA',   '60W',  'Laser fibra fina · cálculos, tumor de bexiga, uretrotomia', 3000, null, null, 3),
  ('L60_RTU',     '60W',  'RTU bipolar · kit e alça 26 Fr',                       3500,  null, null, 4),
  ('L100_HOLEP',  '100W', 'HoLEP',                                                8500,  9500, 7500, 5),
  ('L100_HOLEPP', '100W', 'HoLEP com proctoria',                                  12500, 13500, null, 6),
  ('L100_OUTROS', '100W', 'Demais usos do laser',                                 3000,  null, null, 7)
on conflict (id) do nothing;

alter table public.op_precos enable row level security;
drop policy if exists precos_ler on public.op_precos;
drop policy if exists precos_editar on public.op_precos;
create policy precos_ler    on public.op_precos for select to authenticated using (public.e_equipe());
create policy precos_editar on public.op_precos for all    to authenticated using (public.e_socio()) with check (public.e_socio());

-- 5) Cirurgias (uma linha por cirurgia, com as etapas) -----------------
create table if not exists public.op_cirurgias (
  id               uuid primary key default gen_random_uuid(),
  criado_em        timestamptz not null default now(),
  criado_por       text not null default lower(coalesce(auth.jwt() ->> 'email','')),
  -- paciente
  paciente_nome    text not null,
  paciente_cpf     text not null,
  paciente_whats   text not null,
  paciente_email   text,
  -- cirurgia
  data_cirurgia    date not null,
  hospital         text not null,
  medico           text not null,
  preco_id         text not null references public.op_precos(id),
  laser            text not null check (laser in ('60W','100W')),   -- guardado na hora: relatórios por laser
  procedimento     text not null,                                   -- nome na hora do cadastro
  cirurgiao_socio  boolean not null default false,
  forma_pagamento  text not null default 'vista' check (forma_pagamento in ('vista','3x')),
  valor            numeric(10,2) not null,
  transporte       numeric(10,2) not null default 0,
  observacao       text,
  -- contrato
  contrato_status  text not null default 'pendente' check (contrato_status in ('pendente','enviado','assinado','recusado','cancelado')),
  contrato_token   text,
  contrato_link    text,
  contrato_em      timestamptz,
  -- pagamento
  pago             boolean not null default false,
  pago_valor       numeric(10,2),
  pago_forma       text,
  pago_em          date,
  comprovante_path text,
  -- nota
  nota_numero      text,
  nota_em          date,
  -- checklist
  chk_transporte   boolean not null default false,
  chk_instrumentadora boolean not null default false,
  chk_fibra        boolean not null default false,
  cancelada        boolean not null default false
);
create index if not exists op_cirurgias_data on public.op_cirurgias (data_cirurgia desc);
create index if not exists op_cirurgias_laser on public.op_cirurgias (laser, data_cirurgia);

alter table public.op_cirurgias enable row level security;
drop policy if exists cir_ler on public.op_cirurgias;
drop policy if exists cir_criar on public.op_cirurgias;
drop policy if exists cir_editar on public.op_cirurgias;
create policy cir_ler    on public.op_cirurgias for select to authenticated using (public.e_equipe());
create policy cir_criar  on public.op_cirurgias for insert to authenticated with check (public.e_equipe());
create policy cir_editar on public.op_cirurgias for update to authenticated using (public.e_equipe()) with check (public.e_equipe());
-- sem DELETE: cirurgia errada é marcada como cancelada (fica o registro)

-- 6) Registro de ações (quem fez o quê) --------------------------------
create table if not exists public.op_eventos (
  id         bigint generated always as identity primary key,
  em         timestamptz not null default now(),
  por        text not null default lower(coalesce(auth.jwt() ->> 'email','')),
  cirurgia   uuid references public.op_cirurgias(id),
  acao       text not null,
  detalhe    text
);
alter table public.op_eventos enable row level security;
drop policy if exists ev_ler on public.op_eventos;
drop policy if exists ev_criar on public.op_eventos;
create policy ev_ler   on public.op_eventos for select to authenticated using (public.e_equipe());
create policy ev_criar on public.op_eventos for insert to authenticated with check (public.e_equipe());

-- 7) Comprovantes (arquivos privados) ----------------------------------
insert into storage.buckets (id, name, public) values ('comprovantes','comprovantes', false)
on conflict (id) do nothing;
drop policy if exists comp_ler on storage.objects;
drop policy if exists comp_subir on storage.objects;
create policy comp_ler   on storage.objects for select to authenticated using (bucket_id = 'comprovantes' and public.e_equipe());
create policy comp_subir on storage.objects for insert to authenticated with check (bucket_id = 'comprovantes' and public.e_equipe());
