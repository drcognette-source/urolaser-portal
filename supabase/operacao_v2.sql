-- Urolaser · Operação v2: campos dos 12 contratos de locação da ZapSign (lidos em 31/10/2026)

-- Cirurgias: contratante, paciente, médico, pagamento e instrumentadora
alter table public.op_cirurgias
  alter column paciente_whats drop not null,
  add column if not exists contratante_nome text,
  add column if not exists contratante_cpf text,
  add column if not exists contratante_whats text,
  add column if not exists contratante_endereco text,
  add column if not exists contratante_email text,
  add column if not exists contratante_qualidade text,
  add column if not exists paciente_nascimento date,
  add column if not exists medico_crm text,
  add column if not exists horario text,
  add column if not exists pag_forma_contrato text,
  add column if not exists parcelas int not null default 1,
  add column if not exists taxas_cartao numeric(10,2) not null default 0,
  add column if not exists valor_final numeric(10,2),
  add column if not exists data_limite_pagamento date,
  add column if not exists instrumentadora_nome text,
  add column if not exists instrumentadora_honorarios numeric(10,2);

-- Preços: um item por modelo de contrato da ZapSign
alter table public.op_precos
  add column if not exists codigo text,
  add column if not exists tem_hospital boolean not null default true,
  add column if not exists tem_parcelas boolean not null default true;

delete from public.op_precos where id not in (select preco_id from public.op_cirurgias where preco_id is not null);

with campos_60 as (select '{"{{NOME CONTRATANTE}}":"contratante_nome","{{CPF CONTRATANTE}}":"contratante_cpf","{{TELEFONE CONTRATANTE}}":"contratante_whats","{{ENDERECO CONTRATANTE}}":"contratante_endereco","{{EMAIL CONTRATANTE}}":"contratante_email","{{QUALIDADE CONTRATANTE}}":"contratante_qualidade","{{NOME PACIENTE}}":"paciente_nome","{{CPF PACIENTE}}":"paciente_cpf","{{NASCIMENTO PACIENTE}}":"paciente_nascimento","{{MEDICO ASSISTENTE}}":"medico","{{CRM MEDICO}}":"medico_crm","{{HOSPITAL}}":"hospital","{{DATA PROCEDIMENTO}}":"data_cirurgia","{{HORARIO PROCEDIMENTO}}":"horario","{{VALOR TRANSPORTE}}":"transporte","{{VALOR TOTAL}}":"total","{{FORMA DE PAGAMENTO}}":"pag_forma_contrato","{{PARCELAS}}":"parcelas","{{TAXAS CARTAO}}":"taxas_cartao","{{VALOR FINAL}}":"valor_final","{{DATA LIMITE PAGAMENTO}}":"data_limite_pagamento","{{NOME INSTRUMENTADORA}}":"instrumentadora_nome","{{HONORARIOS INSTRUMENTADORA}}":"instrumentadora_honorarios"}'::jsonb j),
     campos_100 as (select '{"{{NOME CONTRATANTE}}":"contratante_nome","{{CPF CONTRATANTE}}":"contratante_cpf","{{TELEFONE CONTRATANTE}}":"contratante_whats","{{ENDERECO CONTRATANTE}}":"contratante_endereco","{{EMAIL CONTRATANTE}}":"contratante_email","{{QUALIDADE CONTRATANTE}}":"contratante_qualidade","{{NOME PACIENTE}}":"paciente_nome","{{CPF PACIENTE}}":"paciente_cpf","{{NASCIMENTO PACIENTE}}":"paciente_nascimento","{{MEDICO ASSISTENTE}}":"medico","{{CRM MEDICO}}":"medico_crm","{{DATA PROCEDIMENTO}}":"data_cirurgia","{{HORARIO PROCEDIMENTO}}":"horario","{{FORMA DE PAGAMENTO}}":"pag_forma_contrato","{{PARCELAS}}":"parcelas","{{TAXAS CARTAO}}":"taxas_cartao","{{VALOR FINAL}}":"valor_final","{{DATA LIMITE PAGAMENTO}}":"data_limite_pagamento","{{NOME INSTRUMENTADORA}}":"instrumentadora_nome","{{HONORARIOS INSTRUMENTADORA}}":"instrumentadora_honorarios"}'::jsonb j),
     campos_100_sem_parc as (select (select j from campos_100) - '{{PARCELAS}}' - '{{TAXAS CARTAO}}' j)
insert into public.op_precos (id, codigo, laser, procedimento, valor_vista, valor_3x, valor_socio, zapsign_template, campos_contrato, tem_hospital, tem_parcelas, ordem) values
  ('60_HL1','HL-1-I','60W','HoLEP',8000,null,null,'da4bc0c1-906f-470c-9895-da71b204ce8d',(select j from campos_60),true,true,1),
  ('60_HL2','HL-2-I','60W','HoLEP com acompanhamento',12000,null,null,'40824297-3b2b-453c-b35a-5d7368a6a41e',(select j from campos_60),true,true,2),
  ('60_LT','LT-I','60W','Litotripsia',3000,null,null,'faf3a270-6596-4bd0-8134-e474bdb497fd',(select j from campos_60),true,true,3),
  ('60_TB','TB-I','60W','Enucleação de tumor de bexiga',3000,null,null,'ffcce91a-4bfe-4829-b073-c08d6173c5a4',(select j from campos_60),true,true,4),
  ('60_UI','UI-I','60W','Uretrotomia interna',3000,null,null,'5c3d2d40-e0b4-4c64-ae06-ff508b6daa7a',(select j from campos_60),true,true,5),
  ('60_RB','RB-I','60W','RTU bipolar',3500,null,null,'aa31f955-9853-4e68-82e7-b2729b777639',(select j from campos_60),true,true,6),
  ('100_HL1','HL-1-F','100W','HoLEP',8500,9500,null,'d7e070f7-ae5e-40fd-b0a6-216b9c13106b',(select j from campos_100_sem_parc),false,false,7),
  ('100_HLS','HLS-F','100W','HoLEP · cirurgião sócio',7500,null,null,'0118a7e5-61ea-45fc-baf8-30b730c104d2',(select j from campos_100),false,true,8),
  ('100_HL2','HL-2-F','100W','HoLEP com acompanhamento',12500,13500,null,'ef9a4ca0-1b5b-4728-8b9c-bbfc5235cf38',(select j from campos_100_sem_parc),false,false,9),
  ('100_LT','LT-F','100W','Litotripsia',3000,null,null,'a1fc268f-eae9-40b8-96cf-c12b93ff2771',(select j from campos_100),false,true,10),
  ('100_TB','TB-F','100W','Enucleação de tumor de bexiga',3000,null,null,'52625841-f8da-4b27-ae6d-f121f423f8b0',(select j from campos_100),false,true,11),
  ('100_UI','UI-F','100W','Uretrotomia interna',3000,null,null,'e07f980f-59da-4d24-a955-3d8607a553c4',(select j from campos_100),false,true,12)
on conflict (id) do update set codigo=excluded.codigo, procedimento=excluded.procedimento, zapsign_template=excluded.zapsign_template,
  campos_contrato=excluded.campos_contrato, tem_hospital=excluded.tem_hospital, tem_parcelas=excluded.tem_parcelas, ordem=excluded.ordem;

update public.op_precos set ativo=false where id not in ('60_HL1','60_HL2','60_LT','60_TB','60_UI','60_RB','100_HL1','100_HLS','100_HL2','100_LT','100_TB','100_UI');
