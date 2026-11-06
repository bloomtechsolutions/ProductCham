-- BML Product Champion — Supabase schema (already applied to project mmyqdefiixeqbjazufkt).
-- Run this whole file in the SQL editor of an EMPTY project to recreate everything.

create extension if not exists pgcrypto with schema extensions;

-- ============ Tables ============
create table public.questions (
  id          bigint generated always as identity primary key,
  position    int  not null,
  category    text not null check (category in ('Accounts','Cards','Financing','Business Products')),
  text        text not null,
  answer      boolean not null,
  explanation text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
comment on table public.questions is 'Quiz questions. Active questions, ordered by position, are used when a new game is created.';

create table public.app_settings (key text primary key, value text);
comment on table public.app_settings is 'host_pin: if set, required to create a game.';
insert into public.app_settings(key, value) values ('host_pin', null);

create table public.games (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  host_token       text not null,
  phase            text not null default 'lobby' check (phase in ('lobby','question','reveal','finished')),
  q_index          int  not null default -1,
  question_ids     bigint[] not null,
  question_seconds int  not null default 20,
  started_at       timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz not null default now()
);

create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games(id) on delete cascade,
  name        text not null,
  staff_id    text,
  department  text,
  token       text not null,
  joined_at   timestamptz not null default now()
);
comment on table public.registrations is 'Players registered for a game (one row per person per game).';
create unique index registrations_game_name_uq  on public.registrations (game_id, lower(name));
create unique index registrations_game_staff_uq on public.registrations (game_id, lower(staff_id)) where staff_id is not null;

create table public.answers (
  game_id      uuid not null references public.games(id) on delete cascade,
  player_id    uuid not null references public.registrations(id) on delete cascade,
  q_index      int  not null,
  question_id  bigint not null references public.questions(id),
  answer       boolean not null,
  correct      boolean not null,
  ms           int not null,
  answered_at  timestamptz not null default clock_timestamp(),
  primary key (player_id, q_index)
);
create index answers_game_q_idx on public.answers (game_id, q_index);
create index answers_question_idx on public.answers (question_id);

-- Tables are private: the app only goes through the functions below.
alter table public.questions     enable row level security;
alter table public.app_settings  enable row level security;
alter table public.games         enable row level security;
alter table public.registrations enable row level security;
alter table public.answers       enable row level security;
revoke all on public.questions, public.app_settings, public.games, public.registrations, public.answers from anon, authenticated;

-- ============ Leaderboard ============
-- Most correct wins; on a draw, the lowest total time across correct answers wins.
create function public._leaderboard(p_game_id uuid)
returns table(rank bigint, id uuid, name text, staff_id text, department text, score bigint, time_ms bigint, tie_broken_by_time boolean)
language sql stable security definer set search_path = '' as $$
  select o.rank, o.id, o.name, o.staff_id, o.department, o.score, o.time_ms,
         o.score > 0 and (lag(o.score) over w = o.score or lead(o.score) over w = o.score) as tie_broken_by_time
  from (
    select row_number() over (order by s.score desc, s.time_ms asc, s.name) as rank, s.*
    from (
      select r.id, r.name, r.staff_id, r.department,
             count(a.*) filter (where a.correct) as score,
             coalesce(sum(a.ms) filter (where a.correct), 0)::bigint as time_ms
      from public.registrations r
      left join public.answers a on a.player_id = r.id
      where r.game_id = p_game_id
      group by r.id
    ) s
  ) o
  window w as (order by o.rank)
  order by o.rank;
$$;

-- ============ RPCs ============
create function public.pin_required()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select value from public.app_settings where key = 'host_pin'), '') <> '';
$$;

create function public.create_game(p_pin text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pin text;
  v_code text;
  v_ids bigint[];
  v_token text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  select value into v_pin from public.app_settings where key = 'host_pin';
  if coalesce(v_pin, '') <> '' and coalesce(p_pin, '') <> v_pin then
    raise exception 'Incorrect host PIN.' using errcode = 'P0001';
  end if;
  select array_agg(id order by position, id) into v_ids from public.questions where active;
  if v_ids is null then raise exception 'No active questions.' using errcode = 'P0001'; end if;
  loop
    v_code := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    exit when not exists (select 1 from public.games where code = v_code);
  end loop;
  insert into public.games(code, host_token, question_ids) values (v_code, v_token, v_ids);
  return jsonb_build_object('code', v_code, 'hostToken', v_token);
end $$;

create function public.join_game(p_code text, p_name text, p_staff_id text default null, p_department text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  g public.games;
  v_name text := left(regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g'), 40);
  v_staff text := nullif(left(btrim(coalesce(p_staff_id, '')), 20), '');
  v_dept text := nullif(left(btrim(coalesce(p_department, '')), 60), '');
  r public.registrations;
begin
  select * into g from public.games where code = p_code;
  if not found then raise exception 'Game not found. Check the code.' using errcode = 'P0001'; end if;
  if g.phase = 'finished' then raise exception 'This game has already finished.' using errcode = 'P0001'; end if;
  if v_name = '' then raise exception 'Please enter your name.' using errcode = 'P0001'; end if;
  if v_staff is not null and exists (select 1 from public.registrations where game_id = g.id and lower(staff_id) = lower(v_staff)) then
    raise exception 'This staff ID is already registered in this game.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.registrations where game_id = g.id and lower(name) = lower(v_name)) then
    raise exception 'That name is already taken — add your initial.' using errcode = 'P0001';
  end if;
  insert into public.registrations(game_id, name, staff_id, department, token)
  values (g.id, v_name, v_staff, v_dept, encode(extensions.gen_random_bytes(16), 'hex'))
  returning * into r;
  return jsonb_build_object('playerId', r.id, 'token', r.token, 'name', r.name);
exception when unique_violation then
  raise exception 'That name or staff ID is already registered in this game.' using errcode = 'P0001';
end $$;

create function public.submit_answer(p_code text, p_player_id uuid, p_token text, p_q_index int, p_answer boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  g public.games;
  v_qid bigint;
  v_correct boolean;
  v_ms int;
begin
  select * into g from public.games where code = p_code;
  if not found then raise exception 'Game not found.' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.registrations where id = p_player_id and game_id = g.id and token = p_token) then
    raise exception 'Not a player in this game.' using errcode = 'P0001';
  end if;
  if g.phase <> 'question' or g.q_index <> p_q_index then raise exception 'This question is closed.' using errcode = 'P0001'; end if;
  if v_now > g.ends_at + interval '750 milliseconds' then raise exception 'Time''s up!' using errcode = 'P0001'; end if;

  v_qid := g.question_ids[g.q_index + 1];
  select answer = p_answer into v_correct from public.questions where id = v_qid;
  v_ms := greatest(0, floor(extract(epoch from (v_now - g.started_at)) * 1000))::int;

  insert into public.answers(game_id, player_id, q_index, question_id, answer, correct, ms, answered_at)
  values (g.id, p_player_id, p_q_index, v_qid, p_answer, v_correct, v_ms, v_now)
  on conflict (player_id, q_index) do nothing;
  if not found then raise exception 'You already answered this question.' using errcode = 'P0001'; end if;
  return jsonb_build_object('ms', v_ms);
end $$;

create function public.host_control(p_code text, p_host_token text, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  g public.games;
  v_now timestamptz := clock_timestamp();
  v_total int;
begin
  select * into g from public.games where code = p_code for update;
  if not found then raise exception 'Game not found.' using errcode = 'P0001'; end if;
  if g.host_token <> p_host_token then raise exception 'Not authorised to host this game.' using errcode = 'P0001'; end if;
  v_total := cardinality(g.question_ids);

  if p_action = 'start' then
    if g.phase <> 'lobby' then raise exception 'Game already started.' using errcode = 'P0001'; end if;
    update public.games set phase = 'question', q_index = 0, started_at = v_now,
      ends_at = v_now + make_interval(secs => question_seconds) where id = g.id;
  elsif p_action = 'reveal' then
    if g.phase = 'question' then
      update public.games set phase = 'reveal', ends_at = least(ends_at, v_now) where id = g.id;
    end if;
  elsif p_action = 'next' then
    if g.phase = 'reveal' then
      if g.q_index + 1 >= v_total then
        update public.games set phase = 'finished' where id = g.id;
      else
        update public.games set phase = 'question', q_index = q_index + 1, started_at = v_now,
          ends_at = v_now + make_interval(secs => question_seconds) where id = g.id;
      end if;
    end if;
  elsif p_action = 'end' then
    update public.games set phase = 'finished' where id = g.id;
  else
    raise exception 'Unknown action.' using errcode = 'P0001';
  end if;
  select * into g from public.games where id = g.id;
  return jsonb_build_object('phase', g.phase, 'qIndex', g.q_index);
end $$;

-- One call returns everything a screen needs. The correct answer is only included once revealed.
create function public.game_state(p_code text, p_host_token text default null, p_player_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  g public.games;
  q public.questions;
  v_show boolean;
  v_total int;
  v_base jsonb;
  v_board jsonb;
  v_players jsonb;
  v_stats jsonb;
  v_answered int := 0;
  v_me jsonb;
  r public.registrations;
  a public.answers;
  v_mine record;
begin
  select * into g from public.games where code = p_code;
  if not found then raise exception 'Game not found.' using errcode = 'P0001'; end if;
  v_total := cardinality(g.question_ids);
  v_show := g.phase in ('question','reveal');
  if g.q_index >= 0 then select * into q from public.questions where id = g.question_ids[g.q_index + 1]; end if;

  v_base := jsonb_build_object(
    'code', g.code, 'phase', g.phase, 'qIndex', g.q_index, 'total', v_total,
    'questionSeconds', g.question_seconds,
    'endsAt', coalesce(floor(extract(epoch from g.ends_at) * 1000), 0)::bigint,
    'serverNow', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'question', case when v_show then jsonb_build_object('category', q.category, 'text', q.text) end,
    'reveal', case when g.phase = 'reveal' then jsonb_build_object('answer', q.answer, 'explanation', q.explanation) end
  );

  if p_host_token is not null then
    if p_host_token <> g.host_token then raise exception 'Not authorised.' using errcode = 'P0001'; end if;
    select coalesce(jsonb_agg(name order by joined_at), '[]') into v_players from public.registrations where game_id = g.id;
    if v_show then
      select count(*) into v_answered from public.answers where game_id = g.id and q_index = g.q_index;
    end if;
    if g.phase = 'reveal' then
      select jsonb_build_object(
        'trueCount',    count(*) filter (where a2.answer),
        'falseCount',   count(*) filter (where not a2.answer),
        'correctCount', count(*) filter (where a2.correct),
        'fastest', coalesce((
          select jsonb_agg(jsonb_build_object('name', r2.name, 'ms', f.ms) order by f.ms)
          from (select player_id, ms from public.answers
                where game_id = g.id and q_index = g.q_index and correct order by ms limit 3) f
          join public.registrations r2 on r2.id = f.player_id), '[]'))
      into v_stats
      from public.answers a2 where a2.game_id = g.id and a2.q_index = g.q_index;
    end if;
    if g.phase in ('reveal','finished') then
      select coalesce(jsonb_agg(jsonb_build_object(
        'rank', l.rank, 'id', l.id, 'name', l.name, 'staffId', l.staff_id, 'department', l.department,
        'score', l.score, 'timeMs', l.time_ms, 'tieBrokenByTime', l.tie_broken_by_time) order by l.rank), '[]')
      into v_board from public._leaderboard(g.id) l;
    end if;
    return v_base || jsonb_build_object('players', v_players, 'answered', v_answered, 'stats', v_stats, 'leaderboard', v_board);
  end if;

  if p_player_id is not null then
    select * into r from public.registrations where id = p_player_id and game_id = g.id;
    if not found then return v_base || jsonb_build_object('me', null); end if;
    if v_show then select * into a from public.answers where player_id = r.id and q_index = g.q_index; end if;
    v_me := jsonb_build_object('name', r.name, 'answered', a.player_id is not null);
    if g.phase = 'reveal' then
      v_me := v_me || jsonb_build_object('answer', a.answer, 'correct', coalesce(a.correct, false), 'ms', a.ms,
        'score', (select count(*) from public.answers where player_id = r.id and correct));
    end if;
    if g.phase = 'finished' then
      select * into v_mine from public._leaderboard(g.id) l where l.id = r.id;
      v_me := v_me || jsonb_build_object('rank', v_mine.rank, 'score', v_mine.score, 'timeMs', v_mine.time_ms,
        'of', (select count(*) from public.registrations where game_id = g.id));
      select coalesce(jsonb_agg(jsonb_build_object('rank', l.rank, 'id', l.id, 'name', l.name, 'score', l.score, 'timeMs', l.time_ms) order by l.rank), '[]')
        into v_board from public._leaderboard(g.id) l where l.rank <= 3;
      return v_base || jsonb_build_object('me', v_me, 'leaderboard', v_board);
    end if;
    return v_base || jsonb_build_object('me', v_me);
  end if;

  return v_base;
end $$;

-- Only these RPCs are callable from the app (they check host/player tokens themselves).
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.create_game(text), public.pin_required(), public.join_game(text, text, text, text),
  public.submit_answer(text, uuid, text, int, boolean), public.host_control(text, text, text),
  public.game_state(text, text, uuid) to anon, authenticated;

-- Results per game, for admins in the dashboard / SQL editor.
create view public.game_results with (security_invoker = true) as
  select g.code as game_code, g.created_at as game_created_at, l.*
  from public.games g cross join lateral public._leaderboard(g.id) l;
revoke all on public.game_results from anon, authenticated;
