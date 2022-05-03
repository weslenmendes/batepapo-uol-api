# Bate-papo UOL - API

Essa aplicação consiste em uma API para um site de chat online chamado de Bate-papo UOL, onde o usuário pode cadastrar-se, enviar mensagens públicas e privadas para outros usuários da aplicação, além de editar e deletar mensagens de sua autoria.

## Requisitos

- [x] Deve utilizar váriaveis de ambiente para esconder informações mais sensíveis, como conexão com banco;
- [x] Deve persistir os dados em um banco de dados noSQL, no caso, no MongoDB;
- [x] Deve ter duas coleções uma chamada de **participantes** e a outra de **mensagens**;
- [x] Deve ter um recurso para inserir participantes, obtendo dos mesmos apenas um **name** enviado pelo o body da requisição;
- [x] Deve validar todos os dados enviados usando a biblioteca JOI;
- [x] Deve sanitizar os dados antes de armazenar no banco de dados;
- [x] Deve ter apenas usuários com nomes únicos armazenados no banco de dados;
- [x] Deve ter um recurso de retornar todos os participantes ativos;
- [x] Deve ter um recurso para enviar mensagens, usando o body da requisição;
- [x] Deve ter um recurso para retornar as mensagens, buscando por mensagens com um **limit**, enviado por uma query string, e as mensagens devem ser filtradas por: mensagens públicas, mensagens privadas para o usuário ou enviadas por ele, e mensagens de status;
- [x] Deve ter um recurso para manter o usuário ativo na aplicação;
- [x] Deve ter um recurso para remoção de usuários inativos na aplicação;
- [x] Deve ter um recurso de deleção de mensagens pelo ID da mesma;
- [x] Deve ter um recurso para atualizar mensagens pelo ID da mesma.

## Rotas

```
POST    /participants            -> Permite o inserir de participantes na aplicação
GET     /participants            -> Retorna todos os participantes ativos da aplicação
POST    /messages                -> Permite inserir uma mensagem na aplicação
GET     /messages?limit=10       -> Retorna as últimas 10 mensagens visíveis para um participante específico
PUT     /messages/:messageId     -> Permite editar uma mensagem específica, de autoria do participante
DELETE  /messages/:messageId     -> Permite deletar uma mensagem específica, de autoria do participante
POST    /status                  -> Permite manter o participante ativo na aplicação
```

## Tecnologias usadas

- NodeJS
- ExpressJS
- CORS
- JOI
- String-strip-html
- DayJS
- MongoDB

## Como executar

Passo 1: Inicialmente precisamos fazer o clone do repositório na máquina local, para isso executamos os comandos abaixo em um terminal:

```bash
git clone https://github.com/weslenmendes/batepapo-uol-api.git
```

Passo 2: Após finalizar o processo de clone do repositório, precisamos entrar na pasta criada e instalar as dependências do projeto:

```bash
cd batepapo-uol-api && npm install
```

Passo 3: Após o término da instalação das dependências, podemos executar o script para colocar o nosso server no ar:

```bash
npm run dev
```

Com a finalização de todos os passos anteriores, o nosso server deve estar sendo executado na porta 5000 da nossa máquina local.

---

<p align="center">Feito com 💜 por <a href="https://github.com/weslenmendes">Weslen Mendes</a></p>
