# 🐳 Executando o 3D Diagram Transformer SaaS via Docker

Este guia explica como rodar a aplicação inteira (**Next.js 3D Studio + PostgreSQL 16 + Redis 7**) em qualquer máquina utilizando Docker, com **zero vazamento de dados sensíveis** e configuração automatizada.

---

## 🔒 Princípios de Segurança e Isolamento

1. **Sem Segredos nas Imagens:** O arquivo `.dockerignore` bloqueia estritamente `.env`, `.env*.local`, chaves privadas (`*.key`, `*.pem`) e tokens, garantindo que nada sensível seja incluído na imagem Docker.
2. **Execução Segura (Non-Root):** A aplicação roda sob um usuário sem privilégios (`nextjs:nodejs`), seguindo as melhores práticas OWASP de conteinerização.
3. **Rede Isolada:** Os serviços `postgres` e `redis` comunicam-se com a aplicação através de uma rede interna protegida (`diagram3d_net`), expondo apenas a porta `3000` para acesso web (e portas de banco para depuração local caso necessário).
4. **Sincronização e Seed Automáticos:** O script `docker-entrypoint.sh` aguarda o banco estar 100% pronto e executa automaticamente as migrações do Prisma (`prisma db push`) e carga de templates iniciais.

---

## 🚀 Como Executar em Qualquer Máquina

### 1. Pré-requisito
Certifique-se de ter o **Docker** e o **Docker Compose** instalados (ex: Docker Desktop no Windows/macOS ou Docker Engine no Linux).

### 2. Configurar Variáveis de Ambiente (Opcional)
Se você deseja utilizar recursos de IA (Gemini) ou pagamentos (Stripe), copie o arquivo de exemplo e preencha suas chaves:

```bash
cp .env.example .env
```

> **Nota:** Caso você **não** crie o arquivo `.env`, a aplicação subirá normalmente com valores padrão seguros para desenvolvimento local e banco de dados isolado. Nenhuma chave sensível é compartilhada.

### 3. Iniciar Toda a Aplicação
Execute o comando na raiz do projeto:

```bash
docker compose up -d --build
```

ou utilizando o script npm:

```bash
npm run docker:up:build
```

O Docker irá:
1. Construir a imagem otimizada da aplicação Next.js (Multi-Stage Build).
2. Inicializar o **PostgreSQL 16** e aguardar o healthcheck.
3. Inicializar o **Redis 7** com senha e aguardar o healthcheck.
4. Sincronizar automaticamente as tabelas e schemas com o Prisma.
5. Iniciar o servidor de produção na porta `3000`.

### 4. Acessar a Aplicação
Abra o navegador em:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ Comandos Úteis

| Ação | Comando |
| :--- | :--- |
| **Subir aplicação em background** | `docker compose up -d` |
| **Reconstruir e subir** | `docker compose up -d --build` |
| **Visualizar logs em tempo real** | `docker compose logs -f app` |
| **Verificar status dos containers** | `docker compose ps` |
| **Parar todos os containers** | `docker compose down` |
| **Parar e limpar volumes de dados** | `docker compose down -v` |
| **Acessar o terminal do container da aplicação** | `docker compose exec app sh` |
