const notes = [
  {
    date: "09.28",
    place: "厨房",
    title: "一锅慢慢滚着的汤",
    body: "火开得很小。葱花最后才落下，像一句迟到、但刚好赶上的话。",
  },
  {
    date: "09.26",
    place: "路途",
    title: "末班车窗外的灯",
    body: "城市一格一格往后移。我把没说完的句子，留到了下一站。",
  },
  {
    date: "09.21",
    place: "窗台",
    title: "雨停之后",
    body: "空气里有土和叶子的味道。那一页几乎空白，却觉得已经写满了。",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C2825]">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-14 sm:px-10 sm:py-20">
        <header className="border-b border-[#2C2825]/10 pb-8">
          <p className="text-xs font-medium tracking-[0.32em] text-[#1E6B48]">
            PERSONAL JOURNAL
          </p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="font-serif text-5xl leading-none tracking-tight sm:text-6xl">
              纸间
            </h1>
            <p className="max-w-xs text-sm leading-7 text-[#5C564E]">
              一卷私人日记。把日子摊开，写成可以再读一遍的句子。
            </p>
          </div>
        </header>

        <main className="mt-10 flex flex-col gap-6">
          <article className="rounded-3xl bg-white px-7 py-8 shadow-[0_12px_40px_-18px_rgba(44,40,37,0.18)] sm:px-10 sm:py-11">
            <p className="text-xs font-medium tracking-[0.22em] text-[#1E6B48]">
              卷首 · 九月三十日
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-[2.75rem]">
              把光留在句子里
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#3F3A35]">
              今天的风很轻，像有人把窗页掀开了一道缝。我把早晨的茶、未回的信，和那一小段突然安静下来的时间，都折进这一页。日记不必盛大，它只要够真。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#compose"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#1E6B48] px-6 text-sm font-medium text-[#FAF9F6] shadow-[0_8px_20px_-10px_rgba(30,107,72,0.9)] transition-colors hover:bg-[#18583C]"
              >
                写下今天
              </a>
              <a
                href="#entries"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#1E6B48]/25 px-6 text-sm font-medium text-[#1E6B48] transition-colors hover:bg-[#1E6B48]/8"
              >
                翻阅旧页
              </a>
            </div>
          </article>

          <section id="entries" className="grid gap-5">
            {notes.map((note) => (
              <article
                key={note.title}
                className="flex flex-col rounded-2xl bg-white px-5 py-6 shadow-[0_10px_30px_-16px_rgba(44,40,37,0.2)]"
              >
                <p className="text-xs tracking-[0.16em] text-[#1E6B48]">
                  {note.date}
                  <span className="px-1.5 text-[#2C2825]/30">/</span>
                  {note.place}
                </p>
                <h3 className="mt-4 font-serif text-2xl leading-snug tracking-tight">
                  {note.title}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-[#5C564E]">
                  {note.body}
                </p>
              </article>
            ))}
          </section>

          <section
            id="compose"
            className="rounded-3xl border border-[#2C2825]/8 bg-white/70 px-7 py-8 shadow-[0_10px_30px_-18px_rgba(44,40,37,0.16)] sm:px-10"
          >
            <p className="text-xs font-medium tracking-[0.22em] text-[#1E6B48]">
              今日留白
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-snug">
              还没写下的那一行
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-[#3F3A35]">
              可以从天气开始，也可以从一句没来得及说出口的话开始。纸页一直在这里，不催你。
            </p>
            <a
              href="#compose"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#1E6B48] px-6 text-sm font-medium text-[#FAF9F6] shadow-[0_8px_20px_-10px_rgba(30,107,72,0.9)] transition-colors hover:bg-[#18583C]"
            >
              开始记录
            </a>
          </section>
        </main>

        <footer className="mt-12 flex items-center justify-between border-t border-[#2C2825]/10 pt-6 text-xs tracking-[0.18em] text-[#5C564E]">
          <span>纸间</span>
          <span>VOL. 09</span>
        </footer>
      </div>
    </div>
  );
}
