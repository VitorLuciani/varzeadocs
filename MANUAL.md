# FRAGHOUSE — Manual de Manutenção e Configuração

Este manual explica como personalizar o site com as informações reais da sua LAN e como fazer manutenção nele no dia a dia. Não é necessário saber programar para a maior parte das alterações — quase tudo fica em arquivos `.json`, que são só listas organizadas de dados.

---

## 1. Estrutura do projeto

```
sua-pasta/
├── index.html          → estrutura das páginas (raramente precisa mexer)
├── style.css            → cores, fontes, layout (aqui você muda o visual)
├── script.js             → lógica do site (só mexa se souber JS)
└── assets/
    └── json/
        ├── jogadores.json   → cadastro dos jogadores
        ├── lans.json        → histórico das edições da LAN
        └── config.json      → servidor, playbooks, hall da fama, financeiro, etc.
```

**Regra de ouro:** para colocar os dados reais da sua LAN, você só precisa editar os 3 arquivos `.json`. O `index.html`, `style.css` e `script.js` não precisam ser tocados a não ser que você queira mudar o visual ou adicionar uma função nova.

---

## 2. Como editar `jogadores.json`

Cada jogador é um bloco `{ ... }` dentro dos colchetes `[ ]`. Copie um bloco existente e ajuste os valores para adicionar um jogador novo.

```json
{
  "id": 7,
  "nick": "SeuNick",
  "nome": "Nome Completo",
  "funcao": "IGL",
  "foto": null,
  "mapasFavoritos": ["Mirage", "Inferno"],
  "anos": 2,
  "lans": 3,
  "vitorias": 10,
  "derrotas": 8,
  "kd": 1.05,
  "adr": 74.0,
  "hs": 40,
  "rating": 1.02,
  "titulos": 1,
  "mvps": 1,
  "parceiro": "OutroNick",
  "evolucao": [0.9, 0.95, 1.0, 1.02],
  "conquistas": ["campeao", "mvp"]
}
```

**Pontos de atenção:**
- `id` precisa ser **único** — não repita o número de outro jogador.
- Depois do último bloco da lista **não** coloque vírgula. Entre blocos, sempre tem vírgula separando.
- `conquistas` é a lista de medalhas que esse jogador já desbloqueou. Os IDs válidos são os que estão em `conquistasCatalogo` dentro do `config.json` (veja seção 4.5): `campeao`, `mvp`, `ace`, `30kills`, `igl`, `clutch1x4`, `clutch1x5`, `ecoking`, `entry`, `anchor`, `flashou`, `zerokills`, `support`.
- `evolucao` é a lista de rating por LAN — usada no gráfico do perfil do jogador. Pode ter quantos números quiser.

Para **remover** um jogador, apague o bloco inteiro dele (do `{` até o `}`, incluindo a vírgula que separa do próximo).

---

## 3. Como editar `lans.json`

Cada edição da sua LAN é um bloco. Exemplo:

```json
{
  "id": 10,
  "nome": "LAN #10",
  "data": "2026-08-15",
  "jogadores": 12,
  "campeao": "Fulano & Ciclano",
  "vice": "Beltrano & Sicrano",
  "mvp": "Fulano",
  "mapas": 7,
  "obs": "Observações livres sobre a edição."
}
```

- `data` sempre no formato `AAAA-MM-DD`.
- Adicione um bloco novo a cada LAN realizada — isso alimenta automaticamente o **Histórico** e a **Timeline** de destaques recentes no dashboard.

---

## 4. Como editar `config.json`

Esse arquivo é o "painel de controle" com várias seções internas. Vou explicar cada uma.

### 4.1 Dados gerais do topo do arquivo

```json
"proximaLan": "2026-08-15T09:00:00",
"campeaoAtual": "Fulano & Ciclano",
"mvpAtual": "Fulano",
"totalLans": 9,
"totalPartidas": 214,
"totalJogadores": 6,
```

- `proximaLan` alimenta a **contagem regressiva** do Dashboard e da página "Próxima LAN". Formato: `AAAA-MM-DDTHH:MM:SS`.
- Os demais campos aparecem nos cartões de estatística do Dashboard.

### 4.2 Servidor (`servidor`)

```json
"servidor": {
  "status": "online",
  "ip": "192.168.15.10",
  "porta": "27015",
  "senha": "lan2026",
  "mapaAtual": "de_mirage",
  "jogadores": "8/10",
  "tickrate": 128,
  "matchzy": "0.8.10",
  "css": "1.0.3"
}
```

Para marcar o servidor como offline, troque `"status": "online"` para `"status": "offline"` — o indicador verde na barra lateral e a página **Servidor** mudam automaticamente.

### 4.3 Playbooks (`playbooks`)

Uma lista com um bloco por mapa (estratégias de CT/TR, execuções, posicionamentos). Para adicionar um mapa novo, copie um bloco existente e mude o conteúdo — ele aparece automaticamente na página **Playbooks**.

### 4.4 Hall da Fama (`hallDaFama`)

```json
{ "titulo": "Mais Títulos", "icone": "fa-trophy", "jogador": "Nightowl", "valor": "4 títulos" }
```

- `icone` usa nomes de ícones do [Font Awesome](https://fontawesome.com/search?o=r&m=free) (ex: `fa-fire`, `fa-skull`, `fa-medal`). Basta trocar o nome para mudar o ícone do card.

### 4.5 Catálogo de Conquistas (`conquistasCatalogo`)

Define **quais medalhas existem** no sistema. Cada jogador desbloqueia essas medalhas através do campo `conquistas` no `jogadores.json` (seção 2).

```json
{ "id": "ace", "nome": "ACE", "icone": "💣" }
```

Para criar uma medalha nova: adicione um bloco aqui com um `id` novo, e depois inclua esse mesmo `id` no array `conquistas` do jogador que a conquistou.

### 4.6 Timeline (`timeline`)

Marcos históricos da LAN, em ordem cronológica. Adicione um bloco por marco novo.

### 4.7 Galeria (`galeria`)

```json
{ "lan": "LAN #10", "cor": "#ff6b1a" }
```

Hoje a galeria usa blocos de cor no lugar de fotos reais (placeholders). Veja a seção 6 para trocar por fotos de verdade.

### 4.8 Checklist (`checklist`)

```json
{ "item": "Filtro de linha", "categoria": "Elétrica" }
```

Adicione ou remova itens da lista de preparação da LAN à vontade.

### 4.9 Financeiro (`financeiro`)

```json
"financeiro": {
  "arrecadado": 480,
  "pagantes": [
    { "nome": "Fulano", "status": "pago", "valor": 80 }
  ],
  "despesas": [
    { "categoria": "Energia", "valor": 60 }
  ]
}
```

Isso é só o valor **inicial**. Depois que o site carrega uma vez no navegador, os cliques em "Pago/Pendente" passam a ser salvos no navegador (veja seção 5) — então editar esse JSON depois não muda mais nada até você resetar os dados salvos.

---

## 5. Como funciona a parte "interativa" (Checklist, Check-in, Financeiro, Sorteio, Partidas)

Esses módulos guardam o que você marca/clica no **próprio navegador**, usando uma tecnologia chamada `localStorage`. Isso significa:

- Cada pessoa que abrir o site no próprio computador/celular vai ver o **seu próprio** progresso salvo, não o de outra pessoa.
- Se você quiser que todo mundo veja os mesmos dados (ex: todos veem o mesmo checklist marcado), seria necessário migrar para um banco de dados real — isso é uma evolução futura, não algo que dá pra fazer só editando os JSONs.
- Para **resetar** todo o progresso salvo (ex: depois de uma LAN, para começar a próxima do zero): abra o site, aperte `F12` para abrir o DevTools, vá na aba **Console** e digite:

```javascript
localStorage.removeItem('fraghouse_state_v1')
```

Depois aperte Enter e recarregue a página (`F5`). O site volta a usar os valores originais dos arquivos `.json`.

---

## 6. Trocando placeholders por fotos reais

Hoje a Galeria e os modais de detalhe da LAN usam blocos de cor no lugar de fotos (para o site funcionar sem precisar de imagens prontas). Para usar fotos reais:

1. Coloque suas fotos dentro de `assets/images/` (ex: `assets/images/lan01-01.jpg`).
2. No `script.js`, procure pela função `renderGaleria()` e pelos trechos que geram `<div class="gallery-item" ...></div>`.
3. Troque o `style="background:..."` por uma tag de imagem, por exemplo:
   ```html
   <img src="assets/images/lan01-01.jpg" style="width:100%;height:100%;object-fit:cover;">
   ```

Se preferir, me diga quantas fotos você tem por LAN e eu adapto essa parte do código para você.

---

## 7. Mudando cores e visual

Tudo isso fica no início do arquivo `style.css`, dentro do bloco `:root`:

```css
:root{
  --void:#0a0e13;      /* fundo geral (preto) */
  --panel:#12171f;     /* fundo dos cards */
  --orange:#ff5c1a;    /* cor de destaque principal */
  --blue:#2f8bff;      /* cor de destaque secundária */
  ...
}
```

Troque os códigos de cor (hexadecimais) para ajustar a identidade visual — como são variáveis, a cor muda em todo o site automaticamente, sem precisar caçar cada elemento.

---

## 8. Publicando/atualizando no GitHub Pages

Toda vez que quiser atualizar o site publicado:

1. Salve as alterações nos arquivos localmente.
2. No terminal do VS Code, dentro da pasta do projeto:
   ```
   git add .
   git commit -m "Atualiza dados da LAN #10"
   git push
   ```
3. Se o repositório já está configurado no GitHub Pages, a atualização aparece no ar em 1-2 minutos.

Se ainda não configurou o GitHub Pages, os passos são:

1. Crie um repositório no GitHub e suba os arquivos do projeto para ele.
2. Vá em **Settings → Pages** no repositório.
3. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
4. Salve — o GitHub vai gerar um link tipo `https://seuusuario.github.io/nome-do-repo/`.

---

## 9. Checklist rápido de manutenção recorrente

Depois de cada LAN realizada, o fluxo normal de atualização é:

- [ ] Adicionar um bloco novo em `lans.json` com o resultado da edição
- [ ] Atualizar `campeaoAtual` e `mvpAtual` em `config.json`
- [ ] Atualizar `vitorias`, `derrotas`, `titulos`, `mvps`, `rating` e `evolucao` de cada jogador em `jogadores.json`
- [ ] Adicionar um marco na `timeline` se algo relevante aconteceu
- [ ] Atualizar `proximaLan` em `config.json` com a data da próxima edição
- [ ] Resetar o checklist e o check-in salvos no navegador (seção 5) para a próxima edição
- [ ] Dar `git push` para publicar

---

## 10. Erros comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Site abre mas nenhum menu funciona | Erro 404 nos arquivos JSON no Console (`F12`) | Confirme que `assets/json/` está no mesmo nível do `index.html` (veja seção 1) |
| `Uncaught SyntaxError ... is not valid JSON` | Vírgula sobrando/faltando ou aspas erradas no `.json` | Copie o JSON num validador online (ex: jsonlint.com) para achar o erro exato |
| Dado editado no JSON não aparece | Módulo é "interativo" e já tem estado salvo no navegador | Resete o `localStorage` (seção 5) |
| Ícone do Hall da Fama não aparece | Nome do ícone escrito errado | Confirme o nome exato em fontawesome.com/search (versão "free") |

---

Qualquer travamento, me manda o print do Console (`F12` → aba Console) que eu leio o erro exato e te digo a linha certa pra ajustar.
