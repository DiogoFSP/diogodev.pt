-- ============================================================================
-- MIGRAÇÃO: imagens dos projetos (correr uma vez no SQL Editor do Supabase)
-- ============================================================================

-- coluna para o URL da imagem do projeto (null = usa a ilustração em código)
alter table public.projects add column image text;

-- bucket público para as miniaturas
insert into storage.buckets (id, name, public) values ('thumbs', 'thumbs', true);

-- qualquer visitante pode VER as imagens…
create policy "thumbs publicas" on storage.objects
  for select using (bucket_id = 'thumbs');

-- …mas só com login se pode carregar/substituir/apagar
create policy "thumbs upload autenticado" on storage.objects
  for insert with check (bucket_id = 'thumbs' and auth.role() = 'authenticated');
create policy "thumbs update autenticado" on storage.objects
  for update using (bucket_id = 'thumbs' and auth.role() = 'authenticated');
create policy "thumbs delete autenticado" on storage.objects
  for delete using (bucket_id = 'thumbs' and auth.role() = 'authenticated');
