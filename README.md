# Quitanda Fácil

Crie um sistema web completo para gerenciamento de uma quitanda/hortifruti, desenvolvido especificamente para um estabelecimento pequeno que possui apenas um computador e uma balança, sem leitores de código de barras, etiquetas ou equipamentos modernos.

O sistema deve ser simples, intuitivo, rápido e extremamente fácil de usar, inclusive para usuários com pouca experiência com computadores.

Objetivo principal

Criar um sistema de gestão para:

 Realizar vendas rapidamente.

 Utilizar a balança para produtos vendidos por peso.

 Controlar estoque.

 Cadastrar produtos.

 Registrar compras e fornecedores.

 Controlar o caixa.

 Registrar perdas de produtos.

 Visualizar relatórios simples.

Design e experiência do usuário

A interface deve ser moderna, limpa e profissional, mas sem parecer um sistema corporativo complexo.

Priorize:

 Navegação extremamente intuitiva.

 Poucos elementos desnecessários.

 Botões grandes o suficiente para serem facilmente identificados.

 Ícones acompanhados de texto.

 Informações importantes sempre visíveis.

 Feedback visual após ações.

 Mensagens de erro simples e claras.

 Confirmações antes de ações destrutivas.

 Layout responsivo, mas priorizando o uso em computador/desktop.

As fontes devem ser um pouco maiores que o padrão, proporcionando boa leitura, mas sem exagerar. Utilize aproximadamente 16px como tamanho base, com títulos e informações importantes proporcionalmente maiores.

Use uma paleta relacionada a hortifruti, com verde como cor principal, tons claros de fundo e cores de destaque para ações importantes. O visual deve transmitir organização, simplicidade, limpeza e confiança.

Estrutura da aplicação

Crie uma barra lateral fixa com:

 🏠 Dashboard

 🛒 Nova venda

 📦 Produtos

 📊 Estoque

 🚚 Compras

 👥 Fornecedores

 💰 Caixa

 📉 Perdas

 📈 Relatórios

 ⚙️ Configurações

A navegação deve ser rápida e cada seção deve possuir uma interface própria e clara.

Dashboard

Criar um painel inicial mostrando de forma visual e simples:

 Vendas de hoje

 Faturamento de hoje

 Quantidade de vendas

 Valor em caixa

 Produtos com estoque baixo

 Produtos com maior número de vendas

 Perdas registradas

Adicionar gráficos simples, sem excesso de informações.

Exemplo:

Vendas hoje: R$ 1.248,50

42 vendas

Estoque baixo: 6 produtos

Perdas hoje: R$ 32,40

Tela "Nova Venda"

Essa deve ser a tela mais importante do sistema e extremamente rápida de utilizar.

Criar uma interface semelhante a um PDV simplificado.

Na parte superior:

Nova Venda

Campo de busca:

🔎 Buscar produto...

Abaixo, mostrar produtos cadastrados em cartões ou uma lista simples.

Cada produto deve apresentar:

 Nome

 Preço por kg ou unidade

 Unidade de venda

Ao selecionar um produto vendido por peso, abrir uma área para informar o peso.

Exemplo:

Tomate

Preço: R$ 8,99/kg

Peso:

[ 1,350 kg ]

Total:

R$ 12,14

Permitir também produtos vendidos por unidade.

Exemplo:

Alface

Preço: R$ 3,00/unidade

Quantidade:

[ 2 ]

Total:

R$ 6,00

Carrinho

No lado direito, apresentar o carrinho:

Venda atual

Tomate — 1,350 kg — R$ 12,14
Batata — 2 kg — R$ 12,00
Alface — 2 un. — R$ 6,00

TOTAL: R$ 30,14

Botão grande:

FINALIZAR VENDA

Ao finalizar, abrir uma tela simples para escolher:

 Dinheiro

 Pix

 Cartão de débito

 Cartão de crédito

Se escolher dinheiro, mostrar:

Valor recebido

R$ 50,00

Troco

R$ 19,86

Botão:

CONFIRMAR VENDA

Após confirmar, limpar o carrinho e deixar a tela pronta para uma nova venda.

Integração com balança

Preparar a arquitetura para integração com uma balança conectada ao computador.

Criar uma configuração chamada:

Balança

Permitir:

 Conectar balança

 Selecionar porta de comunicação

 Testar conexão

 Ler peso automaticamente

Caso a balança ainda não esteja conectada, permitir informar o peso manualmente.

O sistema nunca deve impedir uma venda apenas porque a balança não está conectada.

Cadastro de produtos

Criar uma tela simples para cadastrar produtos.

Campos:

 Nome

 Categoria

 Tipo de venda:

 Por kg

 Por unidade

 Por caixa

 Preço de custo

 Preço de venda

 Estoque atual

 Estoque mínimo

 Fornecedor

 Produto ativo/inativo

Exemplos:

 Banana

 Maçã

 Tomate

 Batata

 Cenoura

 Alface

 Cebola

 Laranja

Permitir pesquisar e editar produtos facilmente.

Estoque

Criar uma tela de estoque com:

 Produto

 Quantidade atual

 Unidade

 Estoque mínimo

 Status

Utilizar indicadores visuais:

🟢 Estoque normal
🟡 Estoque baixo
🔴 Estoque crítico

Permitir:

 Entrada de estoque

 Saída manual

 Ajuste de estoque

 Registro de perdas

Compras

Criar uma área para registrar compras de fornecedores.

Campos:

 Fornecedor

 Data

 Produto

 Quantidade

 Preço de custo

 Valor total

Ao finalizar uma compra, atualizar automaticamente o estoque.

Fornecedores

Cadastro simples contendo:

 Nome

 Telefone

 CNPJ/CPF, se necessário

 Endereço

 Observações

Perdas

Criar uma área específica para hortifruti, pois produtos podem estragar rapidamente.

Permitir registrar:

 Produto

 Quantidade

 Motivo

 Data

 Valor estimado da perda

Motivos:

 Produto estragado

 Produto amassado

 Vencimento

 Quebra

 Outros

As perdas devem reduzir o estoque e aparecer nos relatórios.

Caixa

Criar uma tela de controle financeiro diário.

Mostrar:

 Caixa inicial

 Vendas em dinheiro

 Vendas via Pix

 Vendas no débito

 Vendas no crédito

 Despesas

 Sangrias

 Total esperado

Permitir:

Abrir caixa

Registrar movimentação

Fechar caixa

Ao fechar, mostrar um resumo:

Total de vendas: R$ 1.248,50

Dinheiro esperado: R$ 530,00

Pix: R$ 420,00

Cartão: R$ 298,50

Relatórios

Criar relatórios simples e fáceis de entender:

 Vendas por dia

 Vendas por período

 Produtos mais vendidos

 Faturamento

 Lucro estimado

 Perdas

 Compras

 Estoque

Adicionar filtros por:

 Hoje

 Ontem

 Últimos 7 dias

 Este mês

 Período personalizado

Banco de dados

Estruturar o banco de dados para possuir, no mínimo:

 usuários

 produtos

 categorias

 fornecedores

 vendas

 itens_venda

 compras

 itens_compra

 estoque

 movimentacoes_estoque

 perdas

 caixas

 movimentacoes_caixa

Criar relacionamentos adequados entre as tabelas.

Regras importantes

 Toda venda deve atualizar automaticamente o estoque.

 Toda compra deve aumentar o estoque.

 Toda perda deve reduzir o estoque.

 O sistema deve manter histórico das movimentações.

 Não permitir estoque negativo sem confirmação explícita.

 Não excluir vendas já finalizadas; utilizar cancelamento/estorno.

 Valores monetários devem utilizar o padrão brasileiro: R$ 0,00.

 Datas devem utilizar o padrão brasileiro: DD/MM/AAAA.

 Toda a interface deve estar em português do Brasil.

 Não utilizar termos técnicos desnecessários para o usuário.

 O sistema deve funcionar muito bem em uma tela de computador comum.

 Priorizar velocidade e simplicidade em todas as operações.

Importante sobre o design

Não criar uma interface cheia de gráficos, menus ou informações desnecessárias.

O sistema deve parecer um software de gestão simples de uma pequena quitanda, e não um ERP empresarial.

A pessoa deve conseguir abrir o sistema e entender imediatamente:

"Onde faço uma venda?"
"Quanto vendi hoje?"
"O que está acabando?"
"Quanto tenho no caixa?"

Priorize usabilidade, legibilidade, velocidade e simplicidade em toda a aplicação.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gestaodelucro070707.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d6ce5b69-c4a1-4242-927a-509f296e9421).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
