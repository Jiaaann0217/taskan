-- Taskan「サーバープログラミング演習」チームに、ロードマップ（段階）とタスクを入れる
-- 元：保管庫 サーバープログラミング演習/スケジュール.md（要件定義書 第1.2版の締め切り）と GitHub の Issue・PR（11/21 時点）
-- 二重に入らないよう、このチームに段階がすでにあれば止める
do $$
declare
  t uuid := 'ea2b42ff-bbbf-438b-bd67-1c7ec5cf957e';
  m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid; m6 uuid; m7 uuid; m8 uuid;
begin
  if exists (select 1 from public.milestones where team_id = t) then
    raise exception 'このチームにはもう段階があります。重ならないよう止めました';
  end if;

  update public.teams set
    goal = '1/12 の発表で「登録 → 旅行を作る → AI 提案 → 採用 → しおり」をデモする',
    goal_date = '2027-01-12',
    statuses = array['未着手', '作業中', 'PR 確認中', '完了'],
    repo_url = 'https://github.com/Jiaaann0217/tripper'
  where id = t;
  update public.tasks set status = 'PR 確認中' where team_id = t and status = '確認待ち';

  insert into public.milestones (team_id, name, position, start_date, due_date, description)
  values (t, '土台づくり', 0, '2026-11-09', '2026-11-15',
    '全員が同じ環境で動かせて、Git で合流できる') returning id into m1;
  insert into public.milestones (team_id, name, position, start_date, due_date, description)
  values (t, 'ログインを1本通す', 1, '2026-11-16', '2026-11-22',
    '登録・ログインを画面から DB まで本物でつなぐ。' || chr(10) || '11/22 に通らなければ、ほかを止めて先に直す') returning id into m2;
  insert into public.milestones (team_id, name, position, start_date, due_date, description)
  values (t, '単体で動く', 2, '2026-11-23', '2026-11-29',
    '各自が「必須」の担当画面・担当 API を1人で動かせる（つなぐのは次）') returning id into m3;
  insert into public.milestones (team_id, name, position, start_date, due_date, description)
  values (t, 'つなぐ', 3, '2026-11-30', '2026-12-06',
    '旅行作成 → 一覧 → 詳細を本物の API でつなぐ。' || chr(10) || '遅れていたら担当を入れ替えてでも助ける') returning id into m4;
  insert into public.milestones (team_id, name, position, start_date, due_date, description)
  values (t, '必須を通しで動かす', 4, '2026-12-07', '2026-12-13',
    'AI 提案 → 採用 → しおり → 予定の編集までつなぐ。' || chr(10) || '12/13 に動かなければ必須だけに絞る') returning id into m5;
  insert into public.milestones (team_id, name, position, start_date, due_date, description)
  values (t, '実装終了', 5, '2026-12-14', '2026-12-15',
    '必須のバグ修正だけ。12/15 に main で動く状態にする') returning id into m6;
  insert into public.milestones (team_id, name, position, start_date, due_date, description)
  values (t, 'テスト・修正', 6, '2026-12-16', '2026-12-22',
    'テスト、バグ修正、リファクタリング。' || chr(10) || '必須が固まっていれば「あると良い」（地図・再計画）へ') returning id into m7;
  insert into public.milestones (team_id, name, position, start_date, due_date, description)
  values (t, '発表準備', 7, '2027-01-06', '2027-01-11',
    'マニュアル・スライド・テスト結果をそろえ、デモを本番の手順で2回通す。12/23〜1/4 は原則休み') returning id into m8;

  -- 今あるタスク（ログイン画面）を段階2に入れる
  update public.tasks set milestone_id = m2 where team_id = t and milestone_id is null and title = 'ログイン画面';

  insert into public.tasks (team_id, milestone_id, title, done_criteria, status, deadline) values
    -- 1 土台づくり
    (t, m1, '【全員】環境構築と Git の練習', '全員が手元で front・back を起動でき、PR を1回出した', '完了', '2026-11-15'),
    (t, m1, '【フロントA・バックA】雛形を main に入れる', 'PR #1〜#3 がマージ済み', '完了', '2026-11-15'),
    -- 2 ログインを1本通す
    (t, m2, '【PM】認証 API の取り決めを docs/api.md に書く', 'PR #14 マージ（Issue #7）', '完了', '2026-11-20'),
    (t, m2, '【バックA】認証 API（register / login / logout / me）', 'PR #24 がマージされ、curl で登録→ログイン→me が通る（Issue #5）', 'PR 確認中', '2026-11-22'),
    (t, m2, '【フロントA】CSRF ヘッダーを付ける', 'PR #13 マージ（Issue #6）', 'PR 確認中', '2026-11-22'),
    (t, m2, '【フロントA】登録確認ダイアログ・見た目を設計図に合わせる', 'PR #15・#16・#18 マージ', 'PR 確認中', '2026-11-22'),
    (t, m2, '【フロントB】旅行計画まわりの UI を PR で出す', 'PR #17・#19 マージ（Issue #10）', 'PR 確認中', '2026-11-22'),
    (t, m2, '【バックB】提案まわりの Entity 4つ', 'Issue #8 を閉じる（PR #11 で入っていれば確認して閉じるだけ）', '作業中', '2026-11-22'),
    (t, m2, '【バックB】Gemini を単体で呼ぶ', 'PR #23 マージ（Issue #9）', 'PR 確認中', '2026-11-22'),
    (t, m2, '【全員】ログインを画面から DB まで通す', 'main で 登録 → ログイン → ホームが表示される（チェックポイント 11/22）', '未着手', '2026-11-22'),
    -- 3 単体で動く
    (t, m3, '【バックA】旅行の一覧・詳細・ホーム・削除 API', 'Issue #20 の API がテスト付きでマージ', '未着手', '2026-11-29'),
    (t, m3, '【フロントA】ホーム・旅行一覧・旅行作成を api.md の形に合わせる', 'モックのまま api.md と同じ形でデータが流れる', '未着手', '2026-11-29'),
    (t, m3, '【フロントB】旅行詳細（しおり）・予定編集を単体で動かす', 'モックで Day 切替・予定の追加と編集ができる', '未着手', '2026-11-29'),
    (t, m3, '【バックB】初回 AI 提案の API を Gemini で返す', '旅行 ID を渡すと提案が返り、DB に保存される', '未着手', '2026-11-29'),
    -- 4 つなぐ
    (t, m4, '【フロントA＋バックA】旅行作成 → 一覧 → 詳細を本物の API でつなぐ', 'ログインした人が作った旅行が一覧と詳細に出る', '未着手', '2026-12-06'),
    (t, m4, '【バックA】予定の一括保存・replaceFrom・メモ', 'Issue #21 の API がテスト付きでマージ', '未着手', '2026-12-06'),
    (t, m4, '【フロントA＋バックB】初回 AI 提案画面を API につなぐ', '旅行を作ると本物の提案が画面に出る', '未着手', '2026-12-06'),
    -- 5 必須を通しで動かす
    (t, m5, '【フロントA＋バックB】提案の採用 → しおりに反映', '採用した提案がしおりの予定になる', '未着手', '2026-12-13'),
    (t, m5, '【フロントB＋バックA】予定の編集を本物の API でつなぐ', 'しおりで予定を直すと保存され、開き直しても残る', '未着手', '2026-12-13'),
    (t, m5, '【全員】デモの流れを通しで動かす', '登録 → 旅行を作る → AI 提案 → 採用 → しおり が1回で通る（チェックポイント 12/13）', '未着手', '2026-12-13'),
    -- 6 実装終了
    (t, m6, '【全員】必須のバグ修正だけをして main を固める', '12/15 に main を取ってきて、デモの流れが動く', '未着手', '2026-12-15'),
    -- 7 テスト・修正
    (t, m7, '【全員】テスト・バグ修正・リファクタリング', '見つけた不具合が Issue になり、必須の不具合が0件', '未着手', '2026-12-22'),
    (t, m7, '【バックA】テスト結果のまとめ', 'テストの一覧と結果を docs/ に置く', '未着手', '2026-12-22'),
    (t, m7, '【フロントB＋バックB】（あると良い）地図表示・地名検索', 'しおりの予定が地図に出る。間に合わなければ発表前まで', '未着手', '2027-01-11'),
    (t, m7, '【フロントB＋バックB】（あると良い）旅行中の再計画', '再計画の提案を採用できる。間に合わなければ削る', '未着手', '2027-01-11'),
    -- 8 発表準備
    (t, m8, '【フロントA】ユーザー操作マニュアル', '初版を 1/8 までに共有', '未着手', '2027-01-11'),
    (t, m8, '【フロントB】発表スライド', '初版を 1/8 までに共有', '未着手', '2027-01-11'),
    (t, m8, '【バックB】デモのリハーサル', '本番の手順でデモを2回通す', '未着手', '2027-01-11');
end $$;

-- 確認用
select m.position + 1 as 段階, m.name, m.start_date, m.due_date, count(k.id) as タスク数
from public.milestones m left join public.tasks k on k.milestone_id = m.id
where m.team_id = 'ea2b42ff-bbbf-438b-bd67-1c7ec5cf957e'
group by m.id order by m.position;
