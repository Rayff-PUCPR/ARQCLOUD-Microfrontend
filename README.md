# Microfrontend - RotaCerta

## Alunos

- Ícaro Rayff de Souza
- Armando de Souza Stein

Interface web da aplicação RotaCerta, responsável pela operação visual de pedidos, motoristas, rotas e visão consolidada da logística.

## Descrição da arquitetura

O Microfrontend é uma SPA desenvolvida em React. Ele não acessa microserviços diretamente; toda comunicação de backend passa pelo BFF.

Fluxo principal:

```txt
Usuário -> Microfrontend -> BFF
```

A camada `src/api.ts` concentra as chamadas HTTP para o BFF. A tela principal em `src/App.tsx` organiza o painel operacional, cadastro de pedidos, cadastro de motoristas, cálculo de rotas e visualização do mapa.

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Vitest
- Google Maps JavaScript API, opcional para exibição do mapa

## Como rodar localmente

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente, se necessário:

```env
VITE_BFF_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=
```

Inicie o frontend:

```bash
npm run dev
```

Endereço local:

- Microfrontend: `http://localhost:5173`

Para usar o mapa, habilite a Maps JavaScript API no Google Cloud, gere uma chave e preencha:

```env
VITE_GOOGLE_MAPS_API_KEY=sua_chave
```

Depois reinicie o Vite com `npm run dev`.

Para rodar os testes:

```bash
npm test
```
