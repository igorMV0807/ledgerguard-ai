# LedgerGuard AI

O LedgerGuard AI é um produto de operações financeiras para conciliação de e-commerce multimarcas. Esta edição foi criada para portfólio e utiliza somente informações fictícias.

> **Status atual:** a demonstração pública está conectada a um Supabase dedicado e isolado, usando somente dados fictícios. Nenhum sistema de produção é usado.

**Demonstração ao vivo:** [ledgerguard-ai-three.vercel.app](https://ledgerguard-ai-three.vercel.app)

![Dashboard sintético do LedgerGuard AI](docs/dashboard-overview.png)

## O que foi implementado

- aplicação Next.js com TypeScript;
- dashboard responsivo em inglês;
- visão geral, exceções, automações e auditoria;
- cálculo financeiro determinístico em centavos;
- caso sintético `LG-1042` com uma diferença de £20,00;
- sessões anônimas de demonstração e decisões persistentes no Supabase isolado;
- migrations Postgres com grants explícitos, RLS, constraints, índices e seed sintético;
- Edge Function com assinatura HMAC e idempotência para eventos fictícios;
- análise limitada do Claude por schema de ferramenta, com fallback determinístico transparente;
- workflows n8n desativados e higienizados, com retry, duplicidade e tratamento de falha;
- testes de cálculo, HMAC, controles do banco e exports do n8n;
- CI, template de pull request e publicação ativa na Vercel;
- regras e agentes especializados para Claude Code;
- nenhuma credencial, dado real ou integração de produção.

## História da demonstração

1. Um pedido fictício possui valor bruto de £120,00.
2. Um reembolso de £20,00 e uma taxa de £3,50 geram repasse esperado de £96,50.
3. O repasse fictício recebido é £76,50.
4. O código encontra uma diferença de £20,00 sem utilizar IA.
5. A interface apresenta uma hipótese baseada nas evidências.
6. Um gerente aprova ou rejeita apenas a abertura de uma investigação.

Todos os números são sintéticos e não representam resultados de negócio.

## Executar

Requisitos: Node.js 22+ e pnpm 11.

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Verificar

```bash
pnpm check
```

O comando executa lint, TypeScript, testes e build de produção.

## Próximos passos de divulgação

1. gravar o vídeo usando o roteiro já preparado;
2. incluir o projeto no portfólio e no LinkedIn;
3. tornar o repositório acessível ao recrutador somente com autorização do proprietário.

Consulte o [Technical Design Document](docs/TDD.md), as [regras de segurança](docs/SECURITY.md),
o [roteiro de demonstração](docs/DEMO_SCRIPT.md), o [case de portfólio](docs/PORTFOLIO_CASE.md)
e o [pacote para candidatura](docs/APPLICATION_PACKAGE.md).

