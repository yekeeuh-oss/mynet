const words = [
  "窗光",
  "留白",
  "潮汐",
  "墨痕",
  "慢火",
  "回声",
  "新芽",
  "夜航",
  "纸页",
  "薄雾",
  "金线",
  "折光",
  "暖砂",
  "远山",
  "未名",
  "静水深流",
];

const colors = [
  { name: "墨绿", hex: "#1E6B48" },
  { name: "暖沙", hex: "#C4A484" },
  { name: "米纸", hex: "#E7D7C1" },
  { name: "栗壳", hex: "#8F6B4A" },
  { name: "夜蓝", hex: "#3D6B8A" },
  { name: "陶土", hex: "#D0895C" },
  { name: "月白", hex: "#F3EDE4" },
  { name: "苔色", hex: "#6E8B74" },
];

const lines = [
  "把没写完的句子留到明天，它会自己长出下半句。",
  "慢下来的时候，光才会停在纸页上。",
  "灵感不是追上的，是你坐得够久，它走进来。",
  "今天适合把一个旧念头，写成一句新的话。",
  "空白不是缺失，是还没被打扰的位置。",
  "先记下温度，再决定要不要解释它。",
  "远处的山不必今天爬完，看见轮廓就够了。",
  "把喧闹调小一格，句子就会自己出现。",
];

export type DailyOracle = {
  key: string;
  word: string;
  colorName: string;
  color: string;
  line: string;
};

function hashText(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function oracleForDate(date = new Date()): DailyOracle {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const hash = hashText(key);
  const color = colors[hash % colors.length] ?? colors[0];
  return {
    key,
    word: words[(hash >>> 8) % words.length] ?? words[0],
    colorName: color.name,
    color: color.hex,
    line: lines[(hash >>> 16) % lines.length] ?? lines[0],
  };
}

export function paintOracleCard(oracle: DailyOracle) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#FAF9F6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = oracle.color;
  context.fillRect(0, 0, canvas.width, 28);
  context.fillStyle = "#1E6B48";
  context.font = "28px sans-serif";
  context.fillText("纸间 · 今日灵感", 72, 140);
  context.fillStyle = "#241f1b";
  context.font = "92px serif";
  context.fillText(oracle.word, 72, 320);
  context.fillStyle = oracle.color;
  context.fillRect(72, 380, 84, 84);
  context.fillStyle = "#5c564e";
  context.font = "32px sans-serif";
  context.fillText(`创作幸运色  ${oracle.colorName}`, 180, 432);
  context.fillStyle = "#241f1b";
  context.font = "40px serif";
  const wordsInLine = oracle.line.split("");
  let line = "";
  let y = 620;
  for (const character of wordsInLine) {
    const next = line + character;
    if (context.measureText(next).width > 740) {
      context.fillText(line, 72, y);
      line = character;
      y += 64;
    } else {
      line = next;
    }
  }
  if (line) context.fillText(line, 72, y);
  context.fillStyle = "#8a837b";
  context.font = "24px sans-serif";
  context.fillText(oracle.key, 72, 1100);
  return canvas;
}
