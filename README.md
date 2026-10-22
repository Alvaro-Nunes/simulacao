# Simulador de pagamento

Site estático para simulação comercial da Elite Veículos e da iTroca Phone. Funciona somente com HTML, CSS e JavaScript, sem framework, biblioteca externa, backend ou banco de dados.

## Arquivos

- `index.html` — estrutura da seleção de loja, simulador e configurações.
- `style.css` — temas, identidade visual, acessibilidade e responsividade.
- `script.js` — validações, cálculos, persistência e renderização.
- `assets/elite-tema-claro.png` e `assets/elite-tema-escuro.png` — logotipo da Elite Veículos.
- `assets/itroca-tema-claro.png` e `assets/itroca-tema-escuro.png` — logotipo da iTroca Phone.

## Executar localmente

Abra `index.html` diretamente no navegador ou use um servidor local para reproduzir o ambiente do GitHub Pages:

```bash
python -m http.server 4173
```

Depois, acesse `http://localhost:4173`.

## Regras de cálculo

As planilhas fornecidas foram usadas como referência. Nas duas planilhas, o saldo após a entrada recebe um acréscimo de 20% antes da aplicação do `PMT` com juros compostos e parcelas fixas. Esse acréscimo fica editável na área administrativa como “Acréscimo da base da planilha”.

- Elite Veículos: boleto em 12x, 24x e 36x.
- iTroca Phone: boleto em 6x, 12x e 18x.
- Cartão: 1x a 18x, calculado somente com o acréscimo total de cada prazo informado no briefing.
- Os percentuais ficam restritos à área administrativa e não são exibidos na proposta do cliente.

As tabelas de amortização exibem valores em reais, sem mostrar a taxa mensal.

## Persistência

O tema e as configurações comerciais de cada loja são salvos no `localStorage` do navegador. Como esta é uma aplicação estática, a área administrativa é apenas uma separação de interface: não oferece segurança ou autenticação de servidor.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `style.css`, `script.js` e a pasta `assets/` para a raiz do repositório.
3. No repositório, abra **Settings** → **Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/ (root)`.
6. Clique em **Save** e aguarde a publicação.
7. Abra o endereço informado pelo GitHub Pages e teste as duas lojas, as duas formas de pagamento, os temas e a área administrativa.
