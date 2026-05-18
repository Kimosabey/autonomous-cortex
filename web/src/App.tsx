import { Navigate, Route, Routes } from 'react-router-dom'

import { InvestigatePage } from '@/pages/InvestigatePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InvestigatePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
