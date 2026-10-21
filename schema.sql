-- Livraria Michel: execute no SQL Editor do Supabase (pode repetir sem problema)
create table if not exists books(id bigserial primary key,slug text unique not null,titulo text not null,autor text,preco numeric default 0,categoria text,descricao text default '',isbn text,capa_url text,pdf_path text,leitura_path text,publicado boolean default true,criado timestamptz default now());
alter table books add column if not exists leitura_path text;
alter table books add column if not exists palavras text;
alter table books add column if not exists trecho text;
alter table books add column if not exists sobre_autor text;
create table if not exists articles(id bigserial primary key,slug text unique not null,titulo text not null,resumo text,corpo text default '',capa_url text,publicado boolean default true,criado timestamptz default now());
create table if not exists settings(key text primary key,value text);
create table if not exists pedidos(id bigserial primary key,marcado_path text,book_id bigint references books(id) on delete set null,email text not null,telefone text not null,codigo text unique not null,estado text not null default 'pendente' check(estado in('pendente','pago','bloqueado')),dispositivo text,dispositivo_em timestamptz,downloads int not null default 0,aceitou_em timestamptz,versao_regras text,criado timestamptz default now());
alter table pedidos add column if not exists marcado_path text;
alter table pedidos add column if not exists comprovativo_path text;
alter table pedidos add column if not exists comprovativo_em timestamptz;
alter table pedidos add column if not exists codigo_enviado_em timestamptz;
create index if not exists pedidos_email_idx on pedidos(email);
create table if not exists alertas(id bigserial primary key,pedido_id bigint references pedidos(id) on delete cascade,tipo text,detalhe text,lido boolean default false,criado timestamptz default now());
create table if not exists admins(email text primary key);
create table if not exists tentativas(id bigserial primary key,chave text not null,criado timestamptz default now());
create index if not exists tentativas_idx on tentativas(chave,criado);
create or replace function is_admin() returns boolean language sql security definer set search_path=public stable as $$select exists(select 1 from admins where lower(email)=lower(coalesce(auth.jwt()->>'email','')))$$;
alter table admins enable row level security;alter table tentativas enable row level security;
revoke all on admins,tentativas from anon,authenticated;
alter table books enable row level security;alter table articles enable row level security;alter table settings enable row level security;alter table pedidos enable row level security;alter table alertas enable row level security;
drop policy if exists "ler livros" on books;create policy "ler livros" on books for select using(publicado);
drop policy if exists "ler artigos" on articles;create policy "ler artigos" on articles for select using(publicado);
drop policy if exists "ler definicoes" on settings;create policy "ler definicoes" on settings for select using(true);
drop policy if exists "admin livros" on books;create policy "admin livros" on books for all to authenticated using(is_admin()) with check(is_admin());
drop policy if exists "admin artigos" on articles;create policy "admin artigos" on articles for all to authenticated using(is_admin()) with check(is_admin());
drop policy if exists "admin definicoes" on settings;create policy "admin definicoes" on settings for all to authenticated using(is_admin()) with check(is_admin());
drop policy if exists "admin pedidos" on pedidos;create policy "admin pedidos" on pedidos for all to authenticated using(is_admin()) with check(is_admin());
drop policy if exists "admin alertas" on alertas;create policy "admin alertas" on alertas for all to authenticated using(is_admin()) with check(is_admin());
-- pedidos e alertas: sem política pública. Só o admin autenticado e o servidor (service key) lhes acedem.
insert into storage.buckets(id,name,public) values('capas','capas',true),('pdfs','pdfs',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('comprovativos','comprovativos',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do update set file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];
drop policy if exists "admin ficheiros" on storage.objects;
create policy "admin ficheiros" on storage.objects for all to authenticated using(is_admin() and bucket_id in('capas','pdfs','comprovativos')) with check(is_admin() and bucket_id in('capas','pdfs','comprovativos'));
-- DEPOIS de criar o utilizador admin, registe o email dele (obrigatório):
-- insert into admins(email) values('o-seu-email@exemplo.com');
-- Rascunhos: itens guardados mas ainda não publicados (não aparecem no site)
alter table books add column if not exists rascunho boolean default false;
alter table books add column if not exists publicado_em timestamptz;
alter table articles add column if not exists rascunho boolean default false;
alter table articles add column if not exists publicado_em timestamptz;
update books set publicado_em=criado where publicado and publicado_em is null;
update articles set publicado_em=criado where publicado and publicado_em is null;
