import type { Metadata } from "next";
import { FeaturePage } from "@/components/marketing/marketing";

export const metadata: Metadata = {
  title: "Push Notifications Testing | CosmoKit",
  description:
    "Send custom push payloads to the iOS Simulator without a backend, and deliver real APNs push notifications to a connected iPhone in CosmoKit 4.9.0+.",
  alternates: { canonical: "https://usecosmoskittool.com/push" },
};

export default function PushPage() {
  return <FeaturePage featureId="push" />;
}
