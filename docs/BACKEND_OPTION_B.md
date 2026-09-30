# Backend & Database Architecture — Option B (Full SaaS Tier 1 & Tier 2)

## 📌 Visão Geral da Expansão

A arquitetura de backend da **Opção B** foi expandida para contemplar todo o roadmap de produto do SaaS **3D Diagram Transformer**, cobrindo o **Tier 1 (Core SaaS & Monetização)**, **Tier 2 (Diferenciadores Competitivos)** e fundações do **Tier 3 (ADRs & Enterprise)**:

---

## 🗄️ Novos Modelos no PostgreSQL (Prisma ORM)

Configurados em [`prisma/schema.prisma`](file:///c:/Users/mabru/Documents/3d-diagram-transformer/prisma/schema.prisma):

1. **`organizations` (Billing & Quotas)**:
   - `plan`: `'free'` | `'pro'` | `'enterprise'`.
   - `subscriptionStatus`: `'active'` | `'past_due'` | `'canceled'`.
   - `stripeCustomerId`, `subscriptionId`, `priceId`, `currentPeriodEnd`.
   - Regra de Negócio: No plano **Free**, limite estrito de **5 diagramas**. Criação do 6º diagrama é bloqueada com status `402 Payment Required`.

2. **`diagram_comments` (Comentários Ancorados no 3D)**:
   - `nodeId`: Ancorado a um nó específico do diagrama 3D.
   - `position3D`: Coordenadas `{ x, y, z }` no espaço tridimensional.
   - `mentions`: Menção de usuários (`@colleague`).
   - `resolved`: Controle de status para revisões de arquitetura.

3. **`diagram_templates` (Templates & Marketplace)**:
   - `category`: Categorias arquiteturais (`aws`, `kubernetes`, `microservices`, `ai-rag`, `iot`).
   - `isPublic`: Suporte a templates da comunidade e templates privados da organização.
   - `downloadsCount`: Contador de utilizações e popularidade.

4. **`telemetry_sources` & `node_metrics` (Live Monitoring / Webhooks)**:
   - `apiKey`: Chave de ingestão para webhooks do Datadog, Prometheus e Grafana (`X-Telemetry-Key`).
   - `status`: `'healthy'` | `'warning'` | `'critical'` | `'offline'`.
   - Atualiza cor e status dos nós em tempo real via Redis.

5. **`diagram_adrs` (Architecture Decision Records)**:
   - Registro de decisões arquiteturais gerado automaticamente pela IA (Gemini 2.5) ou manualmente.
   - Exportação completa em formato Markdown padronizado (Michael Nygard).

---

## 🔌 Mapa Completo de Endpoints da API

### Tier 1 — Core SaaS (Monetização & Persistência)
* `POST /api/auth/register` — Cria organização, usuário admin, password hash e JWT.
* `POST /api/auth/login` — Autenticação com rate limiting.
* `POST /api/auth/refresh` — Rotação de tokens e validação de revogação no Redis.
* `GET  /api/auth/me` — Perfil do usuário e detalhes do plano da organização.
* `POST /api/auth/logout` — Revogação de sessão no Redis.
* `GET  /api/diagrams` — Listagem paginada e filtrada (com lazy loading do grafo JSONB).
* `POST /api/diagrams` — Criação de diagrama (com validação de quota: máx. 5 no plano Free).
* `GET  /api/diagrams/:id` — Recuperação completa com nós e conexões.
* `PUT  /api/diagrams/:id` — Atualização com criação automática de histórico em `diagram_versions`.
* `DELETE /api/diagrams/:id` — Exclusão e registro de auditoria.
* `POST /api/diagrams/:id/duplicate` — Clonagem do diagrama.
* `POST /api/diagrams/:id/share` — Geração de link público com token único.
* `GET  /api/diagrams/shared/:token` — Leitura pública com cache no Redis (15 min).
* `POST /api/billing/checkout` — Criação de sessão de checkout Stripe Pro.
* `POST /api/billing/portal` — Portal do cliente Stripe para gestão de cartões/faturas.
* `POST /api/billing/webhook` — Processamento de eventos de assinatura Stripe.

### Tier 2 — Diferenciadores Competitivos
* **Multiplayer & Presença 3D**:
  * `POST /api/collaborate/:id` — Envio de cursores 3D `{ x, y, z }` com heartbeat de 30s.
  * `GET  /api/collaborate/:id` — Lista de participantes simultâneos.
  * `POST /api/collaborate/:id/presenter` — Modo Apresentador: sincroniza a câmera de todos os espectadores.
  * `GET  /api/collaborate/:id/presenter` — Recupera o ponto de vista atual do apresentador.
* **Comentários Ancorados no 3D**:
  * `GET    /api/diagrams/:id/comments` — Lista comentários com autores e coordenadas 3D.
  * `POST   /api/diagrams/:id/comments` — Novo comentário ancorado a um nó ou posição.
  * `PATCH  /api/diagrams/:id/comments/:commentId` — Resolver/reabrir ou editar comentário.
  * `DELETE /api/diagrams/:id/comments/:commentId` — Excluir comentário.
* **AI Copilot com Mutação no Grafo**:
  * `POST /api/ai/copilot` — Instruções em linguagem natural (ex: *"adicione um cache Redis entre o gateway e o auth"*) retornando deltas de nós/arestas e versão atualizada.
* **Exportação Avançada Multi-Formato**:
  * `GET /api/diagrams/:id/export?format=mermaid` — Exporta código fonte Mermaid.
  * `GET /api/diagrams/:id/export?format=drawio` — Exporta XML padrão draw.io.
  * `GET /api/diagrams/:id/export?format=markdown` — Relatório de arquitetura completo em Markdown.
  * `GET /api/diagrams/:id/export?format=json` — Backup do grafo JSON.
* **Architecture Diff**:
  * `GET /api/diagrams/:id/diff?v1=1&v2=2` — Comparação semântica entre versões (nós adicionados, removidos e modificados).
* **Templates & Marketplace**:
  * `GET  /api/templates` — Galeria de templates públicos e corporativos.
  * `POST /api/templates` — Publicar diagrama como template.
  * `POST /api/templates/:id/instantiate` — Criar novo diagrama a partir de template.
* **Telemetria Real (Live Monitoring)**:
  * `GET  /api/telemetry/sources` — Lista fontes e chaves de API para integrações.
  * `POST /api/telemetry/sources` — Gera nova chave `diag_tel_...` para Datadog/Prometheus.
  * `POST /api/telemetry/ingest` — Webhook receiver que atualiza nós no banco e via Redis.
  * `GET  /api/telemetry/:diagramId` — Métricas ativas e status dos nós do diagrama.

### Tier 3 — Documentação & Decisões
* `POST /api/ai/adr` — Geração automática de Architecture Decision Records com exportação Markdown.
* `GET  /api/health` — Monitoramento de integridade do PostgreSQL e Redis.

---

## 💻 Consumo Frontend Unificado

O SDK cliente [`src/lib/services/apiClient.ts`](file:///c:/Users/mabru/Documents/3d-diagram-transformer/src/lib/services/apiClient.ts) centraliza todos os métodos:

```typescript
import { api } from '@/lib/services/apiClient';

// 1. Upgrade de Plano
const { url } = await api.billing.createCheckout();
window.location.href = url;

// 2. Modificação por IA (Copilot)
const result = await api.ai.copilotMutate(diagramId, "Adicione um Redis cache antes do serviço de pedidos", true);

// 3. Comentários em Nós 3D
await api.comments.create(diagramId, {
  nodeId: "db-primary",
  content: "@carlos precisamos configurar replicação síncrona aqui.",
});

// 4. Modo Apresentador 3D
await api.collaborate.broadcastCamera(diagramId, [15, 8, 20], [0, 0, 0]);

// 5. Comparar Versões (Diff)
const diff = await api.diagrams.getDiff(diagramId, 1, 2);

// 6. Gerar ADR em Markdown
const { markdown } = await api.ai.generateAdr(diagramId, "Migração para Arquitetura Orientada a Eventos");
```
