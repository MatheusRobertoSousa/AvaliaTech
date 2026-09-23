# c. Implementação Técnica — Azure for Students (15 pontos)

**Aplicação publicada:** [Abrir AvaliaTech no Azure](https://avaliatech-156973.azurewebsites.net).

Implantação e verificações executadas em 16/09/2026 à noite, horário de Brasília (17/09/2026 UTC nos arquivos de evidências). A assinatura Azure for Students está ativa. O backend foi verificado com PostgreSQL real; não se trata apenas de configuração planejada.

## Soluções técnicas e tangibilização

O AvaliaTech é um SaaS acadêmico de recrutamento e avaliação técnica para PMEs. O recrutador cadastra testes e questões, gera convites e acompanha resultados; o candidato abre um link individual, responde e recebe a nota. A aplicação grava e consulta dados reais em banco relacional.

| Camada | Tecnologia | Aplicação concreta e complexidade |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, CSS e Lucide | Componentes, formulários e estados de carregamento; complexidade intermediária pela coordenação dos fluxos |
| Navegação e HTTP | React Router e Axios | Rotas, requests JSON e Bearer token |
| Backend | Node.js 24, Express 5 e TypeScript | API REST, regras de testes, convites e correção objetiva; complexidade intermediária |
| Validação | Zod | Valida os corpos dos requests; retorna 400 para dados inválidos |
| Autenticação | `node:crypto`, scrypt e HMAC-SHA256 | Senhas com hash/salt e tokens assinados com expiração |
| Persistência | Driver `pg`, PostgreSQL 16 e SQL parametrizado | Relacionamentos, chaves estrangeiras, agregações e adaptação de SQL |
| Desenvolvimento local | `node:sqlite` | Banco em arquivo; não é o banco da implantação Azure |
| Hospedagem | Azure App Service Linux, F1 | Serve o frontend compilado e a API no mesmo domínio HTTPS |
| Banco cloud | Azure Database for PostgreSQL Flexible Server, B1ms, 32 GiB | Banco gerenciado, TLS validado e firewall por IP |
| Implantação | Azure CLI, npm e ZIP Deploy | Build e publicação reproduzíveis |

Não há hardware dedicado ou IoT. O usuário precisa de navegador; servidores e discos são gerenciados pelo Azure. O F1 usa recursos compartilhados e cotas; o PostgreSQL usa a categoria Burstable. É um ambiente acadêmico, sem dimensionamento de carga ou alta disponibilidade contratada.

Azure for Students é a assinatura que fornece benefícios/créditos. A oferta anuncia US$ 100 por 12 meses, conforme elegibilidade; isso não torna qualquer serviço gratuito. Fonte: [Azure for Students](https://azure.microsoft.com/en-us/free/students/).

## Arquiteturas de frontend e backend

```mermaid
flowchart LR
  U[Recrutador ou candidato] --> B[Navegador]
  subgraph Cliente
    B --> R[React Router e páginas]
    R --> S[Estado e formulários]
    S --> A[Axios: JSON e token]
  end
  subgraph Azure[Azure for Students]
    subgraph Web[App Service Linux]
      F[frontend/dist: HTML, CSS e JS]
      E[Express: /api]
      V[Zod e autenticação]
      N[Regras de negócio]
      D[database.ts: SQL e pool pg]
      E --> V --> N --> D
    end
    P[(PostgreSQL Flexible Server)]
    D -->|TCP 5432 com TLS validado| P
  end
  B -->|HTTPS| F
  A -->|HTTPS: requests /api| E
```

O frontend é uma SPA: `/dashboard` devolve HTML; `/api/dashboard` devolve JSON. Isso permite atualizar páginas internas e manter frontend/API na mesma origem. `frontend/src/pages` contém as telas e `frontend/src/services/api.ts` configura Axios, token e tipos.

O backend concentra rotas e regras em `backend/src/server.ts`, autenticação em `auth.ts` e persistência em `database.ts`. A separação é lógica em uma aplicação; não são microserviços. O acesso usa o driver `pg`, não Prisma: `schema.prisma` é referência de modelagem.

O navegador não recebe a senha do banco nem se conecta à porta 5432. `DATABASE_URL` e `JWT_SECRET` ficam no App Service. O token de sessão é armazenado no `localStorage`; cookies HttpOnly e proteção adicional contra XSS são evoluções para uso comercial.

## Interação com os dados da nuvem

```mermaid
sequenceDiagram
  participant UI as React / Axios
  participant API as Express no App Service
  participant DB as PostgreSQL Azure
  UI->>API: POST /api/auth/login (email e senha)
  API->>DB: SELECT usuário por email ($1)
  DB-->>API: Usuário e hash
  API-->>UI: 200 e token assinado
  UI->>API: POST /api/tests + Bearer + JSON
  Note over API: Verifica assinatura e valida Zod
  API->>DB: INSERT INTO tests (...) VALUES ($1, ...)
  DB-->>API: Escrita concluída
  API-->>UI: 201 e ID do teste
  UI->>API: GET /api/tests/id + Bearer
  API->>DB: SELECT WHERE id=$1 AND company_id=$2
  DB-->>API: Registro persistido
  API-->>UI: 200 e JSON do mesmo teste
```

Modelo: `companies` relaciona usuários e testes; `tests` relaciona questões; `invitations` relaciona empresa, teste e candidato; `submissions` armazena respostas, nota e duração. A camada de banco converte camelCase em snake_case e placeholders `?` em `$1`, `$2` etc. para PostgreSQL.

Navegador/API usam HTTPS. API/banco usam TLS com `PGSSLMODE=verify-full` e `rejectUnauthorized: true`. O firewall permite os IPs de saída possíveis do App Service. É endpoint público restrito por firewall, não VNet privada. Fonte: [TLS no Azure PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/security/security-tls).

## Recursos e configuração

Grupo: `rg-avaliatech-students`; região: Brazil South; aplicação: `avaliatech-156973`; plano: `plan-avaliatech-students`; servidor PostgreSQL: `avaliatech-pg-156973`; database: `avaliatech`.

```env
NODE_ENV=production
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://USUARIO:SENHA_URL_ENCODED@SERVIDOR.postgres.database.azure.com:5432/avaliatech
PGSSLMODE=verify-full
JWT_SECRET=SEGREDO_ALEATORIO_COM_PELO_MENOS_32_CARACTERES
CORS_ORIGIN=https://HOST_REAL_DO_APP
SEED_DEMO=false
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

O frontend usa `/api` no build de produção. O App Service fornece `PORT` e inicia `node backend/dist/server.js`. A inicialização cria tabelas ausentes, sem apagar dados e sem popular conta com senha pública. **Não execute `npm run db:setup` no Azure: esse comando apaga e recria o banco.**

Republicação a partir da raiz:

```powershell
powershell -NoProfile -File scripts/package-azure.ps1
az webapp deploy -g rg-avaliatech-students -n avaliatech-156973 --src-path .azure/deploy.zip --type zip
```

O ZIP inclui backend/frontend compilados e manifesto de dependências. O script normaliza os caminhos para Linux. `.env` e credenciais não entram no ZIP/Git; `.azure/` guarda arquivos locais privados. Fonte: [Node.js no App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs).

## Requests reais de gravação e solicitação de dados

Execute no PowerShell. O hostname deve ser obtido do recurso, pois pode incluir sufixos gerados pelo Azure:

```powershell
$appHost = az webapp show -g rg-avaliatech-students -n avaliatech-156973 --query defaultHostName -o tsv
$api = "https://$appHost/api"
Invoke-RestMethod "$api/ready"

# POST grava uma empresa e seu recrutador fictício (201).
$cadastro = @{
  companyName = 'Empresa de demonstracao'
  name = 'Recrutador FIAP'
  email = "fiap-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@example.com"
  password = [Guid]::NewGuid().ToString('N')
}
$conta = Invoke-RestMethod "$api/auth/register" -Method Post -ContentType 'application/json' -Body ($cadastro | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($conta.token)" }

# POST grava teste (201).
$body = @{
  title = 'Teste de backend Azure'
  description = 'Avaliacao de API REST e persistencia em nuvem'
  difficulty = 'Iniciante'
  durationMinutes = 30
  status = 'active'
} | ConvertTo-Json
$teste = Invoke-RestMethod "$api/tests" -Method Post -Headers $headers -ContentType 'application/json' -Body $body
$teste | ConvertTo-Json

# GET consulta o mesmo ID no banco (200).
Invoke-RestMethod "$api/tests/$($teste.id)" -Headers $headers | ConvertTo-Json
Invoke-RestMethod "$api/tests" -Headers $headers | ConvertTo-Json
```

Formato HTTP do request de escrita (valores ilustrativos):

```http
POST /api/tests HTTP/1.1
Host: HOST_REAL_DO_APP
Authorization: Bearer TOKEN_DA_SESSAO
Content-Type: application/json

{"title":"Teste de backend Azure","description":"Avaliacao de API REST e persistencia em nuvem","difficulty":"Iniciante","durationMinutes":30,"status":"active"}
```

A leitura é `GET /api/tests/ID_RETORNADO`, com Authorization e sem corpo. Mostre que ID e título coincidem. Os SQLs correspondentes são:

```sql
INSERT INTO tests (id, company_id, title, description, difficulty, duration_minutes, status, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

SELECT * FROM tests WHERE id = $1 AND company_id = $2;
```

Opcionalmente, em um cliente SQL autorizado no firewall, consulte o ID real da evidência diretamente no Azure. Não declare essa consulta direta como executada sem conferir seu resultado.

## Simulações e evidências

```powershell
$appHost = az webapp show -g rg-avaliatech-students -n avaliatech-156973 --query defaultHostName -o tsv
$env:DEMO_API_URL = "https://$appHost/api"
$env:DEMO_EXPECT_POSTGRES = 'true'
npm run demo:api
```

O script verifica SQL em `/ready`, exige PostgreSQL, cadastra uma conta fictícia e faz login, grava/lê teste, cadastra questão/candidato, abre convite sem gabarito, envia resposta correta e exige nota 100. Consulta resultado, ranking, relatórios e dashboard. Confere 401 sem autenticação, 400 com dados inválidos e 409 por submissão duplicada.

`docs/evidencias/demo-api.json` contém requests, respostas, status e horário reais, sem senhas/tokens. `passed: true` aparece somente se todas as verificações passarem. A cada execução são criados testes e candidatos fictícios novos, na mesma conta salva quando a URL da API coincide. As credenciais ficam em `.azure/demo-login.json` (não versionado); falhas de login não trocam automaticamente a conta.

Na tela de candidatos, cada convite é uma participação independente. Um convite novo começa pendente e sem nota; após a prova fica em revisão, mesmo com nota 100. Aprovação/recusa é uma decisão manual por participação. Convites ativos do mesmo e-mail e teste são reutilizados; novos convites após conclusão preservam o histórico. Resultados antigos sem decisão individual registrada aparecem em revisão, pois o status global anterior misturava decisões e aprovação automática por nota. Nenhum candidato, convite ou resultado é apagado pela atualização.

Regressão: `npm run test:candidates` usa SQLite temporário isolado; `CANDIDATES_API_URL` permite executar o mesmo teste na API publicada com empresas fictícias separadas. Os testes verificam múltiplos convites, decisões independentes, nota zero, revisão, duplicidade e acesso entre empresas.

Reinicie a API e consulte o mesmo teste para demonstrar persistência além da sessão do servidor. `/health` indica processo ativo; `/ready` executa consulta SQL. Os testes HTTP comprovam a API, mas não substituem inspeção visual no navegador.

### Resultados executados nesta entrega

- [17 requests HTTP aprovados](evidencias/demo-api.json), incluindo os status 200, 201, 400, 401 e 409 esperados.
- [Persistência após reiniciar o App Service](evidencias/persistencia.json): mesmo ID e título do teste.
- [Verificação em navegador Chromium](evidencias/navegador.json): login pela interface, dashboard, atualização de rota SPA e relatórios; sem erros JavaScript capturados.
- Capturas reais: [dashboard](evidencias/dashboard-azure.png) e [relatórios](evidencias/relatorios-azure.png).

Para repetir a conferência após reinício, sem gerar outra conta:

```powershell
az webapp restart -g rg-avaliatech-students -n avaliatech-156973
node scripts/verify-persistence.mjs
```

Aguarde a aplicação ficar disponível se houver inicialização lenta no F1. O script usa a conta privada em `.azure/demo-login.json` e o ID da última simulação.

Limitações: a nota objetiva total é calculada de verdade; as barras por categoria são ilustrativas. Não há envio de e-mail, anexos ou correção por IA. Para uso comercial, são necessárias revisões de isolamento completo de candidatos entre empresas, atomicidade de operações compostas, rate limiting e autorização dos resultados por link. Use dados fictícios.

## Consumo dos créditos

F1 é gratuito dentro das cotas. O PostgreSQL B1ms pode consumir créditos. Consulte Assinaturas → Azure for Students → Cost Management e acompanhe o saldo e os benefícios aplicáveis. Alertas de orçamento não desligam recursos automaticamente. Após a avaliação, exclua o grupo dedicado pelo portal somente se não precisar mais dos dados; isso remove aplicação e banco. Parar apenas a aplicação não elimina custos do banco.

## Roteiro final — aproximadamente 8 minutos

| Tempo | Mostrar | Fala sugerida e requisito |
|---|---|---|
| 0:00–0:45 | Login e objetivo | “O AvaliaTech permite criar avaliações técnicas e acompanhar candidatos. Usamos a assinatura Azure for Students.” |
| 0:45–1:30 | Tabela de tecnologias e arquivos | “React/TypeScript constroem a interface; Node/Express executam a API, Zod valida dados e PostgreSQL persiste os registros.” Explique a complexidade dos relacionamentos, autenticação e correção. Não há hardware dedicado. |
| 1:30–2:20 | Diagrama e Portal Azure | “O navegador recebe o frontend do App Service. Axios chama `/api`; só o backend acessa o banco.” Mostre assinatura, App Service F1 e PostgreSQL, sem segredos. |
| 2:20–3:00 | Sequência e `/api/ready` | “HTTPS protege o acesso à aplicação; TLS e firewall protegem a conexão ao PostgreSQL. Ready executa SQL.” Mostre provider `postgres`. |
| 3:00–4:15 | `npm run demo:api` ou requests manuais | “Este POST grava um teste e retorna 201 com ID. Este GET consulta o mesmo registro e retorna 200.” Compare ID e título nos requests/respostas salvos. |
| 4:15–5:30 | Interface e DevTools → Network | Entre com a conta da simulação. Mostre teste, questão e candidato. Para prova ao vivo, convide outro candidato fictício e abra seu link em janela anônima; o convite da simulação já foi concluído. Responda, mostre POST de submissão e nota. |
| 5:30–6:15 | Resultado, ranking e relatórios | “A resposta correta gerou nota 100; a API consulta o banco para atualizar as telas.” Diferencie a nota real das categorias ilustrativas. |
| 6:15–7:00 | Cenários negativos e persistência | Mostre 401 sem token, 400 inválido, 409 por repetição. Apresente a consulta ao mesmo ID após reinício, quando validada. |
| 7:00–8:00 | Critérios e limites | “Demonstramos tecnologias, arquiteturas frontend/backend, dados na nuvem e requests reais de gravação e leitura com resultados verificáveis.” Explique limites e acompanhamento dos créditos. |

Antes de apresentar: confirme `/ready`, execute a simulação, abra as evidências, faça login e deixe diagramas/portal preparados. Oculte tokens em gravações públicas. Se usar fallback local, identifique-o como local e não como acesso ao Azure.
