# Órbita — Netlify

Aplicativo para agências e clientes: calendário, publicações, aprovação, histórico, dashboard e integrações Meta/Instagram/Google.

## Arquitetura de produção

- **Netlify + Next.js:** interface, SSR e rotas de API.
- **Supabase PostgreSQL:** banco persistente.
- **Supabase Storage:** bucket privado para mídias, com upload direto por URL assinada.
- **Netlify Scheduled Functions:** disparo do agendador a cada minuto.
- **GitHub:** código-fonte e deploy contínuo.

O projeto mantém SQLite e arquivos locais como fallback de desenvolvimento. Em produção no Netlify, configure DATABASE_URL, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. O PostgreSQL guarda os dados e o Supabase Storage guarda as mídias.

## Publicar pelo GitHub

1. Crie um projeto PostgreSQL no Supabase. Use um projeto dedicado ao Órbita.
2. No Supabase, abra **Connect** e copie a connection string do **Transaction Pooler**. Use essa URL em DATABASE_URL no Netlify. Mantenha SSL habilitado.
3. No Netlify, importe o repositório douglasamarante-bip/Orbita e selecione a branch de produção que você decidiu publicar.
4. O arquivo netlify.toml já define o build e a pasta de publicação. O comando de build executa as migrações do banco antes do Next.js.
5. Em **Project configuration → Environment variables**, configure as variáveis abaixo. Para DATABASE_URL, habilite os escopos **Builds** e **Functions**. Para SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, habilite **Functions**.
6. Publique o site. A primeira compilação cria as tabelas PostgreSQL e o bucket privado orbita-media automaticamente.

O upload de imagens e vídeos é feito diretamente do navegador para o Supabase Storage por URL assinada. O limite configurado é 50 MB; a chave service role nunca é enviada ao navegador.

Não use output standalone nem exportação estática: o Órbita precisa das rotas de API e da autenticação no servidor.

## Variáveis do Netlify

| Variável | Obrigatória | Uso |
|---|---:|---|
| APP_ORIGIN | Sim | URL pública completa, sem barra no final |
| DATABASE_URL | Sim | Connection string do Supabase Transaction Pooler |
| SUPABASE_URL | Sim | URL do mesmo projeto Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Sim | Chave secreta usada apenas pelas funções do servidor |
| DATABASE_SSL | Não | true por padrão |
| DATABASE_POOL_MAX | Não | Conexões simultâneas; padrão 1 |
| TOKEN_ENCRYPTION_KEY | Sim | Criptografia dos tokens das integrações |
| SETUP_TOKEN | Inicialmente | Criação do primeiro administrador |
| SCHEDULER_SECRET | Sim | Protege o agendador |
| SCHEDULER_ENABLED | Sim | Use true |
| MEDIA_DELIVERY_ENABLED | Sim | Use true |
| META_GRAPH_VERSION | Sim | v25.0 |
| META_APP_ID | Para Meta | ID do aplicativo Meta |
| META_APP_SECRET | Para Meta | Segredo do aplicativo Meta |
| INSTAGRAM_APP_ID | Opcional | ID separado para Instagram Login direto |
| INSTAGRAM_APP_SECRET | Opcional | Segredo separado para Instagram Login direto |
| GOOGLE_CLIENT_ID | Opcional | OAuth do Google Agenda |
| GOOGLE_CLIENT_SECRET | Opcional | OAuth do Google Agenda |

Gere três segredos diferentes para TOKEN_ENCRYPTION_KEY, SETUP_TOKEN e SCHEDULER_SECRET, por exemplo:

~~~bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
~~~

Não coloque esses valores no GitHub. Cadastre-os somente nas variáveis de ambiente do Netlify.

## Primeiro acesso

Depois do primeiro deploy:

1. Acesse APP_ORIGIN/entrar?setup=SEU_SETUP_TOKEN.
2. Crie a conta da agência com e-mail e senha.
3. Remova SETUP_TOKEN das variáveis do Netlify e faça um novo deploy.

O token de configuração só permite criar o primeiro administrador. Os clientes continuam entrando por convites individuais.

## OAuth e Instagram

Cadastre exatamente estas URLs de callback nos respectivos painéis:

- Instagram Login direto: APP_ORIGIN/api/oauth/instagram
- Meta / Facebook Pages: APP_ORIGIN/api/oauth/meta
- Google Agenda: APP_ORIGIN/api/oauth/google

O fluxo de **Instagram Login direto** foi preservado; ele não exige que o cliente conecte uma Página do Facebook. O fluxo Meta continua disponível para formatos e permissões que dependem de uma Página vinculada.

Se usar domínio próprio, atualize APP_ORIGIN e as URLs de callback para o mesmo domínio.

## Agendamentos

O Netlify executa orbita-scheduler a cada minuto. Essa função dispara orbita-publish-background, que processa a fila sem depender de uma aba aberta. O banco possui um bloqueio para evitar que dois ciclos publiquem a mesma fila simultaneamente.

As Scheduled Functions rodam em deploys publicados. A execução em segundo plano usa o recurso Background Functions do Netlify, disponível nos planos com cobrança por créditos. Se sua conta estiver em um plano legado sem Background Functions, será necessário usar um serviço de cron externo para chamar POST /api/jobs com o cabeçalho Authorization: Bearer SEU_SCHEDULER_SECRET.

## Desenvolvimento local

Com Node.js 24 e pnpm:

~~~bash
corepack enable
pnpm install
pnpm dev
~~~

Sem DATABASE_URL, o desenvolvimento usa SQLite em .data e uploads no disco local. Para executar os testes:

~~~bash
pnpm test
pnpm build
~~~

## Migração de dados

A configuração cria um banco PostgreSQL novo. Dados que eventualmente estejam no SQLite de uma hospedagem anterior não são copiados automaticamente. Faça uma exportação/importação separada antes de remover qualquer hospedagem ou volume antigo.
