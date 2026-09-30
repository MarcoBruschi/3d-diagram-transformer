# Catálogo e Especificação Técnica dos Componentes 3D

Este documento reúne a especificação detalhada de todos os **19 modelos 3D procedurais**, seus componentes de suporte na cena Three.js / React Three Fiber, regras de profundidade geométrica (eixo Z local) e o sistema de **profundidade arquitetural (Z-Tier)** do projeto `3d-diagram-transformer`.

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

---

## 2. Modelos 3D Procedurais

### 2.1 `ServerRackModel`
- **Arquivo**: `src/components/three/Models/ServerRackModel.tsx`
- **Descrição de Negócio**: Representa servidores físicos de datacenter, servidores blade, nós de cluster GPU e instâncias de computação pesada (`server`, `server-rack`, `gpu-cluster`, `blade-server`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Chassis 2U Principal**: `BoxGeometry(1.6, 0.45, 1.2)` em aço escuro (`#1E2738`, metalness: 0.8, roughness: 0.4).
  - **Painel Frontal**: `BoxGeometry(1.56, 0.41, 0.04)` com bisel escuro (`#0F172A`, metalness: 0.9).
  - **Orelhas de Fixação Lateral (Rack Ears)**: Dois suportes `BoxGeometry(0.1, 0.48, 0.12)`.
  - **8 Gavetas de Disco Hot-Swap**: `BoxGeometry(0.15, 0.28, 0.02)` com travas mecânicas individuais.
  - **LEDs de Atividade Dinâmicos**: 8 luzes emissivas animadas via `useFrame` com frequência senoidal `sin(t * 4 + i * 1.5)`.
  - **Exaustores Traseiros**: Dois cilindros perfurados `CylinderGeometry(0.16, 0.16, 0.02, 16)`.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.80 × 0.48 × 1.26`
  - **Profundidade Física (Z)**: `1.26` unidades.
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.2 `DatabaseModel`
- **Arquivo**: `src/components/three/Models/DatabaseModel.tsx`
- **Descrição de Negócio**: Representa armazenamento relacional e colunar, instâncias de banco gerenciadas e volumes SAN/NAS (`database`, `storage`, `managed-database`, `san`, `nas`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Núcleo de Energia Central**: `CylinderGeometry(0.42, 0.42, 1.25, 24)` pulsando iluminação emissiva via clock.
  - **3 Platters Metálicos**: Três cilindros escalonados `CylinderGeometry(0.72, 0.72, 0.22, 32)` em `y: [-0.4, 0, 0.4]`.
  - **Bordas Chanfradas em Torus**: Cada disco possui um anel perimetral `TorusGeometry(0.72, 0.02, 12, 32)`.
  - **Cabeças de Leitura Óptica**: Marcadores de LED frontais `BoxGeometry(0.08, 0.05, 0.02)`.
  - **Anel de Fluxo Magnético Orbital**: `TorusGeometry(0.95, 0.02, 8, 32)` rotacionando a `1.2 rad/s` com um nó satélite orbital `SphereGeometry(0.06)`.
  - **Bisel de Topo**: Tampa usinada `CylinderGeometry(0.5, 0.65, 0.08, 24)`.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.90 × 1.30 × 1.90` (cilíndrico/orbital).
  - **Profundidade Física (Z)**: `1.46` (platters) / `1.90` (anel orbital).
  - **Camada Espacial Z Padrão**: **Tier 1 (`Z = +4.5`)**.

---

### 2.3 `WorkstationModel`
- **Arquivo**: `src/components/three/Models/WorkstationModel.tsx`
- **Descrição de Negócio**: Terminais de trabalho, computadores clientes, laptops, desktops e estações de monitoramento (`client`, `laptop`, `desktop`, `mobile`, `device`, `bi-dashboard`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Base / Teclado Chassis**: `BoxGeometry(1.3, 0.06, 0.9)` com teclado rebaixado `BoxGeometry(1.1, 0.01, 0.45)` e trackpad usinado `BoxGeometry(0.38, 0.01, 0.24)`.
  - **Display Articulado com Dobradiça Traseira**: Inclinado em `0.4 rad` (~23°).
  - **Tampa Traseira & Moldura**: `BoxGeometry(1.3, 0.84, 0.04)`.
  - **Tela Emissiva de Terminal**: `PlaneGeometry(1.16, 0.7)` com material emissivo contendo 6 linhas simuladas de código geradas proceduralmente.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.30 × 0.80 × 1.15`
  - **Profundidade Física (Z)**: `0.90` (base) / `1.15` (com abertura angular do display).
  - **Camada Espacial Z Padrão**: **Tier 5 (`Z = -4.5`)**.

---

### 2.4 `CloudModel`
- **Arquivo**: `src/components/three/Models/CloudModel.tsx`
- **Descrição de Negócio**: Regiões de nuvem pública/privada (AWS, GCP, Azure), VPCs e perímetros de infraestrutura distribuída (`cloud`, `cloud-region`, `vpc`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Núcleo de Energia**: `SphereGeometry(0.38, 20, 20)` pulsando suavemente via `sin(t * 2.5)`.
  - **Cluster Volumétrico Translúcido**: Três dodecaedros interceptados `DodecahedronGeometry(0.7, 1)`, `DodecahedronGeometry(0.48, 1)` e `DodecahedronGeometry(0.52, 1)` com material translúcido (`opacity: 0.65~0.8`).
  - **Satélites de Telemetria Orbitais**: Três octaedros orbitando em trajetórias oblíquas com velocidades angulares independentes nos eixos X e Y.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `2.20 × 1.40 × 2.20`
  - **Profundidade Física (Z)**: `1.40` (corpo volumétrico) / `2.20` (com o raio orbital dos satélites).
  - **Camada Espacial Z Padrão**: **Tier 4 (`Z = -2.2`)**.

---

### 2.5 `RouterModel`
- **Arquivo**: `src/components/three/Models/RouterModel.tsx`
- **Descrição de Negócio**: Roteadores, switches L3 corporativos, firewalls de borda, VPNs e nós de malha de rede (`router`, `switch`, `firewall`, `waf`, `vpn`, `network-hub`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Chassis Principal**: `BoxGeometry(1.4, 0.22, 0.9)` com bisel frontal em acrílico negro `BoxGeometry(1.36, 0.18, 0.02)`.
  - **5 LEDs de Tráfego de Pacotes**: `CylinderGeometry(0.02, 0.02, 0.01, 12)` frontais.
  - **4 Antenas Angulares Dipolo**: Conectores e mastros cilíndricos `CylinderGeometry(0.022, 0.03, 0.7)` dispostos em ângulos abertos.
  - **Emissor de Ondas de Rádio RF**: 3 anéis concêntricos `RingGeometry(0.4, 0.45, 32)` com efeito ripple contínuo de escala e atenuação de opacidade.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.40 × 0.85 × 1.10`
  - **Profundidade Física (Z)**: `0.90` (chassis) / `1.10` (com inclinação das antenas).
  - **Camada Espacial Z Padrão**: **Tier 4 (`Z = -2.2`)**.

---

### 2.6 `ApiGatewayModel`
- **Arquivo**: `src/components/three/Models/ApiGatewayModel.tsx`
- **Descrição de Negócio**: Gateways de API, balanceadores de carga, proxies reversos e controladores de ingress (`gateway`, `api`, `load-balancer`, `k8s-ingress`, `proxy`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Portal Monolítico com Dois Pilares**: Colunas laterais `BoxGeometry(0.2, 1.4, 0.35)` com canaletas de neon verticais de `1.3` de altura.
  - **Dintel Superior**: Barra transversal de topo `BoxGeometry(1.5, 0.2, 0.35)`.
  - **Portal Holográfico Transpassável**: Plano `PlaneGeometry(1.1, 1.1)` com material translúcido emissivo.
  - **Feixe Laser de Varredura**: `BoxGeometry(1.1, 0.03, 0.02)` animado verticalmente via `sin(t * 3) * 0.45` simulando inspeção contínua de requisições.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.50 × 1.40 × 0.35`
  - **Profundidade Física (Z)**: `0.35` unidades.
  - **Camada Espacial Z Padrão**: **Tier 4 (`Z = -2.2`)**.

---

### 2.7 `MicroserviceModel`
- **Arquivo**: `src/components/three/Models/MicroserviceModel.tsx`
- **Descrição de Negócio**: Microsserviços independentes, containers Docker, Pods Kubernetes, Serverless functions e módulos de computação (`service`, `microservice`, `container`, `docker`, `kubernetes`, `serverless-function`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Gaiola Externa Wireframe**: Cubo de confinamento `BoxGeometry(1.1, 1.1, 1.1)` em malha aramada geométrica.
  - **8 Marcadores de Vértices**: Blocos metálicos cúbicos `BoxGeometry(0.12, 0.12, 0.12)` fixados nos limites espaciais.
  - **Núcleo Octaédrico Rotativo**: `OctahedronGeometry(0.5, 0)` girando em rotação com eixo duplo (`rotation.x += delta * 0.9`, `rotation.y += delta * 1.3`).
  - **Anel de Confinamento Magnético**: `TorusGeometry(0.75, 0.02, 8, 24)` inclinado a 45°.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.10 × 1.10 × 1.10`
  - **Profundidade Física (Z)**: `1.10` unidades (cubo isométrico).
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.8 `QueueModel`
- **Arquivo**: `src/components/three/Models/QueueModel.tsx`
- **Descrição de Negócio**: Filas de mensageria assíncrona, brokers Kafka, tópicos RabbitMQ, barramentos de evento e pub/sub (`queue`, `kafka`, `rabbitmq`, `data-stream`, `event-bus`, `pubsub`, `cache`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Base de Trilho de Transporte**: `BoxGeometry(1.6, 0.1, 0.4)` ladeada por dois trilhos metálicos `BoxGeometry(1.64, 0.08, 0.04)`.
  - **4 Pacotes de Mensagem Deslizantes**: Blocos `BoxGeometry(0.22, 0.22, 0.26)` com fios de emissão luminosa nos topos, deslocando-se continuamente ao longo da esteira no eixo X.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.64 × 0.40 × 0.48`
  - **Profundidade Física (Z)**: `0.48` unidades.
  - **Camada Espacial Z Padrão**: **Tier 2 (`Z = +2.2`)**.

---

### 2.9 `UserModel`
- **Arquivo**: `src/components/three/Models/UserModel.tsx`
- **Descrição de Negócio**: Atores humanos, usuários do sistema, personas, clientes finais e operadores (`user`, `actor`, `customer`, `employee`, `secondary-actor`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Pedestal Holográfico**: Cilindro cônico de apoio `CylinderGeometry(0.55, 0.65, 0.1, 24)`.
  - **Torso / Ombros Cônicos**: `CylinderGeometry(0.2, 0.45, 0.5, 16)`.
  - **Pescoço & Cabeça Visor**: Esfera `SphereGeometry(0.24, 20, 20)` com viseira frontal de alta luminescência `BoxGeometry(0.3, 0.09, 0.1)`.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `0.65 × 1.05 × 0.65`
  - **Profundidade Física (Z)**: `0.65` unidades.
  - **Camada Espacial Z Padrão**: **Tier 5 (`Z = -4.5`)**.

---

### 2.10 `GenericNodeModel`
- **Arquivo**: `src/components/three/Models/GenericNodeModel.tsx`
- **Descrição de Negócio**: Nó genérico ou abstrato de fallback quando nenhum estereótipo específico é inferido (`generic`, nós lógicos).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Chassis Hexagonal**: `CylinderGeometry(0.65, 0.65, 0.5, 6)` em acabamento metálico.
  - **Núcleo Interno Hexagonal**: `CylinderGeometry(0.4, 0.4, 0.52, 6)` emissivo.
  - **Tampa Superior de Proteção**: `CylinderGeometry(0.3, 0.35, 0.06, 6)`.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.30 × 0.65 × 1.30`
  - **Profundidade Física (Z)**: `1.30` unidades de diâmetro hexagonal.
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.11 `UMLClassModel`
- **Arquivo**: `src/components/three/Models/UMLClassModel.tsx`
- **Descrição de Negócio**: Classes UML, classes abstratas, interfaces estruturais, tipos enumerados e tabelas relacionais de banco de dados (`uml-class`, `uml-abstract-class`, `uml-enum`, `table`, `entity`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Monólito Estrutural Principal**: `BoxGeometry(1.5, 1.4, 0.35)`.
  - **Banner de Título da Classe**: Placa superior `BoxGeometry(1.44, 0.38, 0.02)` com friso de destaque colorido.
  - **Compartimento de Atributos**: Slot intermediário `BoxGeometry(1.44, 0.4, 0.02)` com 3 linhas de atributos em relevo.
  - **Compartimento de Métodos**: Slot inferior `BoxGeometry(1.44, 0.44, 0.02)` com 3 linhas ciano indicando métodos.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.50 × 1.40 × 0.40`
  - **Profundidade Física (Z)**: `0.35` (chassis) / `0.40` (com o relevo frontal dos slots).
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)** (ou **Tier 1** se for tabela SQL).

---

### 2.12 `NeuralNetworkModel`
- **Arquivo**: `src/components/three/Models/NeuralNetworkModel.tsx`
- **Descrição de Negócio**: Modelos de Machine Learning, LLMs fundacionais, motores de inferência e agentes de inteligência artificial (`llm`, `ai-agent`, `ml-model`, `neural-network`, `inference`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Núcleo Sináptico Central**: `SphereGeometry(0.5, 24, 24)` pulsando iluminação violeta/magenta via clock.
  - **Gaiola Geodésica Sináptica**: `IcosahedronGeometry(0.75, 1)` em malha aramada translúcida.
  - **Giroscópio de Anéis de Tokens**: `TorusGeometry(0.92, 0.018, 8, 32)` inclinado a 60° com dois nós octaédricos polares orbitando continuamente nos eixos X e Y.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.84 × 1.84 × 1.84`
  - **Profundidade Física (Z)**: `1.00` (esfera) / `1.84` (diâmetro do anel de tokens).
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.13 `IoTBoardModel`
- **Arquivo**: `src/components/three/Models/IoTBoardModel.tsx`
- **Descrição de Negócio**: Microcontroladores, dispositivos de hardware embarcado, SoCs e módulos eletrônicos (`esp32`, `arduino`, `raspberry-pi`, `iot-device`, `microcontroller`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Placa de Circuito Impresso (PCB)**: `BoxGeometry(1.4, 0.06, 0.9)` em verde esmeralda industrial (`#064E3B`).
  - **SoC Microchip com Blindagem Metálica RF**: Chip `BoxGeometry(0.5, 0.08, 0.5)` coberto por blindagem `BoxGeometry(0.42, 0.02, 0.42)`.
  - **Dois Barramentos GPIO de Pinos**: 12 pinos metálicos dourados `CylinderGeometry(0.015, 0.015, 0.08, 8)` com conector plástico isolante.
  - **Conector Micro-USB & Antena PCB**: Porta USB usinada na borda e antena de cobre traçada em relevo.
  - **LED Heartbeat de Alta Frequência**: Pisca em ciclo de 8 Hz.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.52 × 0.20 × 0.90`
  - **Profundidade Física (Z)**: `0.90` unidades da placa PCB.
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)** (ou **Tier 5** para sensores de campo).

---

### 2.14 `DataLakehouseModel`
- **Arquivo**: `src/components/three/Models/DataLakehouseModel.tsx`
- **Descrição de Negócio**: Reservatórios analíticos modernos, Data Lakes, Snowflake Lakehouses e bancos de dados vetoriais (`data-lakehouse`, `data-lake`, `data-warehouse`, `vector-database`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Reservatório Hexagonal de Vidro Técnico**: `CylinderGeometry(0.7, 0.7, 1.3, 6)` translúcido (`opacity: 0.35, metalness: 0.8`).
  - **Tampas de Pressão Superior e Base**: Dois anéis usinados hexagonais `CylinderGeometry(0.75, 0.75, 0.08, 6)` e `CylinderGeometry(0.8, 0.8, 0.1, 6)`.
  - **Cubos de Dados em Suspensão**: 4 blocos de dados volumétricos (`BoxGeometry(0.25)`, `0.18`, etc.) flutuando e rotacionando internamente em líquido analítico simulado.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.60 × 1.46 × 1.60`
  - **Profundidade Física (Z)**: `1.40` (reservatório) / `1.60` (base usinada).
  - **Camada Espacial Z Padrão**: **Tier 1 (`Z = +4.5`)**.

---

### 2.15 `BPMNGatewayModel`
- **Arquivo**: `src/components/three/Models/BPMNGatewayModel.tsx`
- **Descrição de Negócio**: Nós de decisão e chaveamento de fluxo de processos em diagramas BPMN (`bpmn-exclusive-gateway`, `bpmn-parallel-gateway`, `bpmn-inclusive-gateway`, `decision`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Prisma Diamante / Losango Rotacionado**: `BoxGeometry(0.9, 0.45, 0.9)` posicionado em rotação de 45° no plano horizontal (`rotation: [0, π/4, 0]`).
  - **Bordas Wireframe de Realce**: Malha aramada nos vértices do losango.
  - **Marcador Lógico Central**: Cilindro luminoso emissivo pulsando via `useFrame`.
  - **4 Portas Cardeais de Conexão**: 4 esferas nos vértices cardeais (N, S, L, O) para ancoragem de splines.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.27 × 0.47 × 1.27`
  - **Profundidade Física (Z)**: `1.27` unidades (diagonal do cubo a 45°: `0.9 × √2 ≈ 1.27`).
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.16 `UMLComponentModel`
- **Arquivo**: `src/components/three/Models/UMLComponentModel.tsx`
- **Descrição de Negócio**: Norma oficial **UML 2.0 Component Diagram**, representando módulos executáveis com duas abas salientes clássicas (`uml-component`, `executable`, ou estilo draw.io `shape=module`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Chassis Retangular Principal**: `BoxGeometry(2.2, 1.2, 0.7)` com acabamento PBR escuro de alta definição.
  - **Painel Frontal Espelhado**: `PlaneGeometry(2.0, 1.0)` com bisel usinado.
  - **Duas Abas Salientes Próprias da Norma UML**: Dois módulos retangulares `BoxGeometry(0.3, 0.26, 0.45)` projetados para fora da lateral esquerda em `x: -1.15` e `y: [0.28, -0.28]`.
  - **Núcleo de Status Operacional**: Esfera emissiva com pulso cardíaco no canto superior direito.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `2.50 × 1.20 × 0.70`
  - **Profundidade Física (Z)**: `0.70` unidades no bloco principal (`0.45` nas abas).
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.17 `InterfaceLollipopModel`
- **Arquivo**: `src/components/three/Models/InterfaceLollipopModel.tsx`
- **Descrição de Negócio**: Especificação normativa UML do conector de interface **Ball-and-Socket (Lollipop)**, interfaces fornecidas (*Provided*) e exigidas (*Required*) (`uml-interface`, `provided-interface`, `required-interface`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Haste / Pino de Fixação da Conexão**: `CylinderGeometry(0.06, 0.06, 0.8, 16)`.
  - **Esfera Central (Provided Interface Ball)**: `SphereGeometry(0.45, 32, 32)` de acabamento cromado e reflexivo com micro-pulso de escala.
  - **Soquete Toroidal Orbital (Required Interface Socket)**: `TorusGeometry(0.7, 0.04, 16, 48)` oscilando suavemente em múltiplos eixos em torno da esfera central.
  - **Farol de Sinalização Interno**: Esfera emissiva translúcida interna.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.40 × 1.30 × 1.40`
  - **Profundidade Física (Z)**: `0.90` (esfera) / `1.40` (diâmetro do soquete toroidal).
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.18 `Controller3DModel`
- **Arquivo**: `src/components/three/Models/Controller3DModel.tsx`
- **Descrição de Negócio**: Controladores industriais, unidades lógicas de automação (PLC/CLP), circuitos de comando e controladores de arquitetura (`uml-controller`, `controller`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Gabinete Industrial de Automação**: `BoxGeometry(1.8, 1.4, 0.8)` em polímero verde floresta escuro reforçado.
  - **Dissipador de Calor Superior**: 5 aletas de refrigeração usinadas `BoxGeometry(0.08, 0.12, 0.7)` no topo.
  - **Processador Central de Comando**: Microchip frontal `BoxGeometry(0.7, 0.7, 0.08)` com emissão senoidal calculada em tempo real.
  - **Barramento de Bornes I/O**: Barra metálica dourada de conexões `BoxGeometry(1.5, 0.14, 0.1)`.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.80 × 1.52 × 0.88`
  - **Profundidade Física (Z)**: `0.80` (gabinete) / `0.88` (com microchip e aletas).
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

### 2.19 `SecurityVaultModel`
- **Arquivo**: `src/components/three/Models/SecurityVaultModel.tsx`
- **Descrição de Negócio**: Módulos de segurança de hardware (HSM), cofres de credenciais (Secret Vaults) e sistemas criptográficos (`security-module`, `secret-vault`, nós com estereótipo `crypto`/`secure`).
- **Modelagem 3D (Geometria & Materiais)**:
  - **Porta-Cofre Blindada Octogonal**: Prisma octogonal espesso `CylinderGeometry(0.9, 0.9, 0.8, 8)` em liga escura reforçada.
  - **Anel Criptográfico de Combinação**: `TorusGeometry(0.55, 0.05, 12, 32)` girando no sentido anti-horário (`rotation.z = -t * 1.2`).
  - **Emblema Central de Escudo Criptográfico**: Octaedro wireframe `OctahedronGeometry(0.22, 0)` com escala pulsante.
  - **8 Parafusos de Trava Periféricos**: 8 cilindros usinados `CylinderGeometry(0.04, 0.04, 0.04, 8)` dispostos trigonometricamente em ângulos de `π/4`.
- **Dimensões e Profundidade**:
  - **Dimensões Locais [X, Y, Z]**: `1.80 × 1.80 × 0.92`
  - **Profundidade Física (Z)**: `0.80` (porta-blindada) / `0.92` (com anel de combinação e escudo).
  - **Camada Espacial Z Padrão**: **Tier 3 (`Z = 0.0`)**.

---

## 3. Matriz Consolidada de Dimensões e Profundidade

| Modelo 3D | Largura (X) | Altura (Y) | Profundidade Física (Z) | Tier Arquitetural | Profundidade de Camada (Z) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `ServerRackModel` | 1.80 | 0.48 | **1.26** | Tier 3 | `Z = 0.0` |
| `DatabaseModel` | 1.90 | 1.30 | **1.90** | Tier 1 | `Z = +4.5` |
| `WorkstationModel` | 1.30 | 0.80 | **1.15** | Tier 5 | `Z = -4.5` |
| `CloudModel` | 2.20 | 1.40 | **2.20** | Tier 4 | `Z = -2.2` |
| `RouterModel` | 1.40 | 0.85 | **1.10** | Tier 4 | `Z = -2.2` |
| `ApiGatewayModel` | 1.50 | 1.40 | **0.35** | Tier 4 | `Z = -2.2` |
| `MicroserviceModel` | 1.10 | 1.10 | **1.10** | Tier 3 | `Z = 0.0` |
| `QueueModel` | 1.64 | 0.40 | **0.48** | Tier 2 | `Z = +2.2` |
| `UserModel` | 0.65 | 1.05 | **0.65** | Tier 5 | `Z = -4.5` |
| `GenericNodeModel` | 1.30 | 0.65 | **1.30** | Tier 3 | `Z = 0.0` |
| `UMLClassModel` | 1.50 | 1.40 | **0.40** | Tier 3 | `Z = 0.0` |
| `NeuralNetworkModel` | 1.84 | 1.84 | **1.84** | Tier 3 | `Z = 0.0` |
| `IoTBoardModel` | 1.52 | 0.20 | **0.90** | Tier 3 | `Z = 0.0` |
| `DataLakehouseModel` | 1.60 | 1.46 | **1.60** | Tier 1 | `Z = +4.5` |
| `BPMNGatewayModel` | 1.27 | 0.47 | **1.27** | Tier 3 | `Z = 0.0` |
| `UMLComponentModel` | 2.50 | 1.20 | **0.70** | Tier 3 | `Z = 0.0` |
| `InterfaceLollipopModel`| 1.40 | 1.30 | **1.40** | Tier 3 | `Z = 0.0` |
| `Controller3DModel` | 1.80 | 1.52 | **0.88** | Tier 3 | `Z = 0.0` |
| `SecurityVaultModel` | 1.80 | 1.80 | **0.92** | Tier 3 | `Z = 0.0` |

---

## 4. Componentes Estruturais da Cena 3D

- **`NodeMesh.tsx`**: Contêiner orquestrador de cada nó. Aplica flutuação suave no eixo Y (`sin(t * 1.5 + phase) * 0.08`), interceptação de clique/drag por plano perpendicular à câmera (`ray.intersectPlane`), anel de solo com raio `1.18` e eixos cartesianos 3D (X Vermelho, Y Verde, Z Azul) no nó ativo.
- **`CameraController.tsx`**: Controlador de interpolação esférica (Lerp) da câmera com suporte a presets *Overview/Fit*, *CAD Top-Down* e *Cinematic*.
- **`StudioLighting.tsx`**: Setup de iluminação estúdio com 3 pontos: luz direcional principal, luz de preenchimento suave e ambiente hemisférico para sombreamento PBR consistente.
- **`CADGrid.tsx`**: Grade de coordenadas espaciais `100 × 100` unidades com subdivisões decimais, fixada no plano inferior de referência.
- **`SplineConnection.tsx` & `FlowParticles.tsx`**: Curvas cúbicas 3D (`CatmullRomCurve3`) que interconectam os nós com fluxo dinâmico de partículas pontuais.
- **`NodeLabel.tsx`**: HUD flutuante em Billboard (sempre orientado para a câmera) exibindo nome do nó, tipo semântico e badge de status operacional.
