# Área Operação (secretária) · como colocar no ar

Branch `operacao-secretaria`. Nada aqui muda o site até o merge na `main`.

## O que tem

- `operacao.html`: cadastro da cirurgia, escolha do que fazer na hora (contrato, pagamento + nota, os dois ou nenhum), contrato pela ZapSign, pagamento com comprovante, dados prontos para a nota, checklist, tabela de preços e relatórios por laser (só sócios).
- `index.html`: a secretária é mandada para a Operação e não vê as finanças; os sócios ganham o botão "Operação" e o painel "Cirurgias por laser", com recebido por laser, valores a receber e conferência dos pagamentos PIX/TED/dinheiro com o extrato Sicoob.
- `supabase/operacao.sql`: tabelas, papéis (sócio e secretaria), bloqueio das finanças para quem não é sócio, bucket de comprovantes, autorização da Silvane.
- `supabase/functions/zapsign-enviar` e `zapsign-retorno`: envio do contrato e retorno da assinatura.

## Ordem para colocar no ar

1. Supabase > SQL Editor: conferir o nome da coluna de e-mail em `allowed_socios` e rodar `supabase/operacao.sql`.
2. Testar com um sócio: o portal financeiro continua igual e a Operação abre.
3. Merge da branch na `main` (GitHub Pages publica em cerca de 1 minuto).
4. Enviar para a Silvane: https://urolaser.med.br/operacao.html, "Primeiro acesso", e-mail silvane_maia@hotmail.com, criar senha e confirmar o e-mail.
5. ZapSign (quando tiver a chave de API da conta da Urolaser):
   - Supabase > Edge Functions: publicar `zapsign-enviar` (verify JWT ligado) e `zapsign-retorno` (verify JWT desligado).
   - Secrets: `ZAPSIGN_TOKEN` e `WEBHOOK_CHAVE`.
   - ZapSign > Webhooks: `https://xxhwhkmsknleqqdozlwx.supabase.co/functions/v1/zapsign-retorno?chave=<WEBHOOK_CHAVE>`.
   - Na tela "Tabela de preços", em cada procedimento: token do modelo e mapa dos campos `{{...}}`.
   Até isso, o botão "Já enviei pela ZapSign" registra o envio feito à mão.

## Nota fiscal

Padrão conferido na nota 229 (13/10/2026): descrição "REFERENTE AO EQUIPAMENTO E FIBRA LASER UTILIZADO NA CIRURGIA NO HOSPITAL <HOSPITAL>.", Medicina 04.01.01, NBS 1.2301.22.00, ISS 3,5% não retido, federais não retidos, CST 200 / 200029, indicador de operação 030102.
Preenchimento automático: `nf-urolaser.js`, adaptado do Emissor NFS-e PF (Cognette) validado em jun/2026, com os códigos da Uro Laser e o IBS/CBS por último. A Operação gera o comando; a Silvane cola no Console do site da prefeitura, confere e grava. O comando nunca clica em Gravar, bloqueia os botões de gravação e confere o contador de notas antes e depois. Testado em formulário simulado; a primeira nota real deve ser acompanhada.
