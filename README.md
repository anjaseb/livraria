# Livraria Michel
HTML/JS + Supabase + Vercel. As páginas dos livros são geradas no servidor a partir da base de dados: publicar é imediato, sem commits nem token do GitHub.

## Organização (inspirada no site DH)
```
assets/css/style.css   assets/js/*.js   assets/img/      tudo o que é estático, como no DH
assets/js/config.js    URL e chave PÚBLICA do Supabase (nunca a service key)
assets/js/admin.js     painel (sem scripts inline: a CSP não os deixa correr)
admin.html, site.webmanifest, vercel.json (CSP e cabeçalhos de segurança), schema.sql
api/pagina.js          devolve /, /<slug>, /blog/<slug>, /ler/<slug>, /acesso, /termos, /privacidade, /sitemap.xml, /robots.txt
api/_gen.js            modelos das páginas (SEO: canonical, Open Graph, Schema.org Organization/Book/Offer/ReadAction)
api/solicitar, comprovativo, confirmar, acesso, download, leitura, gratis
```
Ficheiros de verificação (Google/Bing) vão na raiz, como no DH, e passam antes das páginas. Títulos reservados (o admin acrescenta `-livro`): index, admin, privacidade, termos, acesso, ler, api, blog, 404, sitemap, robots, assets.

## Instalar
1. Supabase: execute `schema.sql`; crie o utilizador admin (Authentication > Users), desactive novos registos e **execute** `insert into admins(email) values('o-seu-email');`. Sem isto o admin não consegue gravar.
2. Em `assets/js/config.js` cole o Project URL e a chave pública (publishable/anon).
3. Vercel, variáveis: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SITE_URL` e as do email (ver abaixo).
4. `/admin > Definições`: nome da entidade, email de contacto, instruções de pagamento (e WhatsApp de apoio, opcional). Depois carregue livros.
5. Search Console e Bing: envie `/sitemap.xml`; em cada livro novo use "Inspeccionar URL > Pedir indexação".
6. Mantenha o projecto Supabase activo (o plano grátis pausa após cerca de 1 semana sem uso).
7. Depois de publicar, teste no telemóvel: o leitor (`/ler/...`), o admin e um download. A CSP é restritiva; se algo não abrir, veja o erro na consola e ajuste `vercel.json`.

## O que veio do site DH
- Código com prefixo (`LM-XXXXX-XXXXX`) e limite de tentativas: 10 falhas em 15 minutos por IP bloqueiam o IP (tabela `tentativas`).
- Segurança em `vercel.json`: CSP, X-Frame-Options DENY, Permissions-Policy, nosniff, `trailingSlash:false`.
- Scripts só em ficheiros externos e config pública separada.
- Admin só para quem estiver em `admins` (função `is_admin()` nas políticas RLS), além de os registos estarem desligados.
- Privacidade com "Última actualização", entidade responsável e morada vindas das Definições (só aparecem se preenchidas).
- Botão flutuante de WhatsApp de apoio (só se houver número nas Definições), favicon, manifest, `noindex` nas páginas privadas e 404.
- Dados estruturados de Organização com contacto, como o perfil do DH tem de Pessoa.

## Tipos de livro
- **Grátis** (preço 0): leitura completa online e botão "Descarregar grátis", sem código.
- **Pago**: amostra grátis (campo "Amostra", opcional) e PDF completo só com código.

## Email do código (SMTP)
O código é enviado por email quando confirma o pagamento. Variáveis na Vercel: `SMTP_HOST`, `SMTP_PORT` (465 por defeito), `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` (ex.: `Livraria Michel <o-seu-email@gmail.com>`).
- Gmail: `smtp.gmail.com`, porta 465, `SMTP_USER` = o seu Gmail, `SMTP_PASS` = **palavra-passe de aplicação** (Conta Google > Segurança > Verificação em 2 passos > Palavras-passe de aplicação). Limite de cerca de 500 emails por dia.
- Alternativas com domínio próprio: Brevo ou Resend (SMTP).
Se o SMTP não estiver configurado, o admin mostra o código no ecrã para o enviar por outra via. Veja a pasta de spam nos primeiros testes.

## Fluxo do pedido
1. O cliente pede o download: email (escrito duas vezes), telefone, aceita as regras. O código é criado e fica só no admin.
2. Paga e **envia o comprovativo no site** (logo a seguir ao pedido ou em `/comprovativo`, com o número do pedido e o email). Fica em armazenamento privado (`comprovativos`, só imagem/PDF até 5 MB).
3. Em `/admin > Pedidos` abre "Ver comprovativo" e carrega em "Confirmar pagamento e enviar código". O sistema envia o código para o email do pedido. "Corrigir email" e "Reenviar código" resolvem erros de escrita.
4. O cliente entra em `/acesso` (menu ⋮). O 1.º dispositivo fica associado; outro é negado e gera alerta em `/admin > Alertas`.
5. O PDF descarregado e a leitura completa levam, em cada página, "Licenciado para <email> | Código <código>". Limite de downloads por código nas Definições (por defeito 3). A ligação dura 60 s.

## Limites reais
- Livros grátis e amostras podem ser guardados por quem tiver conhecimentos técnicos. Por isso o PDF completo de um livro pago nunca sai sem código.
- "Dispositivo" é um identificador do navegador. Dados limpos contam como dispositivo novo (use "Libertar dispositivo"). A marca de licença desencoraja a partilha, mas não a impede.
- A marca é feita na função da Vercel. PDFs muito grandes (dezenas de MB) ou protegidos com palavra-passe podem falhar. Se falhar, o download é recusado, nunca entregue sem marca.
- Textos de privacidade e termos são modelos. Mande revê-los por um jurista.

## Logotipo
Livro aberto com marcador dourado, nas cores do site. Ficheiros em `assets/img/`: `logo.svg` (com nome), `favicon.svg`, `logo.png`, ícones PNG, `og.png` (imagem de partilha). O cabeçalho usa o símbolo + o nome em texto.

## Pesquisa em Angola e África (SEO)
- Todas as páginas: `lang="pt-AO"`, `hreflang`, `og:locale pt_AO`, região `AO`, palavras-chave (Angola, África lusófona, Kwanzas, livros em PDF...) e dados estruturados com `areaServed` Angola e África.
- Home: título e texto com "livraria digital em Angola" e secção "Livros em Angola e em África". Cada livro tem o campo "Palavras-chave", e `/admin > Definições` tem as palavras gerais do site.
- A etiqueta `keywords` pesa pouco no Google. O que mais pesa é o texto real das páginas: descreva cada livro com palavras que as pessoas pesquisam (tema, autor, país, época).
- Envie o sitemap no Google Search Console e no Bing Webmaster Tools. Um domínio `.ao` (ou um domínio próprio) ajuda mais do que `.vercel.app`.

## Páginas para indexação
- `/` (início, com categorias), `/<livro>`, `/categoria/<nome>`, `/autor/<nome>`, `/blog` (todos os artigos), `/blog/<artigo>`, `/sobre`, `/contactos` (só existe se houver email, WhatsApp ou morada nas Definições), `/termos`, `/privacidade`. Todas no sitemap.
- Migalhas visíveis (Início › Categoria › Livro) e em dados estruturados; categorias e autores nascem sozinhos dos campos do livro.
- Em cada livro, preencha Descrição, Trecho e Sobre o autor: é o texto que o Google lê (a leitura online não é indexada).
- Em `/admin > Definições` pode colar os códigos de verificação do Google e do Bing e escrever o texto de "Sobre".

## Rascunhos
Em Livros e Artigos há dois botões: "Guardar rascunho" (não aparece no site, pode faltar o PDF e os campos) e "Publicar" (o livro precisa do PDF). Os rascunhos ficam numa lista própria, com "Continuar" e "Publicar". Depois de publicado, o endereço (slug) não muda. Um livro publicado pode voltar a rascunho com "Tirar do ar". O texto que está a escrever também é guardado no telemóvel, para não o perder se fechar a página antes de gravar.
