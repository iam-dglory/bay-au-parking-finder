-- Direct API access must enforce the same approval boundary as nearby_parking.
drop policy "spots are publicly readable" on public.parking_spots;
create policy "approved or own spots are readable" on public.parking_spots
  for select using (moderation_status = 'approved' or created_by = auth.uid());
drop policy "authenticated users can add spots" on public.parking_spots;
create policy "users submit pending photographed spots" on public.parking_spots
  for insert to authenticated with check
  (created_by = auth.uid() and moderation_status = 'pending' and nullif(btrim(photo_url), '') is not null);
drop policy "owners can update their spots" on public.parking_spots;
create policy "owners can edit pending spots" on public.parking_spots
  for update to authenticated using (created_by = auth.uid() and moderation_status = 'pending')
  with check (created_by = auth.uid() and moderation_status = 'pending' and nullif(btrim(photo_url), '') is not null);

drop policy "rules are publicly readable" on public.parking_rules;
create policy "rules follow visible parent" on public.parking_rules
  for select using (exists (select 1 from public.parking_spots s where s.id = spot_id));
drop policy "authenticated users can add rules" on public.parking_rules;
create policy "owners add reported rules to pending spots" on public.parking_rules
  for insert to authenticated with check (created_by = auth.uid() and match_method = 'reported' and
    exists (select 1 from public.parking_spots s where s.id = spot_id and s.created_by = auth.uid() and s.moderation_status = 'pending'));
drop policy "owners can update their rules" on public.parking_rules;
create policy "owners edit reported rules on pending spots" on public.parking_rules
  for update to authenticated using (created_by = auth.uid() and
    exists (select 1 from public.parking_spots s where s.id = spot_id and s.created_by = auth.uid() and s.moderation_status = 'pending'))
  with check (created_by = auth.uid() and match_method = 'reported' and
    exists (select 1 from public.parking_spots s where s.id = spot_id and s.created_by = auth.uid() and s.moderation_status = 'pending'));
drop policy "owners can delete their rules" on public.parking_rules;
create policy "owners delete rules on pending spots" on public.parking_rules
  for delete to authenticated using (created_by = auth.uid() and
    exists (select 1 from public.parking_spots s where s.id = spot_id and s.created_by = auth.uid() and s.moderation_status = 'pending'));
