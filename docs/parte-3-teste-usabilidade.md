# Parte 3 - Teste de Usabilidade

## Público-alvo

Realizar o teste com pelo menos 3 pessoas que representem:

- 2 recrutadores, analistas de RH ou pessoas que participam de triagem.
- 1 candidato ou pessoa que já tenha participado de processo seletivo técnico.

## Roteiro de execução

Antes de iniciar, explique que o objetivo é avaliar o sistema, não a pessoa. Peça para o participante pensar em voz alta enquanto navega.

### Tarefa 1 - Recrutador acessa o sistema

1. Abrir `http://localhost:5173`.
2. Entrar com `recrutador@techsolutions.com` e `123456`.
3. Identificar quantos testes ativos existem no dashboard.

Critérios observados: facilidade de login, clareza dos indicadores, compreensão do menu.

### Tarefa 2 - Criar um teste

1. Acessar `Testes`.
2. Criar um teste com nome, descrição, dificuldade e tempo.
3. Avançar para a tela de questões.
4. Adicionar uma questão simples.

Critérios observados: eficiência do formulário, clareza da etapa atual, facilidade de entender o próximo passo.

### Tarefa 3 - Convidar candidato

1. Acessar `Candidatos`.
2. Selecionar o teste.
3. Preencher nome e e-mail.
4. Gerar e copiar o link de convite.

Critérios observados: confiança no convite, clareza do link gerado, ausência de dúvidas sobre status do candidato.

### Tarefa 4 - Candidato realiza prova

1. Abrir o link de convite gerado.
2. Responder as questões.
3. Enviar respostas.
4. Visualizar resultado.

Critérios observados: navegação entre questões, entendimento do botão final, clareza do resultado.

### Tarefa 5 - Recrutador acompanha resultado

1. Voltar ao painel do recrutador.
2. Abrir `Ranking`.
3. Abrir `Relatórios`.
4. Identificar os melhores candidatos e a média dos testes.

Critérios observados: facilidade de comparação, clareza dos relatórios, utilidade para tomada de decisão.

## Planilha de avaliação

Use a tabela abaixo para cada participante.

| Participante | Perfil | Tarefa | Concluiu? | Tempo | Erros/Dúvidas | Eficiência (1-5) | Eficácia (1-5) | Satisfação (1-5) | Observações |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | RH | Login/dashboard |  |  |  |  |  |  |  |
| P1 | RH | Criar teste |  |  |  |  |  |  |  |
| P1 | RH | Convidar candidato |  |  |  |  |  |  |  |
| P2 | RH/Gestor | Ranking/relatórios |  |  |  |  |  |  |  |
| P3 | Candidato | Realizar prova |  |  |  |  |  |  |  |

## Perguntas finais

- O que ficou mais fácil de entender?
- Em qual momento você ficou em dúvida?
- O sistema passa confiança para usar em um processo seletivo real?
- Que informação faltou para tomar uma decisão?
- O resultado e ranking ajudam a contratar melhor?

## Insights esperados

- Validar se o fluxo teste -> questões -> convite é intuitivo.
- Identificar se candidatos entendem a navegação da prova.
- Avaliar se ranking e relatórios comunicam valor para RH.
- Descobrir quais informações são essenciais antes da próxima entrega.

## Ajustes prováveis após teste

- Melhorar feedback de sucesso após criar teste ou convidar candidato.
- Adicionar edição completa de questões.
- Incluir filtros por vaga/teste no ranking.
- Mostrar status de convite enviado, iniciado e concluído.
- Evoluir relatórios para exportação em PDF/CSV.
