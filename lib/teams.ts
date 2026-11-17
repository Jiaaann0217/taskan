// チームについてのデータを取ってくる関数（サーバー側で使う）
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Team } from "@/lib/types";

// ★本人が書く：getMyTeams
// 目的：ログイン中の人が入っているチームの一覧を返す（アーカイブ済みは除く）
// 入力：なし（「誰か」は Cookie から分かる）
// 出力：Team の配列（Promise<Team[]> は「あとで Team[] が届く」という意味）
//
// 「自分のチームだけ」に絞る条件は書かなくてよい。
// teams 表のルール（members read team）が門番 is_team_member を呼んで、自動で絞ってくれる。
export async function getMyTeams(): Promise<Team[]> {
  //Supabase に問い合わせる道具を作る
  const supabase = await createSupabaseServerClient();
  
  // TODO ②：teams 表から、アーカイブしていないチームを取ってくる
  //   形：const { data, error } = await 道具.from("表の名前").select("*").is("列の名前", 値);
  //   参考：app/page.tsx の 13〜20行目（tasks 表から取ってきている）
  //   ヒント：アーカイブしていない ＝ archived_at が空（null）
  const {data , error } = await supabase
    .from("teams")
    .select("*")
    .is("archived_at",null);
  // ここは AI が書いた：失敗したら、エラーを投げて画面にエラーを出す
  if (error) {
    throw new Error(`チームの一覧を取れませんでした：${error.message}`);
  }

  // TODO ③：取ってきたデータを返す（return を使う）
  return data;
}
