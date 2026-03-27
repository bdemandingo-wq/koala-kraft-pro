import { useState, ReactNode } from "react";
import { useSubscription, Feature } from "@/hooks/useSubscription";
import { UpgradeModal, FeatureLockedOverlay } from "./UpgradeModal";

interface SubscriptionGateProps {
  children: ReactNode;
  feature?: Feature;
  featureLabel?: string;
}

export function SubscriptionGate({ children, feature, featureLabel }: SubscriptionGateProps) {
  const { tier, needsUpgrade, requiredTierForFeature } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // If no specific feature is required, allow through
  if (!feature) return <>{children}</>;

  const requiredTier = requiredTierForFeature(feature);
  
  if (!needsUpgrade(requiredTier)) {
    return <>{children}</>;
  }

  const label = featureLabel || feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="relative">
      {children}
      <FeatureLockedOverlay
        featureName={label}
        requiredTier={requiredTier}
        currentTier={tier}
        onUpgrade={() => setUpgradeOpen(true)}
      />
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName={label}
        requiredTier={requiredTier}
        currentTier={tier}
      />
    </div>
  );
}

export function useSubscriptionCheck() {
  const { tier, needsUpgrade, requiredTierForFeature } = useSubscription();

  const requireSubscription = (callback: () => void, feature?: Feature) => {
    if (!feature) {
      callback();
      return;
    }
    const requiredTier = requiredTierForFeature(feature);
    if (!needsUpgrade(requiredTier)) {
      callback();
    }
    // If upgrade needed, do nothing — SubscriptionGate overlay handles it
  };

  return { requireSubscription, isSubscribed: true, tier, needsUpgrade };
}
