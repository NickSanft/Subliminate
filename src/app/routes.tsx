import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingScreen } from '@/screens/landing/LandingScreen';
import { ComponentsShowcase } from '@/screens/components/ComponentsShowcase';
import { UploadScreen } from '@/screens/upload/UploadScreen';
import { ReviewScreen } from '@/screens/review/ReviewScreen';
import { Placeholder } from '@/screens/placeholder/Placeholder';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingScreen />} />
      <Route path="/components" element={<ComponentsShowcase />} />
      <Route path="/upload" element={<UploadScreen />} />
      <Route path="/review" element={<ReviewScreen />} />
      <Route path="/dashboard" element={<Placeholder title="Dashboard" note="Ships in Phase 4." />} />
      <Route path="/subscriptions" element={<ReviewScreen />} />
      <Route path="/insights" element={<Placeholder title="Insights" note="Ships in Phase 5." />} />
      <Route path="/renewals" element={<Placeholder title="Upcoming renewals" note="Ships in Phase 4." />} />
      <Route path="/canceled" element={<Placeholder title="Canceled" note="Ships in Phase 5." />} />
      <Route path="/privacy" element={<Placeholder title="Privacy &amp; verification" note="Ships in Phase 6." />} />
      <Route path="/settings" element={<Placeholder title="Settings" note="Ships in Phase 7." />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
