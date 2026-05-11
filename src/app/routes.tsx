import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingScreen } from '@/screens/landing/LandingScreen';
import { ComponentsShowcase } from '@/screens/components/ComponentsShowcase';
import { UploadScreen } from '@/screens/upload/UploadScreen';
import { ReviewScreen } from '@/screens/review/ReviewScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { SubscriptionsScreen } from '@/screens/subscriptions/SubscriptionsScreen';
import { CanceledScreen } from '@/screens/canceled/CanceledScreen';
import { PrivacyScreen } from '@/screens/privacy/PrivacyScreen';
import { Placeholder } from '@/screens/placeholder/Placeholder';

// Recharts is heavy (~150 KB gzipped). The detail and insights screens
// are the only ones that need it, so we lazy-load them and let Vite
// emit a separate chunk fetched on demand. Initial dashboard load
// stays under our 75 KB budget.
const SubscriptionDetail = lazy(() =>
  import('@/screens/subscription-detail/SubscriptionDetail').then((m) => ({
    default: m.SubscriptionDetail,
  })),
);
const InsightsScreen = lazy(() =>
  import('@/screens/insights/InsightsScreen').then((m) => ({ default: m.InsightsScreen })),
);

function ChartLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-1)',
        fontSize: 13,
      }}
    >
      <span className="live-dot" style={{ marginRight: 8 }} />
      Loading…
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingScreen />} />
      <Route path="/components" element={<ComponentsShowcase />} />
      <Route path="/upload" element={<UploadScreen />} />
      <Route path="/review" element={<ReviewScreen />} />
      <Route path="/dashboard" element={<DashboardScreen />} />
      <Route path="/subscriptions" element={<SubscriptionsScreen />} />
      <Route
        path="/subscription/:id"
        element={
          <Suspense fallback={<ChartLoading />}>
            <SubscriptionDetail />
          </Suspense>
        }
      />
      <Route
        path="/insights"
        element={
          <Suspense fallback={<ChartLoading />}>
            <InsightsScreen />
          </Suspense>
        }
      />
      <Route path="/canceled" element={<CanceledScreen />} />
      <Route
        path="/renewals"
        element={
          <Placeholder
            title="Upcoming renewals"
            note="See the next 30 days on the dashboard. A full calendar view ships in a later phase."
          />
        }
      />
      <Route path="/privacy" element={<PrivacyScreen />} />
      <Route path="/settings" element={<Placeholder title="Settings" note="Ships in Phase 7." />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
