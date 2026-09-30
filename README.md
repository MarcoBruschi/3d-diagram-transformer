# 3D Diagram Transformer 🌐✨

> Transforme diagramas técnicos 2D (imagens raster via IA, Draw.io XML, Mermaid, JSON) em gêmeos digitais 3D interativos e espaciais.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash%20Vision-orange?style=for-the-badge&logo=google)

---

## 🚀 Funcionalidades Principais

- **🤖 Ingestão Multimodal por IA de Visão**:
  - Envie qualquer imagem (PNG, JPG, SVG, WEBP). O modelo **Google Gemini 2.5 Flash Vision** analisa componentes, caixas de contenção, textos e estereótipos, gerando o grafo arquitetural 3D automaticamente.
  - Fallback local integrado com OCR e dedução de topologia espacial.
- **📄 Suporte Nativo a Draw.io XML (`<mxGraphModel>`)**:
  - Parser completo com decodificação de entidades XML, limpeza de sub-elementos e associação de nós e interfaces.
- **🎮 Navegação 3D & Câmera Livre 360°**:
  - Órbita completa sem limites angulares (visão de baixo, de topo, axial).
  - Presets de câmera automáticos (*Fit/Overview*, *CAD Top-Down*, *Cinematic*).
  - Reset e enquadramento inteligente baseado no *bounding box* espacial de cada diagrama carregado.
- **🖐️ Movimentação e Arraste 3D em Tempo Real**:
  - Clique e arraste qualquer nó diretamente no cenário 3D.
  - Anéis de solo e eixos 3D (X Vermelho, Y Verde, Z Azul) para orientação de coordenadas.
  - Conexões e partículas de fluxo de dados acompanham o componente dinamicamente.
- **✏️ Edição Completa ao Clicar**:
  - Painel lateral (*NodeInspector*) com aba de edição ao vivo para Nome, Estereótipo, Modelo 3D (40+ tipos), Coordenadas X/Y/Z, Status e Notas.
- **📐 Builder & Split View (2D + 3D)**:
  - Criação visual do zero com fio dinâmico seguindo o cursor do mouse.
  - Alinhamento rápido em grade (*Snap 20px*), horizontal e vertical.
  - Visualização lado a lado (*Split View*) com sincronização em tempo real entre o plano 2D e o espaço 3D.
- **🧩 Modelos Procedurais Contextuais**:
  - Componente UML 2.0 (duas abas salientes).
  - Conector de Interface UML *Ball & Socket* (Lollipop).
  - Controlador Industrial com dissipador de calor e CPU.
  - Cofre Criptográfico com anéis concêntricos rotativos.
- **📚 Tutorial Interativo Integrado**:
  - Página dedicada em `/tutorial` com guia completo de todas as ferramentas e atalhos de teclado.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Estilização**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **3D & WebGL**: [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei)
- **Gerenciamento de Estado**: [Zustand](https://github.com/pmndrs/zustand)
- **Inteligência Artificial**: [Google Gemini 2.5 Flash Vision API](https://ai.google.dev/)
- **OCR Local**: [Tesseract.js](https://tesseract.projectnaptha.com/)

---

## 📦 Como Instalar e Rodar Localmente

### 1. Clonar o Repositório
```bash
git clone <url-do-repositorio>
cd rego-3d-diagram-transformer
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz baseado no `.env.example`:
```env
GEMINI_API_KEY="SUA_CHAVE_GEMINI_AQUI"
NEXT_PUBLIC_GEMINI_API_KEY="SUA_CHAVE_GEMINI_AQUI"
```
*(Você pode obter sua chave gratuitamente no [Google AI Studio](https://aistudio.google.com/)).*

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

### 5. Build de Produção
```bash
npm run build
npm run start
```

---

## 🔒 Segurança e Privacidade

- **Nenhum segredo ou chave privada é versionado** no repositório.
- Arquivos `.env`, `.env.local` e credenciais estão estritamente inclusos no `.gitignore`.
- O processamento de dados e IA respeita as diretrizes de privacidade locais.

---

## 📄 Licença

Distribuído sob licença privada para uso autorizado.
