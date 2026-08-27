import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useReplyListener, initMobileFirebase } from "../lib";

export default function RootLayout() {
  // Ensure Firebase connection is established
  initMobileFirebase();

  // Mount real-time reply listener so any desktop quick replies are immediately handled
  useReplyListener();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f8f9fa" },
          animation: "fade",
        }}
      />
    </>
  );
}
