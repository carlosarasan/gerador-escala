# Gerador de Escalas para Igreja

Sistema web simples e intuitivo para gerar escalas de participação na igreja, com distribuição automática de pessoas conforme os dias selecionados e a disponibilidade de cada participante.

## Objetivo

Este sistema foi desenvolvido para facilitar a criação de escalas mensais de forma prática, organizada e visual, evitando repetições excessivas e permitindo ajustes manuais antes da exportação final.

## Funcionalidades

- Cadastro manual de pessoas
- Definição de disponibilidade por dia da semana
- Seleção dos dias de culto
- Geração automática da escala
- Configuração da quantidade de pessoas por culto
- Controle de intervalo mínimo entre escalas
- Visualização em calendário
- Edição manual da escala gerada
- Resetar edições feitas manualmente
- Upload de logo/imagem opcional
- Exportação da escala em Excel
- Exportação da escala em PDF

## Como funciona

O usuário informa:

- título da escala
- subtítulo opcional
- mês desejado
- dias da semana em que haverá culto
- quantidade de pessoas por culto
- intervalo mínimo entre escalas
- pessoas participantes e seus dias disponíveis

Depois disso, o sistema gera automaticamente a distribuição dos nomes ao longo do mês, tentando equilibrar a quantidade de participações entre todos.

## O que significa "intervalo mínimo entre escalas"

Essa opção serve para evitar que a mesma pessoa seja escalada novamente em um intervalo muito curto.

### Exemplo:
Se o intervalo for `1`, a pessoa que participou de um culto não deve aparecer no culto imediatamente seguinte.

Se o intervalo for `2`, o sistema tenta fazer com que dois cultos passem antes dessa pessoa voltar a ser escalada.

Isso ajuda a tornar a escala mais justa e equilibrada.

## Estrutura do projeto

```bash
/
├── index.html
├── styles.css
└── app.js
