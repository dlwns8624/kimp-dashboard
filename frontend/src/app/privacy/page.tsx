import Link from "next/link";

const PRIVACY_TITLE_B64 = "6rCc7J247KCV67O07LKY66as67Cp7Lmo";
const PRIVACY_SUB_B64 =
  "7JWE656YIOuCtOyaqeydgCDrspXsoIEg66y47ISc66W8IOuMgOyytO2VmOyngCDslYrsnLzrqbAsIOyEnOu5hOyKpCDsnbTsmqnsnYQg7JyE7ZWcIOyViOuCtCDrqqnsoIHsnLzroZwg7KCc6rO165Cp64uI64ukLg==";
const PRIVACY_TEXT_B64 =
  "6rCc7J247KCV67O0IOyymOumrOuwqey5qArquYDtlITrpqzripQg7J207Jqp7J6Q7J2YIOqwnOyduOygleuztOulvCDspJHsmpTsi5ztlZjrqbAsIOygleuztO2GteyLoOunnSDsnbTsmqnstInsp4Qg67CPIOygleuztOuztO2YuOyXkCDqtIDtlZwg67KV66Wg7J2EIOykgOyImO2VmOqzoCDsnojsirXri4jri6QuIOq5gO2UhOumrOuKlCDqsJzsnbjsoJXrs7TsspjrpqzrsKnsuajsnYQg7Ya17ZWY7JesIOydtOyaqeyekOqwgCDsoJzqs7XtlZjripQg6rCc7J247KCV67O06rCAIOyWtOuWoO2VnCDsmqnrj4TsmYAg67Cp7Iud7Jy866GcIOydtOyaqeuQmOqzoCDsnojsnLzrqbAsIOqwnOyduOygleuztOuztO2YuOulvCDsnITtlbQg7Ja065ag7ZWcIOyhsOy5mOqwgCDst6jtlbTsp4Dqs6Ag7J6I64qU7KeAIOyVjOugpOuTnOumveuLiOuLpC4KCuyImOynke2VmOuKlCDqsJzsnbjsoJXrs7Qg7ZWt66qpCgotIOyImOynke2VreuqqTog6rWt6rCALCDslrjslrQsIOyCrOydtO2KuCDsnbTsmqkg6riw66GdLCDsoJHsho0gSVAsIFJlZmVyZXIsIENvb2tpZQotIOqwnOyduOygleuztCDsiJjsp5HrsKnrspU6IOybueyCrOydtO2KuCDtg5Dsg4ksIOy9mO2FkOy4oCDsnbTsmqksIOygnOyViMK366y47J2YCgrqsJzsnbjsoJXrs7TsnZgg7IiY7KeRIOuwjyDsnbTsmqnrqqnsoIEKCuq5gO2UhOumrOuKlCDsiJjsp5HtlZwg6rCc7J247KCV67O066W8IOyEnOu5hOyKpCDqsJzshKAg67CPIO2GteqzhCwg67aA7KCVIOydtOyaqSDrsKnsp4AsIOuvvOybkOyymOumrCwg6rOg7KeA7IKs7ZWtIOyghOuLrCwg66eI7LyA7YyFIOuwjyDqtJHqs6Drpbwg7JyE7ZW0IOyCrOyaqSDtlanri4jri6QuCgrqsJzsnbjsoJXrs7TsnZgg67O07JygIOuwjyDsnbTsmqnquLDqsIQKCuq5gO2UhOumrOuKlCDsnbTsmqnsnpAg7Ya16rOEIOu2hOyEnSDrsI8g7JWI7KCV7KCB7J24IOyEnOu5hOyKpCDsoJzqs7XsnYQg7JyE7ZWY7JesIOqwnOyduOygleuztOulvCDrs7TsnKDtlZjrqbAsIOydtOyaqeyekOydmCDsmpTssq3snbQg7J6I6rGw64KYIOydtOyaqeuqqeyggeydtCDri6zshLHrkJwg7ZuE7JeQ64qUIOyngOyytCDsl4bsnbQg7YyM6riw7ZWp64uI64ukLgoK6rCc7J247KCV67O07J2YIOygnOqztQoK6rmA7ZSE66as64qUIOydtOyaqeyekOydmCDqsJzsnbjsoJXrs7Trpbwg7JuQ7LmZ7KCB7Jy866GcIOyZuOu2gOyXkCDsoJzqs7XtlZjsp4Ag7JWK7Iq164uI64ukLiDri6Trp4wsIOyVhOuemOydmCDqsr3smrDripQg7JiI7Jm466Gc7ZWp64uI64ukLgotIOydtOyaqeyekOqwgCDsgqzsoITsl5Ag64+Z7J2Y7ZWcIOqyveyasAotIOuyleugueydmCDqt5zsoJXsl5Ag7J2Y6rGw7ZWY6rGw64KYLCDsiJjsgqwg66qp7KCB7Jy866GcIOuyleugueyXkCDsoXtlbTsp4Qg7KCI7LCo7JmAIOuwqeuyleyXkCDrlLDrnbwg7IiY7IKs6riw6rSA7J2YIOyalOq1rOqwgCDsnojripQg6rK97JqwCgrqsJzsnbjsoJXrs7TsspjrpqzrsKnsuajsnZgg67OA6rK97IKs7ZWtCgrqsJzsnbjsoJXrs7TsspjrpqzrsKnsuajsnYAg7IiY7Iuc66GcIOuzgOqyveuQoCDsiJgg7J6I7Jy866mwLCDrs4Dqsr0g7IucIOusuOyEnCDsg4Hri6jsl5Ag6riw7J6s65CcIOyLnO2WiSDsnbzsnpDrpbwg67OA6rK9IOydvOyekOuhnCDsl4XrjbDsnbTtirgg7ZWp64uI64ukLiDqsJzsnbjsoJXrs7TsspjrpqzrsKnsuajsnZgg66qo65OgIOuzgOqyvSDsgqztla3snYAg7JeF642w7J207Yq465CcIOyLnOygkOycvOuhnOu2gO2EsCDsponsi5wg7KCB7Jqp65CY66mwLCDsnbTsoITsl5Ag7J6R7ISx65CcIOqwnOyduOygleuztOyymOumrOuwqey5qOydhCDsoITssrTsoIHsnLzroZwg64yA7LK07ZWp64uI64ukLgoK6rCc7J247KCV67O07JeQIOq0gO2VnCDrr7zsm5DshJzruYTsiqQKCuq5gO2UhOumrOuKlCDqs6DqsJ3snZgg6rCc7J247KCV67O066W8IOuztO2YuO2VmOqzoCDqsJzsnbjsoJXrs7TsmYAg6rSA66Co7ZWcIOu2iOunjOydhCDsspjrpqztlZjquLAg7JyE7ZWY7JesIOyVhOuemOyZgCDqsJnsnbQg6rSA66CoIOu2gOyEnCDrsI8g6rCc7J247KCV67O06rSA66as7LGF7J6E7J6Q66W8IOyngOygle2VmOqzoCDsnojsirXri4jri6QuCgrqsJzsnbjsoJXrs7Qg67O07Zi4IOyxheyehOyekDog6rSA66as7J6QCuuLtOuLueyekCDsnbTrqZTsnbw6IGRsd25zMTg4OUBnbWFpbC5jb20KCuq3gO2VmOq7mOyEnOuKlCDquYDtlITrpqwg7ISc67mE7Iqk66W8IOydtOyaqe2VmOyLnOupsCDrsJzsg53tlZjripQg66qo65OgIOqwnOyduOygleuztOuztO2YuCDqtIDroKgg66+87JuQ7J2EIOqwnOyduOygleuztOq0gOumrOyxheyehOyekCDtmLnsnYAg64u064u567aA7ISc66GcIOyLoOqzoO2VmOyLpCDsiJgg7J6I7Iq164uI64ukLiDquYDtlITrpqzripQg7J207Jqp7J6Q65Ok7J2YIOyLoOqzoOyCrO2VreyXkCDrjIDtlbQg7Iug7IaN7ZWY6rKMIOy2qeu2hO2VnCDri7Xrs4DsnYQg65Oc66a0IOqyg+yeheuLiOuLpC4KCuKAlCDrs7gg67Cp7Lmo7J2AIDIwMjbrhYQgM+yblCAx7J28IOu2gO2EsCDsi5ztlonrkKnri4jri6Qu";

const BACK_B64 = "7ZmI7Jy866GcIOuPjOyVhOqwgOq4sA==";

function decode(b64: string) {
  return Buffer.from(b64, "base64").toString("utf-8");
}

export default function PrivacyPage() {
  const title = decode(PRIVACY_TITLE_B64);
  const sub = decode(PRIVACY_SUB_B64);
  const text = decode(PRIVACY_TEXT_B64);
  const back = decode(BACK_B64);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300">
      <div className="max-w-[1600px] mx-auto px-3 md:px-8 py-6 md:py-10">
        <div className="space-y-3">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h1>
          <p className="text-[11px] md:text-[12px] text-neutral-600">{sub}</p>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-6">
            <pre className="text-[11px] md:text-[12px] text-neutral-500 whitespace-pre-wrap leading-7">{text}</pre>
          </div>

          <div className="text-[11px] md:text-[12px] text-neutral-600">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 font-bold">
              {back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

