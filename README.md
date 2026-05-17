# Site de Casamento N & G

Site React editável para casamento, com páginas públicas, RSVP por busca de nome, lista de presentes com Pix/Mercado Pago, painel admin e exportação CSV.

## Rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Copie `.env.example` para `.env` e preencha quando tiver o Supabase:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

3. Rode o site:

```bash
npm run dev
```

Sem Supabase configurado, o site entra em modo demonstração local e salva alterações no navegador.

## Configurar Supabase

1. Crie um projeto Supabase.
2. Abra o SQL Editor e execute `supabase/schema.sql`.
3. Em Authentication, crie o usuário admin dos noivos com e-mail e senha.
4. Em Storage, confirme que o bucket público `wedding-media` foi criado.
5. Coloque `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis do Cloudflare Pages.

## Publicar no Cloudflare Pages

1. Suba este projeto para um repositório.
2. No painel da Cloudflare, acesse Workers & Pages.
3. Crie uma aplicação Pages importando o repositório.
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Use os comandos padrão:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Publique o projeto.

O arquivo `wrangler.toml` já aponta a saída para `./dist`, caso você prefira publicar pelo Wrangler. O arquivo `public/_redirects` mantém as rotas `/evento`, `/confirmar`, `/presentes` e `/admin` funcionando quando abertas diretamente no navegador.

## Uso

- `/` mostra a história e fotos.
- `/evento` mostra data, hora, local, mapa e traje.
- `/confirmar` permite que convidados pesquisem o nome e confirmem presença por pessoa.
- `/presentes` mostra presentes com Pix e Mercado Pago.
- `/admin` permite editar conteúdo, evento, convidados, presentes, fotos e exportar confirmados em CSV.
