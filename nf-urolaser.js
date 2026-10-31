// Urolaser · comando de preenchimento da NFS-e Goiânia (Uro Laser Ltda, tomador pessoa física)
// Gerado pela área Operação. Baseado no Emissor NFS-e PF (Cognette) validado em jun/2026,
// com a classificação da nota 229 da Uro Laser (13/10/2026).
// NUNCA clica em Gravar: a secretária confere e grava UMA vez.
window.UROLASER_NF_SNIPPET = function (D) {
  const dados = JSON.stringify(D).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `(async () => {
  const D = ${dados};
  const PROIBIDOS = ['btnAssinar','btnIncluir','btnGravarAssinado','btnAssinarEnviarEmail','btnAssinaCert','btnGerarXml'];
  const PERMITIDOS = ['ddlAtivMunicipal','ddlTrbNacional','ddlTribISSQN','ddlRegimeEspecial','ddlSitTribFederal','ddlTipoRetFederal','ddlIndicadorOperacao','ddlSituacaoTributaria','ddlClassificacaoTributaria'];
  const iframe = document.getElementById('iframe');
  if (!iframe) { alert('Formulário não encontrado. Entre no site, escolha Uro Laser e abra "Emitir NFS-e".'); return; }
  const doc = iframe.contentDocument, win = iframe.contentWindow;
  if (!doc.getElementById('txtCpfCnpjTom')) { alert('O formulário de Emitir NFS-e ainda não carregou. Aguarde 3 segundos e cole de novo.'); return; }
  if (!/uro\\s*laser/i.test(document.body.innerText + doc.body.innerText)) { if (!confirm('Não encontrei "Uro Laser" na tela. A empresa selecionada é a Uro Laser?')) return; }
  if (win.__urolaserRodando) { alert('O preenchimento já está em andamento. Aguarde.'); return; }
  const ja = ['txtCpfCnpjTom','txtTotalServicos','txtDescServicos'].some(id => { const e = doc.getElementById(id); return e && String(e.value || '').trim(); });
  if (ja && !confirm('O formulário já tem dados. Quer que eu substitua pelos dados de ' + D.nome + '?')) return;
  win.__urolaserRodando = true;

  const origPB = win.__doPostBack;
  win.__doPostBack = function (id) { if (PROIBIDOS.includes(id)) { erro('Bloqueado: ' + id); throw new Error('bloqueado ' + id); } return origPB.apply(this, arguments); };
  PROIBIDOS.forEach(id => { const el = doc.getElementById(id); if (el) el.click = () => { erro('Bloqueado: ' + id); throw new Error('bloqueado ' + id); }; });

  const BID = 'urolaser-nf-banner';
  function banner(html, tipo) {
    let b = doc.getElementById(BID); if (!b) { b = doc.createElement('div'); b.id = BID; doc.body.appendChild(b); }
    const c = { warn: ['#fff8e1','#7c5400','#b87c00'], ok: ['#e8f5ec','#0e5523','#1b7c3a'], err: ['#fdecea','#7a1f17','#c0392b'] }[tipo];
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:' + c[0] + ';color:' + c[1] + ';padding:14px 18px;font:600 15px system-ui,sans-serif;border-bottom:4px solid ' + c[2] + ';z-index:2147483647;max-height:220px;overflow:auto';
    b.innerHTML = html;
  }
  const passo = h => banner('⏳ ' + h, 'warn'), ok = h => banner('✅ ' + h, 'ok'), erro = h => banner('🚨 ' + h + ' <b>Não clique em Gravar.</b> Chame o Dr. Marcel.', 'err');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const prm = win.Sys && win.Sys.WebForms && win.Sys.WebForms.PageRequestManager ? win.Sys.WebForms.PageRequestManager.getInstance() : null;
  const esperaPB = ms => new Promise(res => { let f = false; const fim = () => { if (!f) { f = true; res(); } }; if (prm) { const h = () => { prm.remove_endRequest(h); fim(); }; prm.add_endRequest(h); } setTimeout(fim, ms || 5000); });
  const contador = () => { const m = (document.body.innerText + '\\n' + doc.body.innerText).match(/[ÚU]ltima nota emitida:\\s*(\\d+)/i); return m ? parseInt(m[1], 10) : null; };
  function campo(id, v) { const e = doc.getElementById(id); if (!e) return false; e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.dispatchEvent(new Event('blur', { bubbles: true })); return true; }
  function sel(id, v) { const e = doc.getElementById(id); if (!e) return false; if (!Array.from(e.options).some(o => o.value === v)) { console.error('[Urolaser NF] opção', v, 'não existe em', id, Array.from(e.options).map(o => o.value + ':' + o.text)); return false; } e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); return true; }
  function selTexto(id, re) { const e = doc.getElementById(id); if (!e) return null; const o = Array.from(e.options).find(x => re.test(x.text)); if (!o) return false; e.value = o.value; e.dispatchEvent(new Event('change', { bubbles: true })); return true; }
  async function pb(id) { if (!PERMITIDOS.includes(id)) throw new Error('postback não permitido ' + id); win.__doPostBack(id, ''); await esperaPB(5000); }
  async function passoSel(id, v, nome) { if (!sel(id, v)) throw new Error(nome + ' (' + v + ') não está disponível no site.'); await pb(id); }

  const c0 = contador();
  if (c0 === null) { erro('Não consegui ler "Última nota emitida" na tela. Recarregue a página e tente de novo.'); win.__urolaserRodando = false; return; }
  const limite = setTimeout(() => erro('Passou de 2 minutos e o preenchimento não terminou.'), 120000);
  try {
    passo('(1/6) CPF do paciente. O site busca nome e endereço na Receita...');
    campo('txtCpfCnpjTom', D.cpf);
    await esperaPB(6000); await sleep(1500);

    passo('(2/6) Descrição e valor...');
    campo('txtDescServicos', D.descricao);
    await sleep(300);

    passo('(3/6) Medicina: atividade 401, tributação 04.01.01, NBS 1.2301.22.00...');
    await passoSel('ddlAtivMunicipal', '401', 'Atividade municipal 401 (Medicina)');
    await passoSel('ddlTrbNacional', '040101', 'Tributação nacional 040101');
    if (!sel('ddlNBS', '123012200')) throw new Error('NBS 1.2301.22.00 não está disponível no site.');
    const valor = Number(D.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    campo('txtTotalServicos', valor); await sleep(800);

    passo('(4/6) ISS 3,5% não retido...');
    await passoSel('ddlTribISSQN', '17', 'Operação tributável');
    await passoSel('ddlRegimeEspecial', '0', 'Regime especial Nenhum');
    if (selTexto('ddlTipoRetencao', /n[aã]o retido/i) === false) throw new Error('Opção "Não Retido" do ISS não encontrada.');

    passo('(5/6) Federais não retidos...');
    await passoSel('ddlSitTribFederal', '01', 'Situação tributária federal 01');
    const rf = selTexto('ddlTipoRetFederal', /n[aã]o retid/i);
    if (rf === false) throw new Error('Opção "PIS/COFINS/CSLL Não Retidos" não encontrada.');
    if (rf) await pb('ddlTipoRetFederal');

    passo('(6/6) IBS/CBS por último: 030102 / 200 / 200029...');
    await passoSel('ddlIndicadorOperacao', '030102', 'Indicador de operação 030102');
    await passoSel('ddlSituacaoTributaria', '200', 'Situação tributária IBS/CBS 200');
    await passoSel('ddlClassificacaoTributaria', '200029', 'Classificação tributária 200029');
    clearTimeout(limite);

    const conf = [['txtCpfCnpjTom', v => v.replace(/\\D/g, '') === D.cpf.replace(/\\D/g, '')], ['txtTotalServicos', v => v.replace(/\\D/g, '') === valor.replace(/\\D/g, '')],
      ['ddlAtivMunicipal', v => v === '401'], ['ddlTrbNacional', v => v === '040101'], ['ddlNBS', v => v === '123012200'], ['ddlTribISSQN', v => v === '17'],
      ['ddlIndicadorOperacao', v => v === '030102'], ['ddlSituacaoTributaria', v => v === '200'], ['ddlClassificacaoTributaria', v => v === '200029']];
    const errados = conf.filter(([id, f]) => { const e = doc.getElementById(id); return !e || !f(String(e.value || '')); }).map(x => x[0]);
    const desc = doc.getElementById('txtDescServicos'); if (desc && desc.value.trim() !== D.descricao) errados.push('txtDescServicos');
    const nomeTom = (doc.getElementById('txtRazaoSocialTom') || {}).value || '';
    const c1 = contador();
    if (c1 !== c0) { erro('O contador de notas mudou de ' + c0 + ' para ' + c1 + ' durante o preenchimento. Confira em "Consultar NFS-e".'); return; }
    if (errados.length) { erro('Estes campos não ficaram certos: ' + errados.join(', ') + '. Confira um por um.'); return; }
    ok('Preenchido para <b>' + (nomeTom || D.nome) + '</b>, R$ ' + valor + '. Confira o nome do tomador e o município de incidência do IBS/CBS. Clique em <b>GRAVAR UMA VEZ SÓ</b> e, na pergunta do certificado digital, clique <b>Não</b>. A próxima nota será a ' + (c0 + 1) + '. Depois registre o número na área Operação.');
  } catch (e) {
    clearTimeout(limite); erro('Parei no meio: ' + (e.message || e));
  } finally { win.__urolaserRodando = false; }
})();`;
};
