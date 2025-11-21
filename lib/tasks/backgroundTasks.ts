import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import { updateWaktuSolatAndWidgets } from "@/lib/service/waktuSolatWidget";

export const BG_TASK = "update-waktu-solat-widget";
export const NOTIF_TASK = "waktu-solat-notifications-task";

TaskManager.defineTask(BG_TASK, async () => {
  try {
    console.log("Start background task");
    await updateWaktuSolatAndWidgets(true, true);
  } catch (error) {
    console.error("Failed background task:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }

  console.log("Completed background task");
  return BackgroundTask.BackgroundTaskResult.Success;
});

export async function registerBackgroundTasks() {
  await BackgroundTask.registerTaskAsync(BG_TASK, {
    minimumInterval: 15,
  });
}
