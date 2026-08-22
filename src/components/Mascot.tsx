const CHEER_MESSAGES = [
  "やったね!お疲れさま!",
  "その調子です!",
  "順調ですね、素晴らしい!",
  "今日もナイスワーク!",
  "えらい!よくがんばりました!",
];

export function randomCheerMessage() {
  return CHEER_MESSAGES[Math.floor(Math.random() * CHEER_MESSAGES.length)];
}

export function MascotBubble({ message, className = "" }: { message: string; className?: string }) {
  return <p className={`text-xs font-medium text-emerald-700 ${className}`}>{message}</p>;
}

export function EmptyStateMascot({ message }: { message: string }) {
  return <p>{message}</p>;
}
