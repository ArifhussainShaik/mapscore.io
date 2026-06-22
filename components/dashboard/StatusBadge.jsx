import { statusBg } from "@/libs/design-tokens";

export default function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusBg(status)}`}>
      {status}
    </span>
  );
}
