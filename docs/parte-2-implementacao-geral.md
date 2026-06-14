# Parte 2 - Implementação Geral

## Objetivo do protótipo

O AvaliaTech é um SaaS de recrutamento para PMEs que permite criar testes técnicos, convidar candidatos, aplicar a prova online, corrigir questões objetivas e visualizar ranking/relatórios.

Esta entrega opta por protótipo funcional programado, substituindo o protótipo de baixa/média fidelidade em ferramenta visual. O foco é permitir teste de usabilidade com fluxo navegável e dados persistidos.

## Usuários-alvo

- Recrutador ou analista de RH de pequenas e médias empresas.
- Gestor técnico que acompanha ranking e resultados.
- Candidato convidado para realizar avaliação online.

## Stack definida

- Frontend: React, TypeScript, Vite, React Router, Axios e Lucide Icons.
- Backend: Node.js, Express e TypeScript.
- Banco local da entrega: SQLite com seed automático.
- Banco futuro em nuvem: PostgreSQL gerenciado.
- Cloud planejada: AWS.

## Justificativa técnica

React com Vite acelera a construção de telas interativas e responsivas para o protótipo. Node.js com Express facilita a criação rápida de endpoints REST. SQLite permite persistência real local sem depender de credenciais externas nesta fase. Para a próxima entrega, a arquitetura pode migrar o banco para Amazon RDS PostgreSQL mantendo os mesmos contratos de API.

## Fluxos implementados

- Login de recrutador.
- Dashboard com indicadores reais do banco.
- Criação de teste.
- Cadastro e exclusão de questões.
- Cadastro de candidatos e geração de link de convite.
- Prova do candidato por link.
- Envio de respostas e correção automática das objetivas.
- Resultado individual.
- Ranking de candidatos.
- Relatórios com visão operacional e plano de cloud.

## Como executar

```bash
npm install
npm run db:setup --workspace backend
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3333`

Login de demonstração:

- E-mail: `recrutador@techsolutions.com`
- Senha: `123456`

## Planejamento para cloud

- Provedor: AWS.
- API: ECS Fargate ou Elastic Beanstalk.
- Banco: Amazon RDS PostgreSQL.
- Arquivos/relatórios: Amazon S3.
- Segredos: AWS Secrets Manager.
- Observabilidade: CloudWatch.
