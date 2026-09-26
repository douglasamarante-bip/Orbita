# Órbita — Railway

Aplicativo web para agências e clientes: calendário, publicações, aprovação, histórico, dashboard e integrações Meta/Google.

## Estado desta entrega

- Portado de Workers para Next.js/Node 24, com Dockerfile próprio.
- Build de produção e oito testes de autenticação, permissões, aprovação e armazenamento passaram.
- Projeto Railway criado: orbita, ID 8209a05a-37f8-4722-9fca-014017cd5bca.
- Ambiente production: 1be9f495-22c8-4931-8ced-ae18e4145254.
- O código ainda NÃO foi publicado no Railway. Falta conectar o repositório GitHub de origem.
- Dados da hospedagem anterior NÃO foram migrados. Não exclua a versão anterior caso já tenha cadastrado conteúdo nela.

## Publicar

1. Envie os arquivos deste diretório para um repositório GitHub conectado ao Railway.
2. No projeto orbita, crie um serviço usando esse repositório. O Dockerfile está na raiz.
3. Adicione um volume persistente ao serviço, montado em `/data`. Use uma réplica: SQLite e os arquivos ficam nesse volume.
4. Gere o domínio do serviço e configure `APP_ORIGIN=https://dominio.up.railway.app`.
5. Configure `TOKEN_ENCRYPTION_KEY`, `SETUP_TOKEN` e `SCHEDULER_SECRET` com três segredos aleatórios diferentes. Cada um pode ser gerado com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
6. Configure `DATA_DIR=/data`, `MIGRATIONS_DIR=/app/drizzle`, `SCHEDULER_ENABLED=true`, `MEDIA_DELIVERY_ENABLED=true` e `META_GRAPH_VERSION=v25.0`.
7. Publique. O healthcheck é `/api/health`.
8. Abra `https://dominio.up.railway.app/entrar?setup=VALOR_DO_SETUP_TOKEN` e crie a conta da agência. O token só cria o primeiro administrador. Remova SETUP_TOKEN após configurar.
9. Cadastre marcas com o e-mail do cliente. O botão Copiar convite gera um convite individual válido por sete dias. Compartilhe-o diretamente com o respectivo cliente.

## Integrações

Cadastre as credenciais `META_APP_ID`, `META_APP_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Redirecionamentos OAuth:
- `APP_ORIGIN/api/oauth/meta`
- `APP_ORIGIN/api/oauth/google`

A autorização e as permissões dos provedores precisam ser concluídas e testadas com contas reais. Essas credenciais não acompanham o pacote.
O agendador interno consulta a fila a cada 30 segundos. Não depende de uma aba aberta. Falhas de publicação ambíguas exigem conferência na rede social antes de repetir, para evitar posts duplicados.
As mídias continuam protegidas para usuários; as URLs de leitura usadas pela Meta contêm uma chave individual. Não compartilhe essas URLs fora do fluxo de publicação.
Google Agenda: sincronização manual, unidirecional, para uma agenda exclusiva. Métricas: sincronização manual; crescimento de seguidores representa variação líquida desde as coletas disponíveis, sem histórico inventado.

## Desenvolvimento

Node 24. Use `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm dev`.
Configure as variáveis em `.env.local`; para desenvolvimento, `DATA_DIR` pode ser uma pasta local e `MIGRATIONS_DIR` o caminho absoluto para `drizzle`.
Validação: `pnpm test`, `pnpm build`.
O banco recebe migrações numeradas, uma vez por arquivo. Não altere migrações já aplicadas.
