// The programme's Discord server, worked by the site's own bot.
//
// A linked account can be put in the server and given its role without
// anyone doing it by hand: the tester role when the account is on the
// Pre-Alpha list, the advisor role when it is on the programme. Needs a
// Discord application with a bot in the server (Manage Roles, with the
// bot's own role above the ones it hands out) and four variables on the
// host; without them every call here is a no-op and the roles stay a
// manual job, as before.
//
//   DISCORD_BOT_TOKEN        the bot's token
//   DISCORD_GUILD_ID         the server
//   DISCORD_TESTER_ROLE_ID   the tester role
//   DISCORD_ADVISOR_ROLE_ID  the advisor role (optional)
//
// Server only: the token never reaches a client bundle.

const API = "https://discord.com/api/v10";
const USER_AGENT = "TheWatchRoom (https://thewtchroom.co.uk, 1.0)";

export type DiscordRoleKey = "tester" | "advisor";

export type DiscordBotConfig = { token: string; guildId: string; roles: Partial<Record<DiscordRoleKey, string>> };

export function discordBotConfig(): DiscordBotConfig | null {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  if (!token || !guildId) return null;
  const roles: DiscordBotConfig["roles"] = {};
  const tester = process.env.DISCORD_TESTER_ROLE_ID?.trim();
  const advisor = process.env.DISCORD_ADVISOR_ROLE_ID?.trim();
  if (tester) roles.tester = tester;
  if (advisor) roles.advisor = advisor;
  return { token, guildId, roles };
}

export function discordBotConfigured(): boolean {
  return discordBotConfig() !== null;
}

export type GrantResult = {
  /** The roles now on the member. */
  granted: DiscordRoleKey[];
  /** The account was put in the server on this call. */
  joined: boolean;
  /** Why anything was not done, in plain words. */
  reason?: string;
};

async function call(cfg: DiscordBotConfig, method: string, path: string, body?: unknown): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    return await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bot ${cfg.token}`, "User-Agent": USER_AGENT, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Put the roles on a member. A Discord user who is not in the server
 *  yet is added to it when an OAuth access token with the guilds.join
 *  scope is to hand — the token the sign-in or the link just produced —
 *  and gets the roles on the way in. */
export async function grantDiscordRoles(discordUserId: string, keys: DiscordRoleKey[], accessToken?: string | null): Promise<GrantResult> {
  const cfg = discordBotConfig();
  if (!cfg) return { granted: [], joined: false, reason: "the Discord bot is not configured on this site" };
  const wanted = keys.filter((k) => cfg.roles[k]);
  if (wanted.length === 0) return { granted: [], joined: false, reason: "no role id is configured for that role" };
  const roleIds = wanted.map((k) => cfg.roles[k]!);
  const granted: DiscordRoleKey[] = [];
  let joined = false;
  const addRole = async (k: DiscordRoleKey): Promise<"ok" | "not_member" | "forbidden" | "error"> => {
    const res = await call(cfg, "PUT", `/guilds/${cfg.guildId}/members/${discordUserId}/roles/${cfg.roles[k]}`);
    if (res.status === 204) return "ok";
    if (res.status === 404) return "not_member";
    if (res.status === 403) return "forbidden";
    return "error";
  };
  try {
    for (const k of wanted) {
      let r = await addRole(k);
      if (r === "not_member" && accessToken && !joined) {
        // Not in the server: bring them in with the roles on.
        const join = await call(cfg, "PUT", `/guilds/${cfg.guildId}/members/${discordUserId}`, { access_token: accessToken, roles: roleIds });
        if (join.status === 201) { joined = true; granted.push(...wanted); return { granted, joined }; }
        if (join.status === 204) { joined = false; r = await addRole(k); }
        else if (join.status === 403) return { granted, joined, reason: "the bot may not add members to the server (it needs Create Invite, and the sign-in needs the guilds.join scope)" };
        else return { granted, joined, reason: `Discord refused to add the member (${join.status})` };
      }
      if (r === "ok") granted.push(k);
      else if (r === "not_member") return { granted, joined, reason: "the Discord account is not in the server yet — join it from the invite link, then connect again" };
      else if (r === "forbidden") return { granted, joined, reason: "the bot may not manage that role — it needs Manage Roles and its own role above the one it hands out" };
      else return { granted, joined, reason: "Discord did not accept the role" };
    }
    return { granted, joined };
  } catch (e) {
    return { granted, joined, reason: e instanceof Error && e.name === "AbortError" ? "Discord did not answer in time" : "Discord could not be reached" };
  }
}
