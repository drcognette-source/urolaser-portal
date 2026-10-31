// Urolaser · recebe os avisos da ZapSign (webhook) e atualiza o status do contrato
// Cadastrar na ZapSign (Configurações > Integração > Webhooks):
//   https://xxhwhkmsknleqqdozlwx.supabase.co/functions/v1/zapsign-retorno?chave=<WEBHOOK_CHAVE>
// Segredo necessário: WEBHOOK_CHAVE (texto longo aleatório, o mesmo da URL acima)
// Publicar com "verify JWT" DESLIGADO (a ZapSign não envia login do Supabase).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  const chave = new URL(req.url).searchParams.get("chave");
  if (!chave || chave !== Deno.env.get("WEBHOOK_CHAVE")) return new Response("forbidden", { status: 403 });
  if (req.method !== "POST") return new Response("ok");

  const ev = await req.json().catch(() => ({}));
  const tipo: string = ev.event_type ?? "";
  const token: string | undefined = ev.token ?? ev.doc_token;
  const externo: string | undefined = ev.external_id;

  const status =
    tipo === "doc_signed" ? "assinado" :
    tipo === "doc_refused" ? "recusado" :
    tipo === "doc_deleted" ? "cancelado" : null;
  if (!status) return new Response("ignorado");

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let q = admin.from("op_cirurgias").update({ contrato_status: status });
  q = externo ? q.eq("id", externo) : q.eq("contrato_token", token ?? "-");
  const { data } = await q.select("id");
  for (const row of data ?? []) {
    await admin.from("op_eventos").insert({ por: "zapsign", cirurgia: row.id, acao: "contrato_" + status });
  }
  return new Response("ok");
});
