# PRISM — 3D Spatial Architecture Transformer 🌐✨

> Transforme esquemáticos planos e diagramas técnicos 2D em gêmeos digitais 3D interativos, espaciais e colaborativos em tempo real.

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://prism-teal-one.vercel.app)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%202.0-black?style=for-the-badge&logo=three.js)](https://threejs.org)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7%20Serverless-DC382D?style=for-the-badge&logo=redis)](https://redis.io)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash%20Vision-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

🔗 **Aplicação em Produção na Vercel:** [https://prism-teal-one.vercel.app](https://prism-teal-one.vercel.app)

---

## 🌟 O que é o PRISM?

O **PRISM** é uma plataforma SaaS de engenharia visual que converte arquiteturas de software, esquemáticos de nuvem e topologias de rede em **espaços tridimensionais cinemáticos a 60 FPS**.

Utilizando raciocínio espacial multimodal do **Google Gemini 2.5 Flash Vision**, o PRISM interpreta imagens de arquiteturas desenhadas à mão, exportações de ferramentas como Draw.io, arquivos Mermaid ou manifests Docker Compose, instanciando componentes com malhas tridimensionais, feixes de partículas e telemetria ao vivo.

---

## 🚀 Funcionalidades Principais

### 1. Ingestão Inteligente e Multimodal
- **Visão Computacional por IA**: Carregue imagens (PNG, JPG, SVG, WEBP). O **Google Gemini 2.5 Flash Vision** identifica nós, estereótipos, topologias e caixas de contenção com precisão geométrica.
- **Parsers Estruturados Nativos**: Suporte completo a **Draw.io XML (`<mxGraphModel>`)**, **Mermaid.js**, **Docker Compose YAML** e **JSON estruturado**.
- **Validação Estrita de Chaves**: Proteção de cota e diagnóstico em tempo real sem geração de mocks falsos.

### 2. Estúdio 3D Cinemático & Modos de Visualização
- **Navegação Orbital 360°**: Câmera livre sem limites angulares, enquadramento dinâmico por *bounding box* e presets táticos (*Overview*, *Top-Down*, *Isometric*).
- **Manipulação Direta (Gizmo & Drag 3D)**: Arraste nós diretamente no espaço com anéis de solo, eixos de coordenadas e conexões dinâmicas que recalculam caminhos em tempo real.
- **Multivisualização Universal**:
  - **Modo 3D**: Renderização volumétrica com shaders GLSL e iluminação de estúdio.
  - **Modo 2D Canvas**: Visualização plana de diagramação técnica tradicional.
  - **Split View (2D + 3D)**: Canvas 2D e Viewport 3D sincronizados lado a lado.
  - **3D Builder**: Paleta de nós com conexões magnéticas desenhadas ao vivo.

### 3. Colaboração em Tempo Real (Multiplayer)
- **Presença Distribuída via Redis**: Veja os cursores tridimensionais de colegas de equipe flutuando no espaço com interpolação suave (*lerp*).
- **Sincronização Bidirecional**: Alterações em nós, propriedades e conexões refletem instantaneamente entre usuários em 3D, 2D e Split View.
- **Modo Apresentador**: Compartilhe a posição de câmera e foco com todos os participantes simultaneamente.

### 4. Inteligência Artificial & Engenharia de Decisões
- **AI Copilot Arquitetural**: Converse com a IA diretamente no estúdio para sugerir melhorias de escalabilidade, resiliência e segurança.
- **Gerador de ADRs (Architecture Decision Records)**: Gere registros de decisão arquitetural formatados no padrão de Michael Nygard com exportação em Markdown.
- **Visual Diff Tridimensional**: Compare versões do diagrama em 3D com destaque cromático de adições (verde), modificações (amarelo) e remoções (vermelho).

### 5. Multi-Workspace & Gestão de Equipes
- **Espaço Pessoal Padrão + Workspaces Compartilhados**: Todo usuário possui seu workspace pessoal nativo e pode transitar entre workspaces corporativos com 1 clique.
- **Convites Seguros por Token**: Links de convite protegidos com validação criptográfica (sem invasão via enumeração de slug).
- **Controle de Acesso RBAC**: Papéis de `admin`, `editor` e `viewer` rigorosamente aplicados na API.

### 6. Telemetria e Monitoramento HUD
- **Gateway de Chaves de Ingestão**: Emita chaves seguras para suas aplicações publicarem métricas no PRISM.
- **Live Monitoring HUD**: Métricas de latência, taxa de erros e requisições/segundo projetadas diretamente sobre os nós 3D via pub/sub em tempo real.

### 7. Exportação Universal
- **Formatos Suportados**: **glTF / GLB 2.0 (3D)**, **Draw.io XML** (com sanitização contra XML Injection), **Mermaid**, **Markdown** e **JSON**.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15.5, React 19, TypeScript | App Router, Server Components e Client Hooks |
| **3D & Shaders** | Three.js, React Three Fiber, Drei, PostProcessing | Renderização WebGL 2.0 a 60 FPS, Shaders GLSL de piso |
| **Animações** | Lenis Scroll, GSAP 3, Framer Motion | Scroll inercial cinemático e micro-interações táteis |
| **Estilização** | Tailwind CSS, Lucide Icons | Design System técnico de CAD com alto contraste |
| **Banco de Dados** | PostgreSQL 16 (Supabase) + Prisma ORM 6.4 | Persistência relacional, migrations e RLS |
| **Cache & Pub/Sub**| Redis 7 (Upstash Serverless com TLS) | Rate limiting atômico, sessões JWT e multiplayer |
| **IA & Visão** | Google Gemini 2.5 Flash Vision API | Interpretação espacial e copilot de arquitetura |
| **Billing** | Stripe Node.js SDK | Checkout e webhooks com assinatura criptográfica |
| **Deploy** | Vercel Edge & Serverless Functions | Hospedagem global de alta disponibilidade |

---

## 🔒 Segurança e Hardening de Nível Bancário

- **JWT Fail-Closed**: Em produção, tokens só são emitidos com segredos verificados de no mínimo 32 caracteres.
- **Proteção contra Injeções**: Sanitização estrita contra XML Injection (XXE/XSS) em exportações Draw.io e queries parametrizadas no Prisma.
- **Serverless Warm Connection Pooling**: O PrismaClient e o RedisClient são preservados em `globalThis` para reaproveitamento em warm lambdas na Vercel.
- **Content Security Policy (CSP)**: Headers HTTP restritos contra Clickjacking (`X-Frame-Options: DENY`), MIME-sniffing e canais não-criptografados.
- **Conformidade LGPD / GDPR**: Banner de consentimento de cookies com controle granular e páginas legais (`/privacy`, `/terms`, `/cookies`, `/refund`).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 20+ ou 22+
- Docker e Docker Compose (para PostgreSQL e Redis locais)

### 1. Clonar o Repositório
```bash
git clone https://github.com/MarcoBruschi/3d-diagram-transformer.git
cd 3d-diagram-transformer
```

### 2. Subir os Bancos de Dados Locais via Docker
```bash
docker compose up -d postgres redis
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Preencha a sua `GEMINI_API_KEY` (obtida gratuitamente no [Google AI Studio](https://aistudio.google.com)).

### 4. Instalar as Dependências e Inicializar o Banco
```bash
npm install
npx prisma db push
npx prisma db seed
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🧪 Suíte de Testes Automatizados

Para rodar a bateria de testes de aceitação de ponta a ponta (12 cenários de autenticação, cotas, templates, ADRs, exports e mutações multiplayer):

```bash
npm run test:acceptance
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.

Desenvolvido com excelência por **Marco Bruschi**.
