// Use ONLY a disposable local database. Never runs against a remote host.
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { readFile } from "node:fs/promises";
const url = process.env.TEST_DATABASE_URL;
test(
  "database invariants, RLS and concurrent transactions",
  { skip: !url },
  async () => {
    const parsed = new URL(url);
    assert.ok(
      ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname),
      "Tests require localhost",
    );
    const owner = new pg.Client({ connectionString: url });
    await owner.connect();
    const ids = {
      a: "20000000-0000-0000-0000-000000000001",
      b: "20000000-0000-0000-0000-000000000002",
      admin: "20000000-0000-0000-0000-000000000003",
      trainer: "10000000-0000-0000-0000-000000000001",
      other: "10000000-0000-0000-0000-000000000002",
    };
    async function actor(id) {
      const c = new pg.Client({ connectionString: url });
      await c.connect();
      await c.query("set role authenticated");
      await c.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      return c;
    }
    const connections = [];
    try {
      await owner.query(
        "create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;",
      );
      await owner.query(
        await readFile(
          new URL(
            "../supabase/migrations/202611130001_studio.sql",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      await owner.query(
        await readFile(
          new URL("../supabase/seed.sql", import.meta.url),
          "utf8",
        ),
      );
      for (const [name, id] of Object.entries(ids).filter(([k]) =>
        ["a", "b", "admin"].includes(k),
      ))
        await owner.query(
          "insert into auth.users values($1,jsonb_build_object('full_name',$2::text,'role','admin'))",
          [id, name + " test"],
        );
      assert.equal(
        (
          await owner.query("select role from public.profiles where id=$1", [
            ids.a,
          ])
        ).rows[0].role,
        "client",
      );
      await owner.query("update public.profiles set role='admin' where id=$1", [
        ids.admin,
      ]);
      const a = await actor(ids.a),
        b = await actor(ids.b),
        admin = await actor(ids.admin);
      connections.push(a, b, admin);
      const {
        rows: [{ s }],
      } = await owner.query(
        "select ((current_date + ((8-extract(isodow from current_date)::int)%7)+7)+time '08:00') at time zone 'Europe/Belgrade' as s",
      );
      const book = (c, t = ids.trainer, start = s) =>
        c.query("select public.book_appointment($1,$2) id", [t, start]);
      const results = await Promise.allSettled([book(a), book(b)]);
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(results.filter((r) => r.status === "rejected").length, 1);
      const winner = results[0].status === "fulfilled" ? a : b,
        loser = winner === a ? b : a;
      assert.equal(
        (await loser.query("select * from public.appointments")).rowCount,
        0,
        "other client sees no booking",
      );
      await assert.rejects(
        loser.query(
          "update public.profiles set role='admin' where id=auth.uid()",
        ),
      );
      await assert.rejects(
        book(winner, ids.other),
        "same client cannot overlap across trainers",
      );
      await book(loser, ids.other); // independent trainer and client can work simultaneously
      await book(winner, ids.trainer, new Date(s.getTime() + 3600000)); // adjacent
      await assert.rejects(
        admin.query(
          "insert into public.time_off(trainer_id,starts_at,ends_at) values($1,$2,$2::timestamptz+interval '1 hour')",
          [ids.trainer, s],
        ),
      );
      await assert.rejects(
        admin.query("delete from public.working_hours where trainer_id=$1", [
          ids.trainer,
        ]),
      );
      const own = (
        await winner.query(
          "select id from public.appointments where starts_at=$1",
          [s],
        )
      ).rows[0];
      assert.equal(
        (
          await loser.query(
            "update public.appointments set status='cancelled' where id=$1",
            [own.id],
          )
        ).rowCount,
        0,
      );
      await winner.query(
        "update public.appointments set status='cancelled' where id=$1",
        [own.id],
      );
      // Same client still owns a different trainer at 08:00, use admin guest to show released slot.
      await admin.query(
        "select public.book_appointment($1,$2,null,'Gost',null)",
        [ids.trainer, s],
      );
      await assert.rejects(book(a, ids.trainer, new Date("2000-01-01T00:00Z")));
      await assert.rejects(
        book(a, ids.trainer, new Date(s.getTime() + 4 * 3600000)),
        "lunch break",
      );
      // Concurrent time off vs booking: exactly one change may commit.
      const next = new Date(s.getTime() + 2 * 3600000);
      const race = await Promise.allSettled([
        book(a, ids.trainer, next),
        admin.query(
          "insert into public.time_off(trainer_id,starts_at,ends_at) values($1,$2,$2::timestamptz+interval '1 hour')",
          [ids.trainer, next],
        ),
      ]);
      assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
      // Reverse race order: a committed absence must invalidate a waiting booking.
      const blockedStart = new Date(s.getTime() + 3 * 3600000);
      await admin.query("begin");
      await admin.query(
        "insert into public.time_off(trainer_id,starts_at,ends_at) values($1,$2,$2::timestamptz+interval '1 hour')",
        [ids.trainer, blockedStart],
      );
      const waiting = book(b, ids.trainer, blockedStart);
      const expectedFailure = assert.rejects(waiting);
      await admin.query("commit");
      await expectedFailure;
      // Trainer authorization is limited to her appointments and their clients.
      const trainerUser = "20000000-0000-0000-0000-000000000004";
      await owner.query(
        'insert into auth.users values($1,\'{"full_name":"Test Trainer"}\')',
        [trainerUser],
      );
      await owner.query(
        "update public.profiles set role='trainer' where id=$1",
        [trainerUser],
      );
      await admin.query(
        "update public.trainers set profile_id=$1 where id=$2",
        [trainerUser, ids.trainer],
      );
      const trainerActor = await actor(trainerUser);
      connections.push(trainerActor);
      assert.ok(
        (
          await trainerActor.query("select * from public.appointments")
        ).rows.every((r) => r.trainer_id === ids.trainer),
      );
      assert.ok(
        (await trainerActor.query("select * from public.appointments"))
          .rowCount > 0,
      );
      assert.equal(
        (
          await trainerActor.query(
            "delete from public.working_hours where trainer_id=$1",
            [ids.trainer],
          )
        ).rowCount,
        0,
      );
      await assert.rejects(
        admin.query(
          "update public.appointments set status='completed' where id=(select id from public.appointments where status='booked' limit 1)",
        ),
      );
      // PostgreSQL itself validates both DST transition days.
      await admin.query(
        "insert into public.working_hours(trainer_id,weekday,start_time,end_time) values($1,7,'00:00','05:00')",
        [ids.other],
      );
      for (const [day, count] of [
        ["2027-03-28", 4],
        ["2027-10-31", 6],
      ]) {
        const generated = await owner.query(
          "select generate_series(($1::date+time '00:00') at time zone 'Europe/Belgrade',(($1::date+time '05:00') at time zone 'Europe/Belgrade')-interval '1 hour',interval '1 hour') s",
          [day],
        );
        assert.equal(generated.rowCount, count);
        for (const row of generated.rows)
          assert.equal(
            (
              await owner.query("select public.slot_valid($1,$2) valid", [
                ids.other,
                row.s,
              ])
            ).rows[0].valid,
            true,
          );
      }
      const anon = new pg.Client({ connectionString: url });
      await anon.connect();
      connections.push(anon);
      await anon.query("set role anon");
      await assert.rejects(anon.query("select * from public.appointments"));
      const slots = await anon.query(
        "select * from public.available_slots($1,($2::timestamptz at time zone 'Europe/Belgrade')::date)",
        [ids.trainer, s],
      );
      assert.deepEqual(
        slots.fields.map((f) => f.name),
        ["starts_at"],
      );
    } finally {
      await Promise.all(connections.map((c) => c.end()));
      await owner.end();
    }
  },
);
