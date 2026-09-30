# Catálogo e Especificação Técnica dos Componentes 3D

> **Versão aprimorada** — expande a especificação original com estimativas de carga poligonal, tabelas de materiais PBR, fórmulas completas de animação (`useFrame`), diretrizes de otimização por componente e um apêndice de resolução semântica. Os valores de contagem de triângulos são **estimativas de engenharia** calculadas a partir dos parâmetros geométricos documentados (segmentos, subdivisões), não uma medição direta do código-fonte — use-os como guia de orçamento de performance, não como valor absoluto certificado.

Este documento reúne a especificação detalhada de todos os **19 modelos 3D procedurais**, seus componentes de suporte na cena Three.js / React Three Fiber, regras de profundidade geométrica (eixo Z local) e o sistema de **profundidade arquitetural (Z-Tier)** do projeto `3d-diagram-transformer`.

**Sumário**
1. Sistema de Profundidade Arquitetural (Z-Tier)
2. Modelos 3D Procedurais (19 componentes)
3. Matriz Consolidada de Dimensões, Profundidade e Custo Poligonal
4. Componentes Estruturais da Cena 3D
5. Diretrizes Gerais de Otimização de Renderização
6. Apêndice — Tabela de Resolução Semântica (tipo de nó → modelo)

---

## 1. Sistema de Profundidade Arquitetural (Z-Tier)

No algoritmo de layout espacial ([`src/lib/layout/spatialLayout.ts`](../src/lib/layout/spatialLayout.ts)), os nós são distribuídos no espaço 3D em **5 camadas hierárquicas** de importância (`Tier 1` a `Tier 5`), orientando o usuário da frente (*foreground*) até o fundo (*background*):

```
       [Câmera / Observador]
                 │
                 ▼
  ┌─────────────────────────────┐  Tier 5: Z = -4.5 (Y = +3.8)
  │ Clientes, Atores, Sensores  │  Primeiro plano elevado
  └──────────────┬──────────────┘
                 ▼
  ┌─────────────────────────────┐  Tier 4: Z = -2.2 (Y = +2.0)
  │ Gateways, Routers, Cloud    │  Perímetro e controle de entrada
  └──────────────┬──────────────┘
                 ▼
  ┌─────────────────────────────┐  Tier 3: Z =  0.0 (Y = +0.5)
  │ Serviços, Servidores, IA    │  Plano central de processamento
  └──────────────┬──────────────┘
                 ▼
  ┌─────────────────────────────┐  Tier 2: Z = +2.2 (Y = -1.2)
  │ Mensageria, Queues, Cache   │  Barramento assíncrono de eventos
  └──────────────┬──────────────┘
                 ▼
  ┌─────────────────────────────┐  Tier 1: Z = +4.5 (Y = -2.6)
  │ Bancos, Lakehouses, Storage │  Fundação profunda de persistência
  └─────────────────────────────┘
```

### 1.1 Tabela de referência rápida de Tier

| Tier | Z | Y | Papel arquitetural | Modelos típicos |
| :---: | :---: | :---: | :--- | :--- |
| 5 | `-4.5` | `+3.8` | Borda de interação humana / dispositivo | `WorkstationModel`, `UserModel`, sensores IoT |
| 4 | `-2.2` | `+2.0` | Perímetro de rede e ingestão | `CloudModel`, `RouterModel`, `ApiGatewayModel` |
| 3 | `0.0` | `+0.5` | Processamento e lógica de domínio | `ServerRackModel`, `MicroserviceModel`, `NeuralNetworkModel`, UML/BPMN |
| 2 | `+2.2` | `-1.2` | Barramento assíncrono | `QueueModel` |
| 1 | `+4.5` | `-2.6` | Persistência e dados em repouso | `DatabaseModel`, `DataLakehouseModel` |

### 1.2 Notas de implementação
- O deslocamento em **Y** acompanha o deslocamento em **Z** de forma inversamente proporcional — quanto mais o nó recua no eixo Z (fundo), mais ele desce no eixo Y, reforçando a leitura de "profundidade + fundação" (bancos de dados no chão do diagrama) e "elevação + proximidade" (atores no topo, próximos à câmera).
- A transição entre tiers durante o *auto-layout* deve ser interpolada (não instantânea) para preservar continuidade espacial — recomenda-se `lerp` com easing `easeInOutCubic` de 400–600 ms ao reorganizar o grafo.
- Nós sem tipo semântico reconhecido caem em `GenericNodeModel` no **Tier 3**, o tier neutro/central, evitando viés de leitura arquitetural indevido.

---

## 2. Modelos 3D Procedurais

Cada modelo segue o mesmo template de documentação: **Geometria** (primitivas e parâmetros), **Materiais** (propriedades PBR), **Animação** (fórmulas `useFrame`) e **Performance** (estimativa de carga poligonal e recomendações de otimização).

---

### 2.1 `ServerRackModel`
- **Arquivo**: `src/components/three/Models/ServerRackModel.tsx`
- **Aliases semânticos**: `server`, `server-rack`, `gpu-cluster`, `blade-server`
- **Descrição de Negócio**: Representa servidores físicos de datacenter, servidores blade, nós de cluster GPU e instâncias de computação pesada.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Chassis 2U principal | `BoxGeometry` | `1.6 × 0.45 × 1.2` | 1 |
| Painel frontal biselado | `BoxGeometry` | `1.56 × 0.41 × 0.04` | 1 |
| Orelhas de fixação lateral (rack ears) | `BoxGeometry` | `0.1 × 0.48 × 0.12` | 2 |
| Gavetas de disco hot-swap | `BoxGeometry` | `0.15 × 0.28 × 0.02` | 8 |
| LEDs de atividade | `SphereGeometry`/emissivo | `r ≈ 0.015` | 8 |
| Exaustores traseiros perfurados | `CylinderGeometry` | `0.16 × 0.16 × 0.02, 16 seg.` | 2 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Chassis | `#1E2738` | 0.80 | 0.40 | — |
| Painel frontal | `#0F172A` | 0.90 | 0.25 | — |
| LEDs de atividade | `#22C55E` / `#3B82F6` | 0.10 | 0.30 | intensidade animada |

**Animação**
- LEDs: `emissiveIntensity = 0.4 + Math.sin(t * 4 + i * 1.5) * 0.35` por LED `i` (0–7), criando padrão de "cintilação de disco" assíncrono.
- Sem rotação estrutural — o modelo é estático em orientação, reforçando a leitura de hardware fixo em rack.

**Performance**
- **Carga poligonal estimada**: `12×3 (chassis+painel+2 ears≈4×12) + 8×12 (gavetas) + 2×28 (exaustores 16-seg) ≈ 220 triângulos`.
- Geometrias de gaveta e LED devem ser **instanciadas** (`InstancedMesh`) já que são repetidas 8× com apenas o offset em X e a fase de emissão variando — reduz 8 draw calls para 1.
- Materiais e geometrias base devem ser memoizados com `useMemo` para evitar realocação a cada render.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.80 × 0.48 × 1.26`
- **Profundidade Física (Z)**: `1.26` unidades.
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.2 `DatabaseModel`
- **Arquivo**: `src/components/three/Models/DatabaseModel.tsx`
- **Aliases semânticos**: `database`, `storage`, `managed-database`, `san`, `nas`
- **Descrição de Negócio**: Representa armazenamento relacional e colunar, instâncias de banco gerenciadas e volumes SAN/NAS.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Núcleo de energia central | `CylinderGeometry` | `0.42 × 0.42 × 1.25, 24 seg.` | 1 |
| Platters metálicos escalonados | `CylinderGeometry` | `0.72 × 0.72 × 0.22, 32 seg.` @ `y: -0.4, 0, 0.4` | 3 |
| Bordas chanfradas (torus) | `TorusGeometry` | `0.72 × 0.02, 12 × 32 seg.` | 3 |
| Cabeças de leitura óptica | `BoxGeometry` | `0.08 × 0.05 × 0.02` | 3–6 |
| Anel de fluxo magnético orbital | `TorusGeometry` | `0.95 × 0.02, 8 × 32 seg.` | 1 |
| Nó satélite orbital | `SphereGeometry` | `r ≈ 0.06` | 1 |
| Bisel de topo usinado | `CylinderGeometry` | `0.5/0.65 × 0.08, 24 seg.` | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Platters | `#334155` prateado | 0.90 | 0.20 | — |
| Núcleo central | `#3B82F6` | 0.30 | 0.35 | pulsante |
| Anel orbital | `#60A5FA` | 0.40 | 0.20 | leve |

**Animação**
- Núcleo: `emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.3` (pulso de "alimentação" contínuo).
- Anel orbital: `rotation.y += delta * 1.2 rad/s`, com o nó satélite orbitando em `radius = 0.95` sincronizado ao ângulo do anel.

**Performance**
- **Carga poligonal estimada**: `3×124 (platters 32-seg) + 3×768 (torus 12×32) + 92 (núcleo 24-seg) + 512 (anel orbital 8×32) + extras ≈ 3.400 triângulos` — é o modelo com maior custo por conta dos 4 toros de alta segmentação.
- Recomenda-se reduzir `radialSegments` dos toros de borda de `12` para `8` em modo *low-detail* (LOD1) sem perda perceptível, cortando ~35% do custo desse grupo.
- Os 3 platters compartilham a mesma geometria-base (`useMemo` único), variando apenas a posição Y — evita triplicar o buffer de geometria na GPU.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.90 × 1.30 × 1.90` (cilíndrico/orbital).
- **Profundidade Física (Z)**: `1.46` (platters) / `1.90` (anel orbital).
- **Camada Espacial Z Padrão**: **Tier 1 (`Z = +4.5`)**.

---

### 2.3 `WorkstationModel`
- **Arquivo**: `src/components/three/Models/WorkstationModel.tsx`
- **Aliases semânticos**: `client`, `laptop`, `desktop`, `mobile`, `device`, `bi-dashboard`
- **Descrição de Negócio**: Terminais de trabalho, computadores clientes, laptops, desktops e estações de monitoramento.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Base / chassis do teclado | `BoxGeometry` | `1.3 × 0.06 × 0.9` | 1 |
| Teclado rebaixado | `BoxGeometry` | `1.1 × 0.01 × 0.45` | 1 |
| Trackpad usinado | `BoxGeometry` | `0.38 × 0.01 × 0.24` | 1 |
| Tampa traseira & moldura do display | `BoxGeometry` | `1.3 × 0.84 × 0.04`, inclinação `0.4 rad` | 1 |
| Tela emissiva de terminal | `PlaneGeometry` | `1.16 × 0.7` | 1 |
| Linhas de código simuladas | `PlaneGeometry`/linha | finas, geradas proceduralmente | 6 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Chassis / tampa | `#1E293B` | 0.60 | 0.45 | — |
| Tela de terminal | `#020617` (fundo) | 0.10 | 0.60 | linhas em ciano/verde |

**Animação**
- Linhas de código: revelação sequencial em loop (`opacity` escalonado por linha) para sugerir atividade de terminal em tempo real.
- Sem rotação — orientação fixa com o display sempre voltado para o observador padrão da cena.

**Performance**
- **Carga poligonal estimada**: `12×4 (caixas) + 2 (tela) + 6×2 (linhas) ≈ 62 triângulos` — um dos modelos mais leves do catálogo, adequado para repetição em massa (várias estações de trabalho no mesmo diagrama).
- Como é frequentemente instanciado em grande quantidade (múltiplos clientes), é o candidato prioritário para `InstancedMesh` completo do modelo, não apenas de subcomponentes.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.30 × 0.80 × 1.15`
- **Profundidade Física (Z)**: `0.90` (base) / `1.15` (com abertura angular do display).
- **Camada Espacial Z Padrão**: **Tier 5 (`Z = -4.5`)**.

---

### 2.4 `CloudModel`
- **Arquivo**: `src/components/three/Models/CloudModel.tsx`
- **Aliases semânticos**: `cloud`, `cloud-region`, `vpc`
- **Descrição de Negócio**: Regiões de nuvem pública/privada (AWS, GCP, Azure), VPCs e perímetros de infraestrutura distribuída.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Núcleo de energia | `SphereGeometry` | `0.38, 20 × 20 seg.` | 1 |
| Cluster volumétrico translúcido | `DodecahedronGeometry` | `0.7 / 0.48 / 0.52, detail 1` | 3 |
| Satélites de telemetria orbitais | `OctahedronGeometry` | `r ≈ 0.08` | 3 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Opacity | Emissive |
| :--- | :---: | :---: | :---: | :---: | :--- |
| Dodecaedros do cluster | `#818CF8` / `#A5B4FC` | 0.20 | 0.30 | `0.65–0.80` | leve halo |
| Núcleo | `#6366F1` | 0.10 | 0.40 | 1.0 | pulsante |
| Satélites | `#C7D2FE` | 0.30 | 0.20 | 1.0 | — |

**Animação**
- Núcleo: `emissiveIntensity = 0.5 + Math.sin(t * 2.5) * 0.3`.
- Satélites: órbitas independentes em X/Y com velocidades angulares distintas por satélite (ex.: `0.6`, `0.9`, `1.3 rad/s`), evitando sincronismo visual repetitivo.

**Performance**
- **Carga poligonal estimada**: `~760 (esfera 20×20) + 3×~110 (dodecaedros detail-1) + 3×8 (octaedros) ≈ 1.130 triângulos`.
- Materiais translúcidos (`opacity < 1`) forçam *blending* e desabilitam early-Z — limitar o número simultâneo de `CloudModel` translúcidos visíveis em cena, ou usar `depthWrite: false` combinado com ordenação manual para evitar artefatos de transparência sobreposta.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `2.20 × 1.40 × 2.20`
- **Profundidade Física (Z)**: `1.40` (corpo volumétrico) / `2.20` (com o raio orbital dos satélites).
- **Camada Espacial Z Padrão**: **Tier 4 (`Z = -2.2`)**.

---

### 2.5 `RouterModel`
- **Arquivo**: `src/components/three/Models/RouterModel.tsx`
- **Aliases semânticos**: `router`, `switch`, `firewall`, `waf`, `vpn`, `network-hub`
- **Descrição de Negócio**: Roteadores, switches L3 corporativos, firewalls de borda, VPNs e nós de malha de rede.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Chassis principal | `BoxGeometry` | `1.4 × 0.22 × 0.9` | 1 |
| Bisel frontal acrílico | `BoxGeometry` | `1.36 × 0.18 × 0.02` | 1 |
| LEDs de tráfego de pacotes | `CylinderGeometry` | `0.02 × 0.02 × 0.01, 12 seg.` | 5 |
| Antenas dipolo angulares | `CylinderGeometry` | `0.022/0.03 × 0.7` | 4 |
| Emissor de ondas RF | `RingGeometry` | `0.4–0.45, 32 seg.` | 3 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Chassis | `#111827` | 0.70 | 0.35 | — |
| LEDs | `#F97316` / `#22C55E` | 0.10 | 0.30 | intermitente |
| Anéis RF | `#38BDF8` | 0.10 | 0.10 | `opacity` decrescente |

**Animação**
- LEDs: piscadas assíncronas simulando tráfego de pacotes (`intensity = step function` com jitter aleatório por LED).
- Anéis RF: efeito *ripple* — escala `1 → 1.6` e `opacity 0.6 → 0` em loop com defasagem de `0.4s` entre os 3 anéis, simulando propagação de sinal.

**Performance**
- **Carga poligonal estimada**: `12×2 (chassis+bisel) + 5×20 (LEDs) + 4×32 (antenas cilíndricas simples) + 3×64 (anéis) ≈ 452 triângulos`.
- Os 3 anéis RF são a única geometria animada por escala/opacidade — reaproveitar uma única `RingGeometry` e clonar apenas o `Mesh` (não a geometria) para os 3 anéis.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.40 × 0.85 × 1.10`
- **Profundidade Física (Z)**: `0.90` (chassis) / `1.10` (com inclinação das antenas).
- **Camada Espacial Z Padrão**: **Tier 4 (`Z = -2.2`)**.

---

### 2.6 `ApiGatewayModel`
- **Arquivo**: `src/components/three/Models/ApiGatewayModel.tsx`
- **Aliases semânticos**: `gateway`, `api`, `load-balancer`, `k8s-ingress`, `proxy`
- **Descrição de Negócio**: Gateways de API, balanceadores de carga, proxies reversos e controladores de ingress.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Pilares do portal | `BoxGeometry` | `0.2 × 1.4 × 0.35` | 2 |
| Dintel superior | `BoxGeometry` | `1.5 × 0.2 × 0.35` | 1 |
| Portal holográfico transpassável | `PlaneGeometry` | `1.1 × 1.1` | 1 |
| Feixe laser de varredura | `BoxGeometry` | `1.1 × 0.03 × 0.02` | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Opacity | Emissive |
| :--- | :---: | :---: | :---: | :---: | :--- |
| Pilares/dintel | `#0F172A` | 0.60 | 0.40 | 1.0 | canaletas de neon `#22D3EE` |
| Portal holográfico | `#22D3EE` | 0.10 | 0.10 | `0.25` | alta |
| Feixe laser | `#F43F5E` | 0.10 | 0.10 | 1.0 | alta |

**Animação**
- Feixe laser: `positionY = Math.sin(t * 3) * 0.45`, varredura vertical contínua simulando inspeção de requisições.
- Portal: leve pulsação de opacidade (`0.20–0.30`) para reforçar a sensação de "membrana" ativa de passagem de tráfego.

**Performance**
- **Carga poligonal estimada**: `12×3 (pilares+dintel) + 2 (portal) + 12 (feixe) ≈ 50 triângulos` — modelo muito leve, ideal para cenas com múltiplos gateways/ingress.
- É o modelo mais raso em profundidade Z (`0.35`) — atenção ao *z-fighting* quando dois `ApiGatewayModel` são posicionados muito próximos no mesmo tier.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.50 × 1.40 × 0.35`
- **Profundidade Física (Z)**: `0.35` unidades.
- **Camada Espacial Z Padrão**: **Tier 4 (`Z = -2.2`)**.

---

### 2.7 `MicroserviceModel`
- **Arquivo**: `src/components/three/Models/MicroserviceModel.tsx`
- **Aliases semânticos**: `service`, `microservice`, `container`, `docker`, `kubernetes`, `serverless-function`
- **Descrição de Negócio**: Microsserviços independentes, containers Docker, Pods Kubernetes, Serverless functions e módulos de computação.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Gaiola externa wireframe | `BoxGeometry` | `1.1 × 1.1 × 1.1` (edges) | 1 |
| Marcadores de vértices | `BoxGeometry` | `0.12 × 0.12 × 0.12` | 8 |
| Núcleo octaédrico rotativo | `OctahedronGeometry` | `0.5, detail 0` | 1 |
| Anel de confinamento magnético | `TorusGeometry` | `0.75 × 0.02, 8 × 24 seg.` | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Gaiola wireframe | `#2563EB` | — | — | linha luminosa |
| Núcleo octaédrico | `#3B82F6` | 0.40 | 0.20 | pulsante |
| Marcadores de vértice | `#93C5FD` | 0.70 | 0.30 | — |

**Animação**
- Núcleo: rotação dupla-eixo `rotation.x += delta * 0.9`, `rotation.y += delta * 1.3`.
- Anel: inclinação fixa `45°` com rotação lenta adicional em torno do próprio eixo para reforçar leitura de "contenção orbital".

**Performance**
- **Carga poligonal estimada**: `~24 (wireframe, sem faces sólidas) + 8×12 (marcadores) + 8 (octaedro) + 384 (torus 8×24) ≈ 512 triângulos`.
- Os 8 marcadores de vértice são posicionalmente fixos nos cantos do cubo — candidatos ideais a `InstancedMesh` com matriz de transformação pré-calculada uma única vez (não recalculada por frame).

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.10 × 1.10 × 1.10`
- **Profundidade Física (Z)**: `1.10` unidades (cubo isométrico).
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.8 `QueueModel`
- **Arquivo**: `src/components/three/Models/QueueModel.tsx`
- **Aliases semânticos**: `queue`, `kafka`, `rabbitmq`, `data-stream`, `event-bus`, `pubsub`, `cache`
- **Descrição de Negócio**: Filas de mensageria assíncrona, brokers Kafka, tópicos RabbitMQ, barramentos de evento e pub/sub.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Base do trilho de transporte | `BoxGeometry` | `1.6 × 0.1 × 0.4` | 1 |
| Trilhos metálicos laterais | `BoxGeometry` | `1.64 × 0.08 × 0.04` | 2 |
| Pacotes de mensagem deslizantes | `BoxGeometry` | `0.22 × 0.22 × 0.26` | 4 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Base/trilhos | `#334155` | 0.75 | 0.35 | — |
| Pacotes de mensagem | `#F59E0B` | 0.30 | 0.40 | fio de topo luminoso |

**Animação**
- Pacotes: `positionX = ((t * speed + offset_i) % trackLength) - trackLength / 2`, movimento contínuo em esteira ao longo do eixo X, com `offset_i` escalonado para distribuir os 4 pacotes uniformemente (loop sem colisão visual).

**Performance**
- **Carga poligonal estimada**: `12 (base) + 2×12 (trilhos) + 4×12 (pacotes) ≈ 84 triângulos` — extremamente leve.
- Os 4 pacotes compartilham geometria idêntica; usar `InstancedMesh` com atualização de matriz por frame apenas no eixo X reduz o custo de CPU/JS de 4 meshes para 1 draw call.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.64 × 0.40 × 0.48`
- **Profundidade Física (Z)**: `0.48` unidades.
- **Camada Espacial Z Padrão**: **Tier 2 (`Z = +2.2`)**.

---

### 2.9 `UserModel`
- **Arquivo**: `src/components/three/Models/UserModel.tsx`
- **Aliases semânticos**: `user`, `actor`, `customer`, `employee`, `secondary-actor`
- **Descrição de Negócio**: Atores humanos, usuários do sistema, personas, clientes finais e operadores.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Pedestal holográfico | `CylinderGeometry` | `0.55/0.65 × 0.1, 24 seg.` | 1 |
| Torso / ombros cônicos | `CylinderGeometry` | `0.2/0.45 × 0.5, 16 seg.` | 1 |
| Cabeça / visor | `SphereGeometry` | `0.24, 20 × 20 seg.` | 1 |
| Viseira frontal luminescente | `BoxGeometry` | `0.3 × 0.09 × 0.1` | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Torso/pedestal | `#475569` | 0.50 | 0.45 | leve borda no pedestal |
| Cabeça | `#E2E8F0` | 0.30 | 0.30 | — |
| Viseira | `#22D3EE` | 0.10 | 0.10 | alta, pulsante |

**Animação**
- Viseira: `emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.2`, simulando "atenção ativa" do ator.
- Flutuação padrão herdada do `NodeMesh` (ver seção 4).

**Performance**
- **Carga poligonal estimada**: `92 (pedestal 24-seg) + 60 (torso 16-seg) + ~760 (cabeça 20×20) + 12 (viseira) ≈ 924 triângulos` — a esfera de alta resolução da cabeça domina o custo; pode ser reduzida para `14×14` segmentos (≈370 tri) sem perda perceptível a distâncias típicas de diagrama.
- É um dos modelos mais replicados em diagramas com múltiplos atores — priorizar LOD e/ou `InstancedMesh` quando há >6 instâncias simultâneas.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `0.65 × 1.05 × 0.65`
- **Profundidade Física (Z)**: `0.65` unidades.
- **Camada Espacial Z Padrão**: **Tier 5 (`Z = -4.5`)**.

---

### 2.10 `GenericNodeModel`
- **Arquivo**: `src/components/three/Models/GenericNodeModel.tsx`
- **Aliases semânticos**: `generic`, nós lógicos sem estereótipo reconhecido
- **Descrição de Negócio**: Nó genérico ou abstrato de fallback quando nenhum estereótipo específico é inferido.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Chassis hexagonal | `CylinderGeometry` | `0.65 × 0.5, 6 seg.` | 1 |
| Núcleo interno hexagonal | `CylinderGeometry` | `0.4 × 0.52, 6 seg.` | 1 |
| Tampa superior de proteção | `CylinderGeometry` | `0.3/0.35 × 0.06, 6 seg.` | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Chassis | `#475569` | 0.60 | 0.40 | — |
| Núcleo | `#94A3B8` | 0.30 | 0.30 | sutil |

**Animação**
- Nenhuma animação estrutural dedicada além da flutuação padrão do `NodeMesh` — mantém neutralidade visual apropriada ao papel de fallback.

**Performance**
- **Carga poligonal estimada**: `20×3 (três cilindros hexagonais de 6 segmentos) ≈ 60 triângulos` — o modelo mais barato do catálogo junto ao `QueueModel`, adequado como fallback de alto volume.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.30 × 0.65 × 1.30`
- **Profundidade Física (Z)**: `1.30` unidades de diâmetro hexagonal.
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.11 `UMLClassModel`
- **Arquivo**: `src/components/three/Models/UMLClassModel.tsx`
- **Aliases semânticos**: `uml-class`, `uml-abstract-class`, `uml-enum`, `table`, `entity`
- **Descrição de Negócio**: Classes UML, classes abstratas, interfaces estruturais, tipos enumerados e tabelas relacionais de banco de dados.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Monólito estrutural principal | `BoxGeometry` | `1.5 × 1.4 × 0.35` | 1 |
| Banner de título | `BoxGeometry` | `1.44 × 0.38 × 0.02` | 1 |
| Compartimento de atributos (3 linhas em relevo) | `BoxGeometry` | `1.44 × 0.4 × 0.02` | 1 + 3 linhas |
| Compartimento de métodos (3 linhas ciano) | `BoxGeometry` | `1.44 × 0.44 × 0.02` | 1 + 3 linhas |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Corpo principal | `#1E293B` | 0.50 | 0.40 | — |
| Banner de título | `#3B82F6` | 0.30 | 0.30 | friso de destaque |
| Linhas de métodos | `#22D3EE` | 0.10 | 0.20 | leve |

**Animação**
- Estático por padrão — modelo orientado a leitura estrutural (UML), sem elementos cinéticos que distraiam da hierarquia textual.

**Performance**
- **Carga poligonal estimada**: `12 (corpo) + 12 (banner) + 2×12 (compartimentos) + 6×2 (linhas finas) ≈ 60 triângulos`.
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)** (ou **Tier 1** se for tabela SQL) — a heurística de resolução deve promover para Tier 1 quando o alias for `table`/`entity` com estereótipo de persistência.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.50 × 1.40 × 0.40`
- **Profundidade Física (Z)**: `0.35` (chassis) / `0.40` (com o relevo frontal dos slots).

---

### 2.12 `NeuralNetworkModel`
- **Arquivo**: `src/components/three/Models/NeuralNetworkModel.tsx`
- **Aliases semânticos**: `llm`, `ai-agent`, `ml-model`, `neural-network`, `inference`
- **Descrição de Negócio**: Modelos de Machine Learning, LLMs fundacionais, motores de inferência e agentes de inteligência artificial.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Núcleo sináptico central | `SphereGeometry` | `0.5, 24 × 24 seg.` | 1 |
| Gaiola geodésica sináptica | `IcosahedronGeometry` | `0.75, detail 1` (wireframe translúcido) | 1 |
| Giroscópio de anéis de tokens | `TorusGeometry` | `0.92 × 0.018, 8 × 32 seg.`, inclinação `60°` | 1 |
| Nós polares orbitais | `OctahedronGeometry` | `r ≈ 0.08` | 2 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Opacity | Emissive |
| :--- | :---: | :---: | :---: | :---: | :--- |
| Núcleo | `#A855F7` / `#D946EF` | 0.20 | 0.30 | 1.0 | violeta/magenta pulsante |
| Gaiola icosaédrica | `#C084FC` | — | — | `0.30` | leve |
| Anel de tokens | `#E879F9` | 0.30 | 0.20 | 1.0 | — |

**Animação**
- Núcleo: pulso de cor violeta↔magenta via interpolação de `emissiveIntensity`/matiz sincronizada ao clock.
- Anel: rotação contínua no eixo inclinado; os 2 nós octaédricos orbitam em trajetórias polares opostas nos eixos X e Y com velocidades independentes.

**Performance**
- **Carga poligonal estimada**: `~1.100 (esfera 24×24) + 80 (icosaedro detail-1) + 512 (torus 8×32) + 2×8 (nós) ≈ 1.700 triângulos` — segundo modelo mais custoso do catálogo, atrás apenas do `DatabaseModel`.
- A esfera de 24×24 segmentos pode cair para `18×18` (~620 tri) em LOD1 sem perda de legibilidade a distâncias médias/longas de câmera.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.84 × 1.84 × 1.84`
- **Profundidade Física (Z)**: `1.00` (esfera) / `1.84` (diâmetro do anel de tokens).
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.13 `IoTBoardModel`
- **Arquivo**: `src/components/three/Models/IoTBoardModel.tsx`
- **Aliases semânticos**: `esp32`, `arduino`, `raspberry-pi`, `iot-device`, `microcontroller`
- **Descrição de Negócio**: Microcontroladores, dispositivos de hardware embarcado, SoCs e módulos eletrônicos.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Placa de circuito impresso (PCB) | `BoxGeometry` | `1.4 × 0.06 × 0.9` | 1 |
| SoC microchip | `BoxGeometry` | `0.5 × 0.08 × 0.5` | 1 |
| Blindagem RF metálica | `BoxGeometry` | `0.42 × 0.02 × 0.42` | 1 |
| Pinos GPIO dourados | `CylinderGeometry` | `0.015 × 0.015 × 0.08, 8 seg.` | 12 |
| Conector Micro-USB / antena PCB | `BoxGeometry`/traço em relevo | pequeno, na borda | 1–2 |
| LED heartbeat | `SphereGeometry` | `r ≈ 0.02` | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| PCB | `#064E3B` | 0.10 | 0.60 | — |
| Blindagem RF | `#94A3B8` | 0.85 | 0.25 | — |
| Pinos GPIO | `#FACC15` (dourado) | 0.90 | 0.15 | — |
| LED heartbeat | `#EF4444` | 0.10 | 0.30 | alta, cíclica |

**Animação**
- LED heartbeat: ciclo de `8 Hz` — `visible = Math.floor(t * 8) % 2 === 0` ou `emissiveIntensity` em onda quadrada rápida.

**Performance**
- **Carga poligonal estimada**: `12 (PCB) + 12 (chip) + 12 (blindagem) + 12×20 (pinos) ≈ 276 triângulos`.
- Os 12 pinos GPIO são idênticos e dispostos em grade — forte candidato a `InstancedMesh` (reduz 12 draw calls para 1).
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)** (ou **Tier 5** para sensores de campo) — promover para Tier 5 quando o alias indicar dispositivo de borda/sensor físico próximo ao usuário.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.52 × 0.20 × 0.90`
- **Profundidade Física (Z)**: `0.90` unidades da placa PCB.

---

### 2.14 `DataLakehouseModel`
- **Arquivo**: `src/components/three/Models/DataLakehouseModel.tsx`
- **Aliases semânticos**: `data-lakehouse`, `data-lake`, `data-warehouse`, `vector-database`
- **Descrição de Negócio**: Reservatórios analíticos modernos, Data Lakes, Snowflake Lakehouses e bancos de dados vetoriais.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Reservatório hexagonal de vidro técnico | `CylinderGeometry` | `0.7 × 1.3, 6 seg.` | 1 |
| Tampa de pressão superior | `CylinderGeometry` | `0.75 × 0.08, 6 seg.` | 1 |
| Base usinada hexagonal | `CylinderGeometry` | `0.8 × 0.1, 6 seg.` | 1 |
| Cubos de dados em suspensão | `BoxGeometry` | `0.25 / 0.18 (variável)` | 4 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Opacity | Emissive |
| :--- | :---: | :---: | :---: | :---: | :--- |
| Reservatório | `#0EA5E9` | 0.80 | 0.15 | `0.35` | leve |
| Tampas | `#1E293B` | 0.70 | 0.35 | 1.0 | — |
| Cubos de dados | `#38BDF8` / `#818CF8` (variado) | 0.30 | 0.30 | 1.0 | sutil |

**Animação**
- Cubos de dados: flutuação individual em Y (`sin` com fase própria por cubo) + rotação lenta contínua em múltiplos eixos, simulando suspensão em "líquido analítico".

**Performance**
- **Carga poligonal estimada**: `20 (reservatório 6-seg) + 20 (tampa sup.) + 20 (base) + 4×12 (cubos) ≈ 108 triângulos` — leve mesmo sendo um dos modelos volumetricamente maiores.
- O material translúcido do reservatório requer as mesmas precauções de *blending/ordering* do `CloudModel` (seção 2.4) quando múltiplas instâncias se sobrepõem em profundidade.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.60 × 1.46 × 1.60`
- **Profundidade Física (Z)**: `1.40` (reservatório) / `1.60` (base usinada).
- **Camada Espacial Z Padrão**: **Tier 1 (`Z = +4.5`)**.

---

### 2.15 `BPMNGatewayModel`
- **Arquivo**: `src/components/three/Models/BPMNGatewayModel.tsx`
- **Aliases semânticos**: `bpmn-exclusive-gateway`, `bpmn-parallel-gateway`, `bpmn-inclusive-gateway`, `decision`
- **Descrição de Negócio**: Nós de decisão e chaveamento de fluxo de processos em diagramas BPMN.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Prisma diamante / losango rotacionado | `BoxGeometry` | `0.9 × 0.45 × 0.9`, `rotation: [0, π/4, 0]` | 1 |
| Bordas wireframe de realce | edges do losango | — | 1 |
| Marcador lógico central | `CylinderGeometry`/emissivo | pequeno, pulsante | 1 |
| Portas cardeais de conexão | `SphereGeometry` | `r ≈ 0.04`, nos vértices N/S/L/O | 4 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Prisma | `#F59E0B` | 0.40 | 0.35 | — |
| Bordas wireframe | `#FCD34D` | — | — | contorno luminoso |
| Marcador central | `#FBBF24` | 0.10 | 0.20 | pulsante |
| Portas cardeais | `#FDE68A` | 0.50 | 0.30 | — |

**Animação**
- Marcador lógico central: pulso de escala/emissão sincronizado ao clock, indicando ponto de avaliação de condição ativo.

**Performance**
- **Carga poligonal estimada**: `12 (prisma) + wireframe (custo de linha, não de triângulo) + ~20 (marcador) + 4×20 (portas) ≈ 112 triângulos`.
- As 4 portas cardeais são pontos de ancoragem fixos por definição geométrica (vértices N/S/L/O) — devem ser calculadas uma única vez e reaproveitadas pelo sistema de splines (`SplineConnection.tsx`), nunca recalculadas por frame.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.27 × 0.47 × 1.27`
- **Profundidade Física (Z)**: `1.27` unidades (diagonal do cubo a 45°: `0.9 × √2 ≈ 1.27`).
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.16 `UMLComponentModel`
- **Arquivo**: `src/components/three/Models/UMLComponentModel.tsx`
- **Aliases semânticos**: `uml-component`, `executable`, `shape=module` (estilo draw.io)
- **Descrição de Negócio**: Norma oficial **UML 2.0 Component Diagram**, representando módulos executáveis com duas abas salientes clássicas.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Chassis retangular principal | `BoxGeometry` | `2.2 × 1.2 × 0.7` | 1 |
| Painel frontal espelhado | `PlaneGeometry` | `2.0 × 1.0` | 1 |
| Abas salientes (norma UML) | `BoxGeometry` | `0.3 × 0.26 × 0.45` @ `x: -1.15`, `y: [0.28, -0.28]` | 2 |
| Núcleo de status operacional | `SphereGeometry` | `r ≈ 0.05`, canto superior direito | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Chassis | `#1E293B` | 0.55 | 0.35 | — |
| Painel frontal | `#334155` | 0.40 | 0.40 | leve bisel |
| Abas laterais | `#475569` | 0.60 | 0.30 | — |
| Núcleo de status | `#22C55E` (ok) / `#EF4444` (erro) | 0.10 | 0.20 | pulso cardíaco |

**Animação**
- Núcleo de status: pulso de "batimento" (`emissiveIntensity` com dois picos rápidos seguidos de pausa, imitando ECG) refletindo estado operacional do componente.

**Performance**
- **Carga poligonal estimada**: `12 (chassis) + 2 (painel) + 2×12 (abas) + ~200 (esfera padrão, reduzir para 8×8 ≈ 96 tri) ≈ 122 triângulos`.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `2.50 × 1.20 × 0.70`
- **Profundidade Física (Z)**: `0.70` unidades no bloco principal (`0.45` nas abas).
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.17 `InterfaceLollipopModel`
- **Arquivo**: `src/components/three/Models/InterfaceLollipopModel.tsx`
- **Aliases semânticos**: `uml-interface`, `provided-interface`, `required-interface`
- **Descrição de Negócio**: Especificação normativa UML do conector de interface **Ball-and-Socket (Lollipop)**, interfaces fornecidas (*Provided*) e exigidas (*Required*).

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Haste / pino de fixação | `CylinderGeometry` | `0.06 × 0.06 × 0.8, 16 seg.` | 1 |
| Esfera central (Provided) | `SphereGeometry` | `0.45, 32 × 32 seg.` | 1 |
| Soquete toroidal orbital (Required) | `TorusGeometry` | `0.7 × 0.04, 16 × 48 seg.` | 1 |
| Farol de sinalização interno | `SphereGeometry`/emissivo | menor, interno e translúcido | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Haste | `#64748B` | 0.70 | 0.35 | — |
| Esfera central | `#E2E8F0` (cromado) | 0.95 | 0.10 | micro-pulso de escala |
| Soquete toroidal | `#F472B6` | 0.40 | 0.20 | — |
| Farol interno | `#FDE68A` | — | — | translúcida, brilho suave |

**Animação**
- Esfera central: micro-pulso de escala (`1.0 ↔ 1.03`) sincronizado ao clock, reforçando o acabamento "cromado reflexivo".
- Soquete toroidal: oscilação suave multi-eixo em torno da esfera central, sugerindo o encaixe dinâmico "ball-and-socket".

**Performance**
- **Carga poligonal estimada**: `~60 (haste 16-seg) + ~1.900 (esfera 32×32) + 1.536 (torus 16×48) ≈ 3.500 triângulos` — **o modelo de maior custo poligonal do catálogo**, superando até o `DatabaseModel`, por conta da combinação de esfera de alta resolução com torus de alta segmentação dupla.
- **Prioridade máxima de otimização**: reduzir a esfera para `20×20` (~760 tri, -60%) e o torus para `10×32` (~640 tri, -58%) em LOD1/LOD2; a economia combinada (~4.400 → ~1.500 tri) é crítica em diagramas UML com muitas interfaces visíveis simultaneamente.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.40 × 1.30 × 1.40`
- **Profundidade Física (Z)**: `0.90` (esfera) / `1.40` (diâmetro do soquete toroidal).
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.18 `Controller3DModel`
- **Arquivo**: `src/components/three/Models/Controller3DModel.tsx`
- **Aliases semânticos**: `uml-controller`, `controller`
- **Descrição de Negócio**: Controladores industriais, unidades lógicas de automação (PLC/CLP), circuitos de comando e controladores de arquitetura.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Gabinete industrial de automação | `BoxGeometry` | `1.8 × 1.4 × 0.8` | 1 |
| Aletas de refrigeração superiores | `BoxGeometry` | `0.08 × 0.12 × 0.7` | 5 |
| Processador central de comando | `BoxGeometry` | `0.7 × 0.7 × 0.08` | 1 |
| Barramento de bornes I/O | `BoxGeometry` | `1.5 × 0.14 × 0.1` | 1 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Gabinete | `#14532D` (verde floresta) | 0.30 | 0.55 | — |
| Aletas | `#334155` | 0.85 | 0.20 | — |
| Processador central | `#1E293B` | 0.40 | 0.35 | senoidal em tempo real |
| Barramento I/O | `#FACC15` (dourado) | 0.90 | 0.15 | — |

**Animação**
- Processador: `emissiveIntensity = 0.4 + Math.sin(t * 5) * 0.25`, ciclo mais rápido que o padrão para sugerir processamento lógico de alta frequência (ciclo de scan de PLC).

**Performance**
- **Carga poligonal estimada**: `12 (gabinete) + 5×12 (aletas) + 12 (processador) + 12 (barramento) ≈ 96 triângulos`.
- As 5 aletas são idênticas em geometria com apenas offset em X — candidatas a `InstancedMesh`.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.80 × 1.52 × 0.88`
- **Profundidade Física (Z)**: `0.80` (gabinete) / `0.88` (com microchip e aletas).
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.19 `SecurityVaultModel`
- **Arquivo**: `src/components/three/Models/SecurityVaultModel.tsx`
- **Aliases semânticos**: `security-module`, `secret-vault`, estereótipos `crypto`/`secure`
- **Descrição de Negócio**: Módulos de segurança de hardware (HSM), cofres de credenciais (Secret Vaults) e sistemas criptográficos.

**Geometria**

| Componente | Primitiva | Parâmetros | Qtde |
| :--- | :--- | :--- | :---: |
| Porta-cofre blindada octogonal | `CylinderGeometry` | `0.9 × 0.8, 8 seg.` | 1 |
| Anel criptográfico de combinação | `TorusGeometry` | `0.55 × 0.05, 12 × 32 seg.` | 1 |
| Emblema central (escudo criptográfico) | `OctahedronGeometry` | `0.22, detail 0` (wireframe) | 1 |
| Parafusos de trava periféricos | `CylinderGeometry` | `0.04 × 0.04 × 0.04, 8 seg.` | 8 |

**Materiais**

| Elemento | Cor (Hex) | Metalness | Roughness | Emissive |
| :--- | :---: | :---: | :---: | :--- |
| Porta-cofre | `#1C1917` (liga escura) | 0.90 | 0.30 | — |
| Anel de combinação | `#A16207` (bronze) | 0.80 | 0.25 | — |
| Emblema wireframe | `#FACC15` | — | — | contorno pulsante |
| Parafusos | `#78716C` | 0.85 | 0.30 | — |

**Animação**
- Anel criptográfico: `rotation.z -= delta * 1.2 rad/s` (sentido anti-horário contínuo, simulando mecanismo de combinação em rotação).
- Emblema central: escala pulsante sutil (`0.95 ↔ 1.05`) sincronizada ao clock.

**Performance**
- **Carga poligonal estimada**: `28 (porta-cofre 8-seg) + 768 (anel 12×32) + 8 (emblema) + 8×28 (parafusos) ≈ 1.028 triângulos`.
- Os 8 parafusos periféricos são dispostos trigonometricamente em ângulos fixos de `π/4` — posições pré-calculáveis uma única vez e reaproveitadas via `InstancedMesh`, eliminando recomputação trigonométrica por frame.

**Dimensões e Profundidade**
- **Dimensões Locais [X, Y, Z]**: `1.80 × 1.80 × 0.92`
- **Profundidade Física (Z)**: `0.80` (porta-blindada) / `0.92` (com anel de combinação e escudo).
- **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

## 3. Matriz Consolidada de Dimensões, Profundidade e Custo Poligonal

| Modelo 3D | Largura (X) | Altura (Y) | Profundidade (Z) | Tier | Z de Camada | Δ Triângulos (est.) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ServerRackModel` | 1.80 | 0.48 | **1.26** | 3 | `0.0` | ~220 |
| `DatabaseModel` | 1.90 | 1.30 | **1.90** | 1 | `+4.5` | ~3.400 |
| `WorkstationModel` | 1.30 | 0.80 | **1.15** | 5 | `-4.5` | ~62 |
| `CloudModel` | 2.20 | 1.40 | **2.20** | 4 | `-2.2` | ~1.130 |
| `RouterModel` | 1.40 | 0.85 | **1.10** | 4 | `-2.2` | ~452 |
| `ApiGatewayModel` | 1.50 | 1.40 | **0.35** | 4 | `-2.2` | ~50 |
| `MicroserviceModel` | 1.10 | 1.10 | **1.10** | 3 | `0.0` | ~512 |
| `QueueModel` | 1.64 | 0.40 | **0.48** | 2 | `+2.2` | ~84 |
| `UserModel` | 0.65 | 1.05 | **0.65** | 5 | `-4.5` | ~924 |
| `GenericNodeModel` | 1.30 | 0.65 | **1.30** | 3 | `0.0` | ~60 |
| `UMLClassModel` | 1.50 | 1.40 | **0.40** | 3 | `0.0` | ~60 |
| `NeuralNetworkModel` | 1.84 | 1.84 | **1.84** | 3 | `0.0` | ~1.700 |
| `IoTBoardModel` | 1.52 | 0.20 | **0.90** | 3 | `0.0` | ~276 |
| `DataLakehouseModel` | 1.60 | 1.46 | **1.60** | 1 | `+4.5` | ~108 |
| `BPMNGatewayModel` | 1.27 | 0.47 | **1.27** | 3 | `0.0` | ~112 |
| `UMLComponentModel` | 2.50 | 1.20 | **0.70** | 3 | `0.0` | ~122 |
| `InterfaceLollipopModel` | 1.40 | 1.30 | **1.40** | 3 | `0.0` | ~3.500 |
| `Controller3DModel` | 1.80 | 1.52 | **0.88** | 3 | `0.0` | ~96 |
| `SecurityVaultModel` | 1.80 | 1.80 | **0.92** | 3 | `0.0` | ~1.028 |

**Leituras-chave da matriz:**
- **Mais custosos**: `InterfaceLollipopModel` (~3.500) e `DatabaseModel` (~3.400) — ambos concentram esfera + torus de alta segmentação; primeiros candidatos a LOD agressivo.
- **Mais leves**: `ApiGatewayModel` (~50) e `WorkstationModel` (~62) — seguros para replicação massiva sem LOD.
- **Maior profundidade física (Z)**: `DatabaseModel` e `CloudModel`, empatados em `2.20`/`1.90` — relevante para cálculo de *bounding box* de colisão entre nós adjacentes no mesmo tier.

---

## 4. Componentes Estruturais da Cena 3D

- **`NodeMesh.tsx`**: Contêiner orquestrador de cada nó.
  - Flutuação suave no eixo Y: `positionY = baseY + Math.sin(t * 1.5 + phase) * 0.08` — o `phase` é único por nó (derivado do ID) para evitar sincronismo visual entre nós vizinhos.
  - Interceptação de clique/drag por plano perpendicular à câmera (`ray.intersectPlane`), permitindo arrastar nós livremente no plano de visão atual sem depender de colisão com a geometria real.
  - Anel de solo (*ground ring*) de raio `1.18` — serve como indicador visual de área de influência/seleção, renderizado sob o modelo.
  - Eixos cartesianos 3D (X vermelho, Y verde, Z azul) exibidos **apenas no nó ativo/selecionado**, como referência de orientação durante edição manual de posição.
  - **Otimização**: o anel de solo e os eixos cartesianos devem ser desmontados do grafo de cena (não apenas ocultos via `visible = false`) quando o nó não está selecionado, evitando custo de sombra/材ial ocioso.

- **`CameraController.tsx`**: Controlador de interpolação esférica (*Slerp*) da câmera.
  - Presets: **Overview/Fit** (enquadra todo o grafo automaticamente calculando bounding sphere), **CAD Top-Down** (vista ortográfica superior para análise de layout), **Cinematic** (trajetória suave com profundidade de campo acentuada para apresentações).
  - Transições entre presets interpoladas via `Slerp` de quaternion + `Lerp` de posição/distância, evitando "corte seco" de câmera.

- **`StudioLighting.tsx`**: Setup de iluminação de estúdio com 3 pontos.
  - Luz direcional principal (*key light*) — define sombras primárias e volume.
  - Luz de preenchimento suave (*fill light*) — reduz contraste excessivo nas sombras da key light.
  - Luz ambiente hemisférica — fornece piso de iluminação global consistente para sombreamento PBR sem áreas totalmente pretas.
  - **Otimização**: sombras dinâmicas (`castShadow`) devem ficar restritas à key light; fill e hemisférica não devem gerar sombra, reduzindo custo de shadow map.

- **`CADGrid.tsx`**: Grade de coordenadas espaciais `100 × 100` unidades com subdivisões decimais, fixada no plano inferior de referência — usa material sem iluminação (`MeshBasicMaterial`/`LineBasicMaterial`) para custo de renderização desprezível.

- **`SplineConnection.tsx` & `FlowParticles.tsx`**: Curvas cúbicas 3D (`CatmullRomCurve3`) interconectando os nós, com fluxo dinâmico de partículas pontuais ao longo da curva.
  - Partículas devem usar `Points`/`BufferGeometry` compartilhado (não um `Mesh` por partícula) para permitir centenas de partículas simultâneas com um único draw call por conexão.
  - A curva deve ser recalculada apenas quando a posição de origem/destino muda (memoização por par de nós), não a cada frame.

- **`NodeLabel.tsx`**: HUD flutuante em *Billboard* (sempre orientado para a câmera) exibindo nome do nó, tipo semântico e badge de status operacional.
  - Renderizado via `Html`/*CSS3DRenderer* ou *sprite* de texto — deve ter *frustum culling* e *occlusion* independentes do mesh 3D subjacente para não sobrepor labels quando múltiplos nós estão próximos em profundidade.

---

## 5. Diretrizes Gerais de Otimização de Renderização

Aplicáveis a todos os 19 modelos, derivadas dos padrões identificados componente a componente:

1. **Memoização de geometria e material** (`useMemo`): toda geometria e material de cada modelo deve ser criado uma única vez por definição de tipo, não por instância de nó — reutilizar a mesma referência de `BufferGeometry`/`Material` entre todos os nós do mesmo tipo semântico.
2. **`InstancedMesh` para subcomponentes repetidos**: qualquer grupo de ≥4 elementos idênticos dentro de um modelo (gavetas do `ServerRackModel`, pinos do `IoTBoardModel`, parafusos do `SecurityVaultModel`, pacotes do `QueueModel`, marcadores do `MicroserviceModel`) deve migrar de `N` meshes individuais para 1 `InstancedMesh`.
3. **Level of Detail (LOD)** por distância de câmera: modelos acima de ~1.000 triângulos estimados (`DatabaseModel`, `InterfaceLollipopModel`, `NeuralNetworkModel`, `SecurityVaultModel`, `CloudModel`) devem expor ao menos 2 níveis — LOD0 (detalhe total, close-up/seleção) e LOD1 (segmentação reduzida em ~40–60%, visualização geral do grafo).
4. **Materiais translúcidos com desconto de custo**: `CloudModel`, `DataLakehouseModel` e o portal do `ApiGatewayModel` usam `opacity < 1` — limitar a contagem simultânea desses materiais em cena ou usar `depthWrite: false` com ordenação manual por profundidade para evitar artefatos de *blending*.
5. **Descarte de elementos de seleção quando inativos**: anel de solo e eixos cartesianos do `NodeMesh` (seção 4) só devem existir no grafo de cena enquanto o nó estiver ativo/selecionado.
6. **Cálculo trigonométrico único**: posições derivadas de fórmulas angulares fixas (portas cardeais do `BPMNGatewayModel`, parafusos do `SecurityVaultModel`, antenas do `RouterModel`) devem ser pré-calculadas uma vez na montagem do componente, nunca recalculadas em `useFrame`.
7. **Compartilhamento de geometria entre variações de escala**: quando um mesmo primitivo aparece em múltiplos tamanhos dentro do mesmo modelo (ex.: 3 dodecaedros do `CloudModel`), avaliar se a diferença visual justifica geometrias distintas ou se um único buffer escalado via `mesh.scale` é suficiente.

---

## 6. Apêndice — Tabela de Resolução Semântica (tipo de nó → modelo)

Referência rápida para o mapeador de tipo semântico → componente 3D, consolidando os *aliases* listados na seção 2:

| Modelo | Tipos/Aliases reconhecidos |
| :--- | :--- |
| `ServerRackModel` | `server`, `server-rack`, `gpu-cluster`, `blade-server` |
| `DatabaseModel` | `database`, `storage`, `managed-database`, `san`, `nas` |
| `WorkstationModel` | `client`, `laptop`, `desktop`, `mobile`, `device`, `bi-dashboard` |
| `CloudModel` | `cloud`, `cloud-region`, `vpc` |
| `RouterModel` | `router`, `switch`, `firewall`, `waf`, `vpn`, `network-hub` |
| `ApiGatewayModel` | `gateway`, `api`, `load-balancer`, `k8s-ingress`, `proxy` |
| `MicroserviceModel` | `service`, `microservice`, `container`, `docker`, `kubernetes`, `serverless-function` |
| `QueueModel` | `queue`, `kafka`, `rabbitmq`, `data-stream`, `event-bus`, `pubsub`, `cache` |
| `UserModel` | `user`, `actor`, `customer`, `employee`, `secondary-actor` |
| `GenericNodeModel` | `generic` (fallback padrão) |
| `UMLClassModel` | `uml-class`, `uml-abstract-class`, `uml-enum`, `table`, `entity` |
| `NeuralNetworkModel` | `llm`, `ai-agent`, `ml-model`, `neural-network`, `inference` |
| `IoTBoardModel` | `esp32`, `arduino`, `raspberry-pi`, `iot-device`, `microcontroller` |
| `DataLakehouseModel` | `data-lakehouse`, `data-lake`, `data-warehouse`, `vector-database` |
| `BPMNGatewayModel` | `bpmn-exclusive-gateway`, `bpmn-parallel-gateway`, `bpmn-inclusive-gateway`, `decision` |
| `UMLComponentModel` | `uml-component`, `executable`, `shape=module` |
| `InterfaceLollipopModel` | `uml-interface`, `provided-interface`, `required-interface` |
| `Controller3DModel` | `uml-controller`, `controller` |
| `SecurityVaultModel` | `security-module`, `secret-vault`, estereótipos `crypto`/`secure` |

> Quando nenhum alias corresponder, o resolvedor deve aplicar o **fallback padrão** (`GenericNodeModel`, Tier 3) em vez de falhar silenciosamente ou omitir o nó do diagrama.
