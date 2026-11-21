// チームの画面で毎回使う「チーム・メンバー・自分の役割」をまとめて読む（サーバー側）
import { notFound } from "next/navigation";
import { createSupabaseServerClient, getMyClaims } from "@/lib/supabase-server";
import type { Team, TeamMember } from "@/lib/types";

export async function loadTeam(teamId: string) {
  const supabase = await createSupabaseServerClient();
  // 3つを同時に問い合わせる（順番に待たない）
  const [{ id: myId }, teamRes, membersRes] = await Promise.all([
    getMyClaims(),
    supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
    supabase.from("team_members").select("*").eq("team_id", teamId).order("joined_at"),
  ]);

  // 読み出し自体の失敗（通信・認証のエラー）は「見つかりません」にしない → error.tsx の画面へ
  if (teamRes.error) throw new Error(`チームを読めませんでした：${teamRes.error.message}`);
  // メンバーでなければ、門番のおかげで team は空 → 「見つかりません」
  const team = teamRes.data as Team | null;
  if (!team) notFound();
  const members = (membersRes.data ?? []) as TeamMember[];
  const myRole = members.find((m) => m.user_id === myId)?.role;

  return {
    supabase,
    team,
    members,
    myId,
    myRole,
    canEdit: myRole === "owner" || myRole === "member", // 書き込めるか（AI は読むだけ）
    isOwner: myRole === "owner",
  };
}
