import { Routes, Route, Navigate } from 'react-router-dom';
import RoleSelection from './components/RoleSelection';
import HostDashboard from './components/HostDashboard';
import ReceiverDashboard from './components/ReceiverDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/host" element={<HostDashboard />} />
      <Route path="/receiver" element={<ReceiverDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
