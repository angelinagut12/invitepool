create or replace function public.update_rsvp_by_token(
  p_edit_token text,
  p_guest_name text,
  p_email text,
  p_phone text,
  p_attending text,
  p_adults integer,
  p_children integer,
  p_message text,
  p_sms_opt_in boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_rsvp jsonb;
  clean_attending text;
begin
  clean_attending := lower(coalesce(p_attending, 'no'));

  if clean_attending not in ('yes', 'no', 'maybe') then
    clean_attending := 'no';
  end if;

  if coalesce(p_adults, 0) + coalesce(p_children, 0) < 1 then
    raise exception 'Please select at least 1 adult or child.';
  end if;

  update public.rsvps
  set
    guest_name = p_guest_name,
    email = lower(trim(p_email)),
    phone = nullif(trim(coalesce(p_phone, '')), ''),
    attending = clean_attending,
    adults = coalesce(p_adults, 0),
    children = coalesce(p_children, 0),
    guest_count = coalesce(p_adults, 0) + coalesce(p_children, 0),
    message = p_message,
    sms_opt_in = coalesce(p_sms_opt_in, false),
    sms_opt_in_at = case
      when coalesce(p_sms_opt_in, false) then now()
      else null
    end
  where edit_token::text = p_edit_token
  returning jsonb_build_object(
    'id', id,
    'event_id', event_id,
    'attending', attending,
    'adults', adults,
    'children', children,
    'guest_count', guest_count
  )
  into updated_rsvp;

  return updated_rsvp;
end;
$$;

grant execute on function public.update_rsvp_by_token(
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  boolean
) to anon, authenticated;
