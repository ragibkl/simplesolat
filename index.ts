import { registerWidgetTaskHandler } from "react-native-android-widget";

import { widgetTaskHandler } from "@/lib/tasks/widgetTaskHandler";
import "@/lib/tasks/backgroundTasks";
import "@/lib/service/notifeeBackground";

import "expo-router/entry";

registerWidgetTaskHandler(widgetTaskHandler);
