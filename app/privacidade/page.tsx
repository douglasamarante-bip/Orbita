import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Órbita",
  description: "Como o Órbita Social Studio trata dados pessoais e informações de contas conectadas.",
};

const pageStyle = {
  minHeight: "100vh",
  background: "#080908",
  color: "#f3f4f1",
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.7,
  padding: "48px 20px",
} as const;

const contentStyle = { maxWidth: 820, margin: "0 auto" } as const;
const headingStyle = { color: "#b9d849" } as const;

export default function PrivacyPage() {
  return (
    <main style={pageStyle}>
      <article style={contentStyle}>
        <a href="/" style={{ color: "#b9d849", textDecoration: "none" }}>Órbita Social Studio</a>
        <h1 style={{ ...headingStyle, fontSize: 36, lineHeight: 1.2, marginTop: 28 }}>Política de Privacidade</h1>
        <p>Atualizada em 26 de setembro de 2026.</p>
        <p>
          Esta política explica como o Órbita Social Studio trata informações quando você usa
          a plataforma, administra uma marca, aprova publicações ou conecta uma conta profissional
          do Instagram ou uma Página do Facebook.
        </p>

        <h2 style={headingStyle}>1. Quem administra os dados</h2>
        <p>
          O Órbita Social Studio é administrado por sua equipe responsável. Para dúvidas,
          solicitações sobre dados pessoais ou pedidos de exclusão, escreva para{" "}
          <a href="mailto:amarantedouglas94@gmail.com" style={{ color: "#b9d849" }}>
            amarantedouglas94@gmail.com
          </a>.
        </p>

        <h2 style={headingStyle}>2. Dados tratados</h2>
        <p>
          Podemos tratar dados de cadastro e contato; informações das marcas e dos usuários;
          textos, imagens, vídeos, calendário e decisões de aprovação de publicações; e dados
          básicos das contas profissionais e Páginas escolhidas durante a conexão com a Meta,
          como identificadores, nomes de usuário e métricas disponibilizadas pela API.
        </p>
        <p>
          Ao conectar uma conta, você autoriza as permissões apresentadas pela Meta para os
          recursos escolhidos. O Órbita não solicita sua senha do Instagram ou do Facebook.
        </p>

        <h2 style={headingStyle}>3. Como usamos os dados</h2>
        <p>
          Usamos as informações para fornecer as funções da plataforma, organizar o trabalho entre
          agência e clientes, registrar aprovações, programar publicações, publicar conteúdo
          autorizado, exibir métricas, proteger contas e atender solicitações. O tratamento ocorre
          conforme a execução do serviço e as bases legais aplicáveis, incluindo o cumprimento de
          obrigações legais e, quando cabível, consentimento ou legítimo interesse.
        </p>

        <h2 style={headingStyle}>4. Compartilhamento, proteção e retenção</h2>
        <p>
          Os dados necessários são compartilhados com a Meta quando você conecta contas ou utiliza
          recursos de publicação e métricas. O serviço também usa provedores de hospedagem e
          infraestrutura para operar. Credenciais técnicas de conexão são armazenadas com medidas
          de proteção e não são exibidas como senhas na interface.
        </p>
        <p>
          Mantemos os dados pelo tempo necessário para operar a plataforma, cumprir obrigações
          aplicáveis e preservar registros legítimos de segurança. Você pode solicitar a exclusão
          pelo endereço de contato indicado nesta política, ressalvadas as hipóteses legais de
          conservação.
        </p>

        <h2 style={headingStyle}>5. Seus direitos e exclusão de dados</h2>
        <p>
          Nos termos da legislação aplicável, você pode solicitar confirmação de tratamento,
          acesso, correção, informação sobre compartilhamento e exclusão de dados pessoais.
          Para desconectar uma conta, use também as opções disponibilizadas pela Meta. Para pedir
          a exclusão dos dados mantidos pelo Órbita, envie um e-mail identificando sua conta e a
          marca relacionada.
        </p>

        <h2 style={headingStyle}>6. Segurança e alterações</h2>
        <p>
          Aplicamos medidas técnicas e administrativas destinadas a proteger os dados contra
          acesso não autorizado, perda e uso indevido. Nenhum serviço conectado à internet pode
          garantir segurança absoluta. Esta política pode ser atualizada; a versão vigente ficará
          disponível nesta página.
        </p>
        <p style={{ marginTop: 40 }}>
          <a href="/" style={{ color: "#b9d849" }}>Voltar ao Órbita</a>
        </p>
      </article>
    </main>
  );
}
