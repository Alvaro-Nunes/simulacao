const CARTAO_ACRESCIMOS_ORIGINAIS = [
  3.04, 3.65, 4.40, 5.15, 5.92, 6.70, 7.84, 8.65, 9.47,
  10.30, 11.14, 12.01, 13.52, 14.42, 15.33, 16.26, 17.19, 18.14
].map((percentual) => percentual / 100);

const CARTAO_REFERENCIA_MENSAL = [
  3.04, 2.42, 2.18, 2.04, 1.95, 1.89, 1.92, 1.88, 1.85,
  1.82, 1.80, 1.79, 1.86, 1.85, 1.84, 1.83, 1.82, 1.82
];

const LOJAS = {
  elite: {
    nome: "Elite Veículos",
    descricao: "Veja as condições de pagamento para o seu próximo veículo.",
    logoClaro: "assets/elite-tema-claro.png",
    logoEscuro: "assets/elite-tema-escuro.png",
    parcelasBoleto: [12, 24, 36],
    taxasBoleto: { 12: 0.04, 24: 0.035, 36: 0.032 }
  },
  itroca: {
    nome: "iTroca Phone",
    descricao: "Veja as condições de pagamento para seu próximo iPhone.",
    logoClaro: "assets/itroca-tema-claro.png",
    logoEscuro: "assets/itroca-tema-escuro.png",
    parcelasBoleto: [6, 12, 18],
    taxasBoleto: { 6: 0.04, 12: 0.037, 18: 0.035 }
  }
};

const app = document.querySelector("#app");
const storeSelect = document.querySelector("#store-select");
const simulator = document.querySelector("#simulator");
const brand = document.querySelector("#brand-home");
const brandLogo = document.querySelector("#brand-logo");
const brandName = document.querySelector("#brand-name");
const themeToggle = document.querySelector("#theme-toggle");
const themeLabel = document.querySelector("#theme-label");
const storeSwitch = document.querySelector("#store-switch");
const adminOpen = document.querySelector("#admin-open");
const productInput = document.querySelector("#product-value");
const entryInput = document.querySelector("#down-payment");
const installmentsSelect = document.querySelector("#installments");
const resultEmpty = document.querySelector("#result-empty");
const resultContent = document.querySelector("#result-content");
const adminDialog = document.querySelector("#admin-dialog");
const restoreDialog = document.querySelector("#restore-dialog");

let lojaAtual = "elite";
let lojaAdmin = "elite";
let formaPagamento = "boleto";
let configuracoes = {
  elite: carregarConfiguracoes("elite"),
  itroca: carregarConfiguracoes("itroca")
};

function configuracaoPadrao(loja) {
  return {
    fatorPlanilha: 0.2,
    taxasBoleto: { ...LOJAS[loja].taxasBoleto },
    acrescimosCartao: Object.fromEntries(CARTAO_ACRESCIMOS_ORIGINAIS.map((taxa, indice) => [indice + 1, taxa]))
  };
}

function configuracaoValida(loja, config) {
  if (!config || typeof config !== "object" || !Number.isFinite(config.fatorPlanilha) || config.fatorPlanilha < 0) return false;
  return LOJAS[loja].parcelasBoleto.every((prazo) => Number.isFinite(config.taxasBoleto?.[prazo]) && config.taxasBoleto[prazo] >= 0)
    && Array.from({ length: 18 }, (_, indice) => indice + 1).every((prazo) => Number.isFinite(config.acrescimosCartao?.[prazo]) && config.acrescimosCartao[prazo] >= 0);
}

function carregarConfiguracoes(loja) {
  const padrao = configuracaoPadrao(loja);
  try {
    const salvo = JSON.parse(localStorage.getItem(`simulador-config-${loja}`));
    return configuracaoValida(loja, salvo) ? salvo : padrao;
  } catch {
    return padrao;
  }
}

function salvarConfiguracoes(loja) {
  try {
    localStorage.setItem(`simulador-config-${loja}`, JSON.stringify(configuracoes[loja]));
    return true;
  } catch {
    return false;
  }
}

function definirTema(tema) {
  const escuro = tema === "dark";
  app.dataset.theme = escuro ? "dark" : "light";
  themeLabel.textContent = escuro ? "Tema claro" : "Tema escuro";
  themeToggle.setAttribute("aria-label", escuro ? "Ativar tema claro" : "Ativar tema escuro");
  document.querySelector(".theme-glyph").textContent = escuro ? "☼" : "◐";
  try { localStorage.setItem("simulador-tema", app.dataset.theme); } catch {}
  atualizarIdentidade();
}

function atualizarIdentidade() {
  const loja = LOJAS[lojaAtual];
  const caminhoLogo = app.dataset.theme === "dark" ? loja.logoEscuro : loja.logoClaro;
  app.dataset.shop = lojaAtual;
  brand.dataset.shop = lojaAtual;
  brandLogo.src = caminhoLogo;
  brandLogo.alt = loja.nome;
  brandName.textContent = loja.nome;
  document.querySelector("#shop-title").textContent = loja.nome;
  document.querySelector("#shop-description").textContent = loja.descricao;
  for (const [id, dados] of Object.entries(LOJAS)) {
    const logo = document.querySelector(`[data-shop-choice="${id}"] img`);
    logo.src = app.dataset.theme === "dark" ? dados.logoEscuro : dados.logoClaro;
  }
  document.querySelector("meta[name='theme-color']").content = app.dataset.theme === "dark" ? "#17191c" : "#f3f4f5";
}

function mostrarSelecaoLojas() {
  storeSelect.hidden = false;
  simulator.hidden = true;
  storeSwitch.hidden = true;
  adminOpen.hidden = true;
}

function mostrarSimulador() {
  storeSelect.hidden = true;
  simulator.hidden = false;
  storeSwitch.hidden = false;
  adminOpen.hidden = false;
}

function escolherLoja(loja) {
  if (!LOJAS[loja]) return;
  const anterior = lojaAtual;
  const prazoAnterior = Number(installmentsSelect.value);
  lojaAtual = loja;
  atualizarIdentidade();
  atualizarOpcoesParcelas(prazoAnterior);
  if (anterior !== loja) limparResultado();
  mostrarSimulador();
}

function obterPrazos() {
  return formaPagamento === "boleto"
    ? LOJAS[lojaAtual].parcelasBoleto
    : Array.from({ length: 18 }, (_, indice) => indice + 1);
}

function atualizarOpcoesParcelas(prazoPreferido) {
  const prazos = obterPrazos();
  installmentsSelect.replaceChildren(...prazos.map((prazo) => {
    const opcao = document.createElement("option");
    opcao.value = prazo;
    opcao.textContent = `${prazo}x`;
    return opcao;
  }));
  installmentsSelect.value = prazos.includes(prazoPreferido) ? String(prazoPreferido) : String(prazos[0]);
  document.querySelector("#installments-label").textContent = formaPagamento === "boleto" ? "Parcelas no boleto" : "Parcelas no cartão";
  document.querySelector("#installments-hint").textContent = formaPagamento === "boleto"
    ? `Opções disponíveis: ${prazos.join(", ")} parcelas.`
    : "Escolha de 1 a 18 parcelas.";
}

function limparErros() {
  for (const id of ["product", "entry", "installments"]) {
    document.querySelector(`#${id}-error`).textContent = "";
  }
  for (const input of [productInput, entryInput, installmentsSelect]) input.removeAttribute("aria-invalid");
  document.querySelector("#form-error").hidden = true;
}

function mostrarErroCampo(id, mensagem) {
  const inputId = id === "product" ? "product-value" : id === "entry" ? "down-payment" : "installments";
  document.querySelector(`#${id}-error`).textContent = mensagem;
  document.querySelector(`#${inputId}`).setAttribute("aria-invalid", "true");
}

function lerValorMonetario(valor) {
  let texto = valor.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!texto) return null;
  if (texto.includes(",")) {
    if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(texto)) return NaN;
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(texto)) {
    texto = texto.replace(/\./g, "");
  } else if (!/^-?\d+(?:\.\d{1,2})?$/.test(texto)) {
    return NaN;
  }
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : NaN;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function calcularParcelaFixa(valorPresente, taxa, quantidade) {
  if (taxa === 0) return valorPresente / quantidade;
  return valorPresente * taxa / (1 - Math.pow(1 + taxa, -quantidade));
}

function validarSimulacao() {
  limparErros();
  const produto = lerValorMonetario(productInput.value);
  const entrada = entryInput.value.trim() ? lerValorMonetario(entryInput.value) : 0;
  let valido = true;
  if (produto === null) { mostrarErroCampo("product", "Informe o valor do produto."); valido = false; }
  else if (!Number.isFinite(produto)) { mostrarErroCampo("product", "Informe um valor monetário válido."); valido = false; }
  else if (produto <= 0) { mostrarErroCampo("product", "O valor do produto deve ser maior que zero."); valido = false; }
  if (entrada === null || !Number.isFinite(entrada)) { mostrarErroCampo("entry", "Informe um valor de entrada válido."); valido = false; }
  else if (entrada < 0) { mostrarErroCampo("entry", "A entrada não pode ser negativa."); valido = false; }
  else if (Number.isFinite(produto) && entrada > produto) { mostrarErroCampo("entry", "A entrada não pode ser maior que o valor do produto."); valido = false; }
  const quantidade = Number(installmentsSelect.value);
  if (!obterPrazos().includes(quantidade)) { mostrarErroCampo("installments", "Selecione uma quantidade de parcelas válida."); valido = false; }
  return valido ? { produto, entrada, quantidade } : null;
}

function calcularBoleto(produto, entrada, quantidade) {
  const config = configuracoes[lojaAtual];
  const valorLiquido = produto - entrada;
  // As duas planilhas aplicam este acréscimo antes de calcular o PMT.
  const valorBase = valorLiquido * (1 + config.fatorPlanilha);
  const taxa = config.taxasBoleto[quantidade];
  const parcela = calcularParcelaFixa(valorBase, taxa, quantidade);
  let saldo = valorBase;
  const parcelas = [];
  for (let numero = 1; numero <= quantidade; numero += 1) {
    const juros = saldo * taxa;
    const amortizacao = parcela - juros;
    saldo = Math.max(0, saldo - amortizacao);
    parcelas.push({ numero, valor: parcela, juros, amortizacao, saldo });
  }
  return { produto, entrada, quantidade, parcela, totalParcelas: parcela * quantidade, totalGeral: entrada + parcela * quantidade, parcelas };
}

function calcularCartao(produto, entrada, quantidade) {
  const valorLiquido = produto - entrada;
  const acrescimo = configuracoes[lojaAtual].acrescimosCartao[quantidade];
  const totalParcelas = valorLiquido * (1 + acrescimo);
  return { produto, entrada, quantidade, parcela: totalParcelas / quantidade, totalParcelas, totalGeral: entrada + totalParcelas, parcelas: [] };
}

function renderizarResultado(resultado) {
  resultEmpty.hidden = true;
  resultContent.hidden = false;
  document.querySelector("#result-installment").textContent = formatarMoeda(resultado.parcela);
  document.querySelector("#result-count").textContent = `em ${resultado.quantidade} ${resultado.quantidade === 1 ? "parcela" : "parcelas"}`;
  document.querySelector("#result-product").textContent = formatarMoeda(resultado.produto);
  document.querySelector("#result-entry").textContent = formatarMoeda(resultado.entrada);
  document.querySelector("#result-installment-total").textContent = formatarMoeda(resultado.totalParcelas);
  document.querySelector("#result-grand-total").textContent = formatarMoeda(resultado.totalGeral);
  const detalhes = document.querySelector("#schedule-details");
  detalhes.hidden = formaPagamento !== "boleto";
  detalhes.open = false;
  if (formaPagamento === "boleto") {
    document.querySelector("#schedule-body").replaceChildren(...resultado.parcelas.map((parcela) => {
      const linha = document.createElement("tr");
      for (const valor of [parcela.numero, formatarMoeda(parcela.valor), formatarMoeda(parcela.juros), formatarMoeda(parcela.amortizacao), formatarMoeda(parcela.saldo)]) {
        const celula = document.createElement("td");
        celula.textContent = valor;
        linha.append(celula);
      }
      return linha;
    }));
  } else {
    document.querySelector("#schedule-body").replaceChildren();
  }
}

function limparResultado() {
  resultEmpty.hidden = false;
  resultContent.hidden = true;
  document.querySelector("#schedule-body").replaceChildren();
}

function formatarPercentualInput(taxa) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 }).format(taxa * 100);
}

function renderizarConfiguracoes() {
  const config = configuracoes[lojaAdmin];
  const linhasBoleto = LOJAS[lojaAdmin].parcelasBoleto.map((prazo) => `
    <div class="admin-rate">
      <label for="admin-boleto-${prazo}">${prazo}x</label>
      <input id="admin-boleto-${prazo}" data-config-key="boleto:${prazo}" type="text" inputmode="decimal" value="${formatarPercentualInput(config.taxasBoleto[prazo])}" aria-label="Taxa mensal do boleto em ${prazo} parcelas">
      <small>Taxa mensal (%)</small>
      <small class="field-error"></small>
    </div>`).join("");
  const linhasCartao = Array.from({ length: 18 }, (_, indice) => indice + 1).map((prazo) => `
    <div class="admin-rate">
      <label for="admin-cartao-${prazo}">${prazo}x</label>
      <input id="admin-cartao-${prazo}" data-config-key="cartao:${prazo}" type="text" inputmode="decimal" value="${formatarPercentualInput(config.acrescimosCartao[prazo])}" aria-label="Acréscimo total do cartão em ${prazo} parcelas">
      <small>Taxa mensal ref.: ${CARTAO_REFERENCIA_MENSAL[prazo - 1].toLocaleString("pt-BR")}%</small>
      <small class="field-error"></small>
    </div>`).join("");
  document.querySelector("#admin-content").innerHTML = `
    <section class="admin-section">
      <h3>Financiamento próprio</h3>
      <p>Taxas editáveis para os prazos desta loja. Não aparecem na proposta do cliente.</p>
      <label class="field admin-field" for="admin-fator-planilha"><span>Acréscimo da base da planilha (%)</span><input class="admin-rate-input" id="admin-fator-planilha" data-config-key="fator" type="text" inputmode="decimal" value="${formatarPercentualInput(config.fatorPlanilha)}" aria-label="Acréscimo percentual aplicado à base do boleto"><small class="field-error"></small></label>
      <div class="admin-rate-grid">${linhasBoleto}</div>
    </section>
    <section class="admin-section">
      <h3>Cartão de crédito</h3>
      <p>Acréscimo total configurável por prazo. A referência mensal abaixo é apenas administrativa e não participa do cálculo.</p>
      <div class="admin-rate-grid">${linhasCartao}</div>
    </section>`;
  document.querySelectorAll("[data-admin-shop]").forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.adminShop === lojaAdmin)));
  document.querySelector("#admin-status").textContent = "";
}

function lerPercentual(texto) {
  const valor = texto.trim().replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(valor)) return NaN;
  return Number(valor) / 100;
}

function validarConfiguracao(formulario) {
  let valido = true;
  const nova = configuracaoPadrao(lojaAdmin);
  for (const campo of formulario.querySelectorAll("[data-config-key]")) {
    const taxa = lerPercentual(campo.value);
    const erro = !Number.isFinite(taxa) || taxa < 0;
    campo.setAttribute("aria-invalid", String(erro));
    const mensagem = campo.parentElement.querySelector(".field-error");
    if (mensagem) mensagem.textContent = erro ? "Informe uma taxa válida, igual ou maior que zero." : "";
    if (erro) { valido = false; continue; }
    const [tipo, prazo] = campo.dataset.configKey.split(":");
    if (tipo === "fator") nova.fatorPlanilha = taxa;
    else if (tipo === "boleto") nova.taxasBoleto[prazo] = taxa;
    else nova.acrescimosCartao[prazo] = taxa;
  }
  return valido ? nova : null;
}

function abrirConfiguracoes() {
  lojaAdmin = lojaAtual;
  renderizarConfiguracoes();
  adminDialog.showModal();
}

document.querySelectorAll("[data-shop-choice]").forEach((botao) => botao.addEventListener("click", () => escolherLoja(botao.dataset.shopChoice)));
document.querySelector("#back-to-stores").addEventListener("click", mostrarSelecaoLojas);
storeSwitch.addEventListener("click", mostrarSelecaoLojas);
brand.addEventListener("click", (evento) => { evento.preventDefault(); mostrarSelecaoLojas(); });
themeToggle.addEventListener("click", () => definirTema(app.dataset.theme === "dark" ? "light" : "dark"));

document.querySelectorAll("input[name='payment']").forEach((radio) => radio.addEventListener("change", () => {
  if (!radio.checked) return;
  formaPagamento = radio.value;
  atualizarOpcoesParcelas(Number(installmentsSelect.value));
  limparErros();
  limparResultado();
}));

productInput.addEventListener("input", () => { productInput.removeAttribute("aria-invalid"); document.querySelector("#product-error").textContent = ""; });
entryInput.addEventListener("input", () => { entryInput.removeAttribute("aria-invalid"); document.querySelector("#entry-error").textContent = ""; });
installmentsSelect.addEventListener("change", () => { installmentsSelect.removeAttribute("aria-invalid"); document.querySelector("#installments-error").textContent = ""; });

document.querySelector("#simulation-form").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const dados = validarSimulacao();
  if (!dados) return;
  const resultado = formaPagamento === "boleto"
    ? calcularBoleto(dados.produto, dados.entrada, dados.quantidade)
    : calcularCartao(dados.produto, dados.entrada, dados.quantidade);
  renderizarResultado(resultado);
});

document.querySelector("#new-simulation").addEventListener("click", () => {
  productInput.value = "";
  entryInput.value = "";
  limparErros();
  limparResultado();
  productInput.focus();
});

adminOpen.addEventListener("click", abrirConfiguracoes);
document.querySelector("#admin-close").addEventListener("click", () => adminDialog.close());
document.querySelectorAll("[data-admin-shop]").forEach((tab) => tab.addEventListener("click", () => {
  lojaAdmin = tab.dataset.adminShop;
  renderizarConfiguracoes();
}));

document.querySelector("#admin-form").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nova = validarConfiguracao(evento.currentTarget);
  if (!nova) {
    document.querySelector("#admin-status").textContent = "Revise os campos destacados antes de salvar.";
    return;
  }
  configuracoes[lojaAdmin] = nova;
  const salvou = salvarConfiguracoes(lojaAdmin);
  renderizarConfiguracoes();
  document.querySelector("#admin-status").textContent = salvou
    ? "Configurações salvas neste navegador."
    : "Não foi possível salvar neste navegador.";
});

document.querySelector("#restore-open").addEventListener("click", () => restoreDialog.showModal());
document.querySelector("#restore-cancel").addEventListener("click", () => restoreDialog.close());
document.querySelector("#restore-confirm").addEventListener("click", () => {
  configuracoes[lojaAdmin] = configuracaoPadrao(lojaAdmin);
  const salvou = salvarConfiguracoes(lojaAdmin);
  restoreDialog.close();
  renderizarConfiguracoes();
  document.querySelector("#admin-status").textContent = salvou
    ? "Configurações originais restauradas."
    : "Valores originais aplicados; não foi possível gravá-los no navegador.";
});

try { definirTema(localStorage.getItem("simulador-tema") === "dark" ? "dark" : "light"); }
catch { definirTema("light"); }
atualizarOpcoesParcelas(LOJAS[lojaAtual].parcelasBoleto[0]);
atualizarIdentidade();
