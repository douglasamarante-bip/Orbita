export const config = {
  schedule: '* * * * *',
};

export default async function handler() {
  if (process.env.SCHEDULER_ENABLED !== 'true') return;

  const origin = (process.env.APP_ORIGIN || process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL || '').replace(/\/+$/, '');
  const secret = process.env.SCHEDULER_SECRET;
  if (!origin || !secret) {
    throw new Error('Configure APP_ORIGIN e SCHEDULER_SECRET para ativar o agendador.');
  }

  const response = await fetch(origin + '/.netlify/functions/orbita-publish-background', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + secret },
    body: '{}',
    signal: AbortSignal.timeout(10000),
  });

  if (response.status !== 202) {
    throw new Error('Não foi possível iniciar a função de publicação: HTTP ' + response.status);
  }
}
