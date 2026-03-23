import Link from "next/link";

const TERMS_TITLE_B64 = "7ISc67mE7IqkIOydtOyaqeyVveq0gA==";
const TERMS_SUB_B64 =
  "7JWE656YIOuCtOyaqeydgCDrspXsoIEg66y47ISc66W8IOuMgOyytO2VmOyngCDslYrsnLzrqbAsIOyEnOu5hOyKpCDsnbTsmqnsnYQg7JyE7ZWcIOyViOuCtCDrqqnsoIHsnLzroZwg7KCc6rO165Cp64uI64ukLg==";
const TERMS_TEXT_B64 =
  "6rmA7ZSE66asIOuCtCDshJzruYTsiqTrpbwg7J207Jqp7ZWY64qUIOqyveyasCDrs7gg7J207Jqp7JW96rSA7JeQIOuPmeydmO2VmOuKlCDqsoPsnLzroZwg6rCE7KO87ZWp64uI64ukLgoK7J207Jqp7J6Q64qUIOq5gO2UhOumrOqwgCDsnbTsmqnsnpAg7Iud67OEIOuwjyDrjbDsnbTthLAg67aE7ISd7J2EIOychO2VmOyXrCDsv6DtgqTrpbwg7IKs7Jqp7ZWo7JeQIOuPmeydmO2VqeuLiOuLpC4g67iM65287Jqw7KCAIOyEpOygleydhCDthrXtlZjsl6wg7L+g7YKkIOyCrOyaqeydhCDqsbDrtoDtlaAg7IiYIOyeiOyngOunjCwg7J20IOqyveyasCDshJzruYTsiqQg7J207Jqp7J20IOygnO2VnOuQoCDsiJgg7J6I7Iq164uI64ukLgoK6rmA7ZSE66as64qUIOyjvOyalCDqsbDrnpjshozsnZgg7JWU7Zi47ZmU7Y+QIOyLnOyEuCDrsI8g7Yis7J6Q7JeQIOywuOqzoOqwgCDrkKAg7IiYIOyeiOuKlCDrjbDsnbTthLDrpbwg67O06riwIOyJveqyjCDqsIDqs7XtlZjsl6wg7KCc6rO17ZWY64qUIOyEnOu5hOyKpOyeheuLiOuLpC4KCuq5gO2UhOumrOyXkOyEnCDsoJzqs7XtlZjripQg642w7J207YSw64qUIOu2gOygle2Zle2VoCDsiJgg7J6I7Jy866mwLCDtiKzsnpDsl5Ag64yA7ZWcIOuqqOuToCDssYXsnoTsnYAg67O47J247JeQ6rKMIOyeiOyKteuLiOuLpC4KCu2VtOuLuSDrjbDsnbTthLDrpbwg7Zmc7Jqp7ZWY7JesIOuwnOyDne2VoCDsiJgg7J6I64qUIOuqqOuToCDrrLjsoJzsl5Ag64yA7ZWcIOyxheyehOydhCDsp4Dsp4Ag7JWK7Iq164uI64ukLiDrmJDtlZwg6reA7ZWY7J2YIOuyleyggSDqtIDtlaDqtozsnbQg7J6I64qUIOq1reqwgCDrgrTsl5DshJwg7ZeI7Jqp65CY64qUIOyEnOu5hOyKpOunjCDsnbTsmqntlbQg7KO87Iuc6riwIOuwlOuejeuLiOuLpC4KCuydtOyaqeyekOydmCDsgqzsnbTtirgg7J207JqpIOq4sOuhneydgCDshJzruYTsiqQg6rCc7ISg7J2EIOychO2VtCDsgqzsmqnrkKAg7IiYIOyeiOycvOupsCwg64+Z7J2YIOyXhuydtCDsoJwz7J6Q7JeQ6rKMIOygnOqzteuQmOyngCDslYrsirXri4jri6QuCgrquYDtlITrpqzripQg7ISc67mE7IqkIOuCtCDsvZjthZDsuKAsIOuwsOuEiCwg66eB7YGsIO2YleyLneydmCDqtJHqs6Drpbwg7Y+s7ZWo7ZWY6rOgIOyeiOycvOupsCwg7J207JeQIOuUsOuluCDsnbzsoJXslaHsnZgg7IiY7IiY66OM66W8IOygnOqzteuwm+yKteuLiOuLpC4KCuydtOyaqeyekOuKlCDri7nsgqzsnZgg7ISc67mE7Iqk7JeQIO2UvO2VtOulvCDsnoXtnpAg7IiYIOyeiOuKlCDtlonsnITrpbwg7ZW07ISc64qUIOyViCDrkKnri4jri6QuIOuLueyCrOydmCDshJzruYTsiqTsl5Ag7ZS87ZW066W8IOyehe2ejOuLpOqzoCDtjJDri6jrkJjrqbQg7J207Jqp7J2EIOygnO2VnO2VmOqxsOuCmCDrspXsoIHsnbgg7KGw7LmY66W8IOy3qO2VoCDsiJgg7J6I7Iq164uI64ukLgoK6rmA7ZSE66as7JmAIOydtOyaqeyekCDqsIQg67Cc7IOd7ZWcIOyEnOu5hOyKpCDsnbTsmqnsl5Ag6rSA7ZWcIOu2hOyfgeyXkCDrjIDtlZjsl6zripQg64yA7ZWc66+86rWtIOuyleydhCDsoIHsmqntlZjrqbAsIOuzuCDrtoTsn4HsnLzroZwg7J247ZWcIOyGjOuKlCDrr7zsgqzshozshqHrspXsg4HsnZgg6rSA7ZWg7J2EIOqwgOyngOuKlCDrjIDtlZzrr7zqta3snZgg67KV7JuQ7JeQIOygnOq4sO2VqeuLiOuLpC4KCuKAlCDrs7gg7JW96rSA7J2AIDIwMjbrhYQgM+yblCAx7J28IOu2gO2EsCDsi5ztlonrkKnri4jri6Qu";

const BACK_B64 = "7ZmI7Jy866GcIOuPjOyVhOqwgOq4sA==";

function decode(b64: string) {
  return Buffer.from(b64, "base64").toString("utf-8");
}

export default function TermsPage() {
  const title = decode(TERMS_TITLE_B64);
  const sub = decode(TERMS_SUB_B64);
  const text = decode(TERMS_TEXT_B64);
  const back = decode(BACK_B64);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300">
      <div className="max-w-[1600px] mx-auto px-3 md:px-8 py-6 md:py-10">
        <div className="space-y-3">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-sm md:text-[12px] text-neutral-600">{sub}</p>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-6">
            <pre className="text-sm md:text-[12px] text-neutral-500 whitespace-pre-wrap leading-7">{text}</pre>
          </div>

          <div className="text-sm md:text-[12px] text-neutral-600">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 font-bold">
              {back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

