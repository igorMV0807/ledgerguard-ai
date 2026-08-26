# LedgerGuard AI

O LedgerGuard AI é um produto de operações financeiras para conciliação de e-commerce multimarcas. Esta edição foi criada para portfólio e utiliza somente informações fictícias.

> **Status atual:** fundação do projeto. A interface funciona com dados sintéticos locais. Supabase, n8n, Shopify, Claude e sistemas financeiros externos ainda não estão conectados.

![Dashboard sintético do LedgerGuard AI](docs/assets/dashboard-overview.png)

## O que já existe

- aplicação Next.js com TypeScript;
- dashboard responsivo em inglês;
- visão geral, exceções, automações e auditoria;
- cálculo financeiro determinístico em centavos;
- caso sintético `LG-1042` com uma diferença de £20,00;
- aprovação humana simulada localmente;
- testes unitários das regras de conciliação;
- CI, template de pull request e configuração pronta para Vercel;
- regras e agentes especializados para uso futuro no Claude Code;
- separação preparada para Supabase e n8n;
- nenhuma credencial, dado real ou chamada externa.

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

## Próximos marcos

1. revisar a fundação;
2. publicar o primeiro Preview na Vercel;
3. criar Supabase isolado com migrations, Auth, grants e RLS testada;
4. criar Edge Function com assinatura e idempotência;
5. criar workflow n8n com retry e falha final;
6. integrar agentes e prompts versionados;
7. preparar o case e o vídeo em inglês.

Consulte o [Technical Design Document](docs/TDD.md), as [regras de segurança](docs/SECURITY.md),
o [roteiro de demonstração](docs/DEMO_SCRIPT.md) e o [guia para entrevista](docs/INTERVIEW_GUIDE.md).
