// Urolaser · envia o contrato de locação de uma cirurgia pela ZapSign
// Segredos necessários (Supabase > Edge Functions > Secrets):
//   ZAPSIGN_TOKEN  = chave de API da conta ZapSign da Urolaser
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY já existem por padrão.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "https://urolaser.med.br",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (iso: string) => iso.split("-").reverse().join("/");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return out(405, { erro: "Use POST." });

  const auth = req.headers.get("Authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const zapToken = Deno.env.get("ZAPSIGN_TOKEN");
  if (!zapToken) return out(503, { erro: "Chave da ZapSign ainda não configurada no servidor." });

  // Cliente com o login de quem clicou: as regras de acesso valem aqui.
  const user = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: papel } = await user.rpc("meu_papel");
  if (!papel) return out(403, { erro: "Acesso não autorizado." });

  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return out(400, { erro: "Cirurgia não informada." });

  const { data: c, error } = await user.from("op_cirurgias").select("*").eq("id", id).single();
  if (error || !c) return out(404, { erro: "Cirurgia não encontrada." });
  if (c.cancelada) return out(409, { erro: "Cirurgia cancelada." });
  if (c.contrato_status === "enviado" || c.contrato_status === "assinado")
    return out(409, { erro: "Esta cirurgia já tem contrato " + c.contrato_status + "." });

  const { data: p } = await user.from("op_precos").select("*").eq("id", c.preco_id).single();
  if (!p?.zapsign_template)
    return out(422, { erro: "O procedimento ainda não tem modelo de contrato ligado. Peça ao Dr. Marcel." });

  // Valores disponíveis para os campos {{...}} do modelo
  const valores: Record<string, string> = {
    paciente_nome: c.paciente_nome,
    paciente_cpf: c.paciente_cpf,
    paciente_whats: c.paciente_whats,
    paciente_email: c.paciente_email ?? "",
    data_cirurgia: dataBR(c.data_cirurgia),
    hospital: c.hospital,
    medico: c.medico,
    procedimento: p.procedimento,
    laser: p.laser,
    valor: brl(Number(c.valor)),
    transporte: brl(Number(c.transporte || 0)),
    total: brl(Number(c.valor) + Number(c.transporte || 0)),
    forma_pagamento: c.forma_pagamento === "3x" ? "3x no cartão" : "à vista (PIX, TED ou dinheiro)",
  };
  const data = Object.entries(p.campos_contrato as Record<string, string>)
    .map(([de, chave]) => ({ de, para: valores[chave] ?? "" }));

  const fone = String(c.paciente_whats).replace(/\D/g, "");
  const mes = String(c.data_cirurgia).slice(0, 7);
  const body = {
    template_id: p.zapsign_template,
    signer_name: c.paciente_nome,
    signer_email: c.paciente_email || undefined,
    signer_phone_country: "55",
    signer_phone_number: fone,
    send_automatic_whatsapp: true,
    send_automatic_whatsapp_signed_file: true,
    reminder_every_n_days: 1,
    external_id: c.id,
    folder_path: `/Contratos Urolaser/${mes}/`,
    lang: "pt-br",
    data,
  };

  const r = await fetch("https://api.zapsign.com.br/api/v1/models/create-doc/", {
    method: "POST",
    headers: { Authorization: `Bearer ${zapToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const z = await r.json().catch(() => ({}));
  if (!r.ok) return out(502, { erro: "A ZapSign recusou o envio.", detalhe: z });

  const admin = createClient(url, service);
  await admin.from("op_cirurgias").update({
    contrato_status: "enviado",
    contrato_token: z.token ?? null,
    contrato_link: z.signers?.[0]?.sign_url ?? null,
    contrato_em: new Date().toISOString(),
  }).eq("id", c.id);
  const { data: who } = await user.auth.getUser();
  await admin.from("op_eventos").insert({
    por: who.user?.email ?? "?", cirurgia: c.id, acao: "contrato_enviado", detalhe: p.procedimento,
  });

  return out(200, { ok: true, token: z.token });
});
