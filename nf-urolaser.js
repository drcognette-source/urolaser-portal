// Urolaser · comando de preenchimento da NFS-e Goiânia (Uro Laser Ltda, tomador pessoa física)
// Gerado pela área Operação. Classificação da nota 229 da Uro Laser (13/10/2026).
// O formulário (iframe#iframe, NotaNacional.aspx) recarrega a página inteira a cada escolha
// (postback completo), então o comando espera cada recarga e pega a página nova.
// NUNCA clica em Gravar: a secretária confere e grava UMA vez.
window.UROLASER_NF_SNIPPET = function (D) {
  const dados = JSON.stringify(D).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `(async () => {
  const D = ${dados};
  const PROIBIDOS = ['btnAssinar','btnIncluir','btnGravarAssinado','btnAssinarEnviarEmail','btnAssinaCert','btnGerarXml'];
  const iframe = document.getElementById('iframe');
  if (!iframe) { alert('Formulário não encontrado. Entre no site, escolha Uro Laser, clique em Menu e depois em "Emitir NFS-e".'); return; }
  let doc = iframe.contentDocument, win = iframe.contentWindow;
  if (!doc.getElementById('txtCpfCnpjTom')) { alert('O formulário de Emitir NFS-e não está aberto. Clique em Menu > Emitir NFS-e, espere carregar e cole de novo.'); return; }
  if (!/uro\\s*laser/i.test(document.body.innerText + doc.body.innerText)) { if (!confirm('Não encontrei "Uro Laser" na tela. A empresa selecionada é a Uro Laser?')) return; }
  if (window.__urolaserRodando) { alert('O preenchimento já está em andamento. Aguarde.'); return; }
  const ja = ['txtCpfCnpjTom','txtTotalServicos','txtDescServicos'].some(id => { const e = doc.getElementById(id); return e && String(e.value || '').trim(); });
  if (ja && !confirm('O formulário já tem dados. Quer que eu substitua pelos dados de ' + D.nome + '?')) return;
  window.__urolaserRodando = true;

  // Faixa de aviso fica na página de fora: não some quando o formulário recarrega
  const BID = 'urolaser-nf-banner';
  function banner(html, tipo) {
    let b = document.getElementById(BID); if (!b) { b = document.createElement('div'); b.id = BID; document.body.appendChild(b); }
    const c = { warn: ['#fff8e1','#7c5400','#b87c00'], ok: ['#e8f5ec','#0e5523','#1b7c3a'], err: ['#fdecea','#7a1f17','#c0392b'] }[tipo];
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:' + c[0] + ';color:' + c[1] + ';padding:14px 18px;font:600 15px system-ui,sans-serif;border-bottom:4px solid ' + c[2] + ';z-index:2147483647;max-height:220px;overflow:auto';
    b.innerHTML = html;
  }
  const passo = h => banner('⏳ ' + h, 'warn'), ok = h => banner('✅ ' + h, 'ok'), erro = h => banner('🚨 ' + h + ' <b>Não clique em Gravar.</b> Chame o Dr. Marcel.', 'err');
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Bloqueio dos botões de gravação, reinstalado a cada recarga do formulário
  let rodando = true;
  function bloquear() {
    if (!rodando) return;
    try {
      win = iframe.contentWindow; doc = iframe.contentDocument;
      if (win.__doPostBack && !win.__doPostBack.__urolaser) {
        const orig = win.__doPostBack;
        win.__doPostBack = function (id) { if (rodando && PROIBIDOS.includes(id)) { erro('Bloqueado: ' + id); throw new Error('bloqueado ' + id); } return orig.apply(this, arguments); };
        win.__doPostBack.__urolaser = true;
      }
      PROIBIDOS.forEach(id => { const el = doc.getElementById(id); if (el) el.addEventListener('click', ev => { if (rodando) { ev.preventDefault(); ev.stopImmediatePropagation(); erro('Bloqueado: ' + id); } }, true); });
    } catch (e) {}
  }
  bloquear();
  const aoCarregar = () => bloquear();
  iframe.addEventListener('load', aoCarregar);

  // Espera o formulário recarregar depois de uma escolha
  let cargas = 0; iframe.addEventListener('load', () => cargas++);
  async function esperaRecarga(antes, ms) {
    const t0 = Date.now();
    while (cargas === antes && Date.now() - t0 < ms) await sleep(150);
    // espera o documento novo ficar pronto
    while (Date.now() - t0 < ms) { try { if (iframe.contentDocument.readyState === 'complete' && iframe.contentDocument.getElementById('txtCpfCnpjTom')) break; } catch (e) {} await sleep(150); }
    await sleep(400); bloquear();
    return cargas !== antes;
  }
  async function esperaOpcao(id, v, ms) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const e = doc.getElementById(id); if (e && Array.from(e.options).some(o => o.value === v)) return e; await sleep(250); bloquear(); }
    return null;
  }
  async function trocar(e) { const antes = cargas; e.dispatchEvent(new Event('change', { bubbles: true })); await esperaRecarga(antes, 15000); }
  async function sel(id, v, nome) {
    const e = await esperaOpcao(id, v, 10000);
    if (!e) { const x = doc.getElementById(id); console.error('[Urolaser NF]', id, x ? Array.from(x.options).map(o => o.value + ':' + o.text) : 'sem campo'); throw new Error(nome + ' (' + v + ') não apareceu na lista do site.'); }
    if (e.value === v) return; e.value = v; await trocar(e);
  }
  async function selTexto(id, re, nome, opcional) {
    const t0 = Date.now(); let e, o;
    while (Date.now() - t0 < 6000) { e = doc.getElementById(id); o = e && Array.from(e.options).find(x => re.test(x.text)); if (o) break; await sleep(250); }
    if (!o) { if (opcional && !e) return; throw new Error('Opção "' + nome + '" não encontrada.'); }
    if (e.value === o.value) return; e.value = o.value; await trocar(e);
  }
  async function texto(id, v, comRecarga) {
    const e = doc.getElementById(id); if (!e) throw new Error('Campo ' + id + ' não encontrado.');
    e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true }));
    if (comRecarga) await trocar(e); else { e.dispatchEvent(new Event('blur', { bubbles: true })); }
  }
  const contador = () => { try { const m = (document.body.innerText + '\\n' + iframe.contentDocument.body.innerText).match(/[ÚU]ltima nota emitida:\\s*(\\d+)/i); return m ? parseInt(m[1], 10) : null; } catch (e) { return null; } };

  const c0 = contador();
  if (c0 === null) { erro('Não consegui ler "Última nota emitida" na tela. Recarregue a página e tente de novo.'); window.__urolaserRodando = false; rodando = false; return; }
  const limite = setTimeout(() => erro('Passou de 3 minutos e o preenchimento não terminou.'), 180000);
  const valor = Number(D.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  try {
    passo('(1/6) CPF do tomador. O site busca nome e endereço na Receita...');
    await texto('txtCpfCnpjTom', D.cpf, true); await sleep(800);

    passo('(2/6) Medicina: atividade 401, tributação 04.01.01, NBS 1.2301.22.00...');
    await sel('ddlAtivMunicipal', '401', 'Atividade municipal 401 (Medicina)');
    await sel('ddlTrbNacional', '040101', 'Tributação nacional 040101');
    await sel('ddlNBS', '123012200', 'NBS 1.2301.22.00');

    passo('(3/6) Valor...');
    await texto('txtTotalServicos', valor, true);

    passo('(4/6) ISS 3,5% não retido...');
    await sel('ddlTribISSQN', '17', 'Operação tributável');
    await sel('ddlRegimeEspecial', '0', 'Regime especial Nenhum');
    await selTexto('ddlTipoRetencao', /n[aã]o retido/i, 'ISS Não Retido');

    passo('(5/6) Federais não retidos...');
    await sel('ddlSitTribFederal', '01', 'Situação tributária federal 01');
    await selTexto('ddlTipoRetFederal', /n[aã]o retid/i, 'PIS/COFINS/CSLL Não Retidos', true);

    passo('(6/6) IBS/CBS por último: 030102 / 200 / 200029, e a descrição...');
    await sel('ddlIndicadorOperacao', '030102', 'Indicador de operação 030102');
    await sel('ddlSituacaoTributaria', '200', 'Situação tributária IBS/CBS 200');
    await sel('ddlClassificacaoTributaria', '200029', 'Classificação tributária 200029');
    await texto('txtDescServicos', D.descricao, false); await sleep(300);
    clearTimeout(limite);

    doc = iframe.contentDocument;
    const conf = [['txtCpfCnpjTom', v => v.replace(/\\D/g, '') === D.cpf.replace(/\\D/g, '')], ['txtTotalServicos', v => v.replace(/\\D/g, '') === valor.replace(/\\D/g, '')],
      ['ddlAtivMunicipal', v => v === '401'], ['ddlTrbNacional', v => v === '040101'], ['ddlNBS', v => v === '123012200'], ['ddlTribISSQN', v => v === '17'],
      ['ddlIndicadorOperacao', v => v === '030102'], ['ddlSituacaoTributaria', v => v === '200'], ['ddlClassificacaoTributaria', v => v === '200029']];
    const errados = conf.filter(([id, f]) => { const e = doc.getElementById(id); return !e || !f(String(e.value || '')); }).map(x => x[0]);
    const desc = doc.getElementById('txtDescServicos'); if (!desc || desc.value.trim() !== D.descricao) errados.push('txtDescServicos');
    const nomeTom = (doc.getElementById('txtRazaoSocialTom') || {}).value || '';
    const c1 = contador();
    if (c1 !== c0) { erro('O contador de notas mudou de ' + c0 + ' para ' + c1 + ' durante o preenchimento. Confira em "Consultar NFS-e".'); return; }
    if (errados.length) { erro('Estes campos não ficaram certos: ' + errados.join(', ') + '. Confira um por um.'); return; }
    ok('Preenchido para <b>' + (nomeTom || D.nome) + '</b>, R$ ' + valor + '. Confira o nome do tomador e o município de incidência do IBS/CBS. Clique em <b>GRAVAR UMA VEZ SÓ</b> e, na pergunta do certificado digital, clique <b>Não</b>. A próxima nota será a ' + (c0 + 1) + '. Depois registre o número na área Operação.');
  } catch (e) {
    clearTimeout(limite); erro('Parei no meio: ' + (e.message || e));
  } finally {
    rodando = false; window.__urolaserRodando = false; iframe.removeEventListener('load', aoCarregar);
  }
})();`;
};
