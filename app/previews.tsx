import { MonoScrollPage } from "@/lib/components/MonoScrollPage";
import { useWaktuSolatWidgetUpdate } from "@/lib/hooks/waktuSolatWidget";
import { WidgetPreviews } from "@/lib/widgets/WidgetPreviews";

export default function Index() {
  useWaktuSolatWidgetUpdate();

  return (
    <MonoScrollPage>
      <WidgetPreviews />
    </MonoScrollPage>
  );
}
