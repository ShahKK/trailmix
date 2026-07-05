import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HikesPage from './features/hikes/HikesPage'
import HikeDetailPage from './features/hikes/HikeDetailPage'
import SegmentDetailPage from './features/segments/SegmentDetailPage'
import FoodsPage from './features/foods/FoodsPage'
import AboutPage from './features/about/AboutPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HikesPage />} />
          <Route path="hikes/:hikeId" element={<HikeDetailPage />} />
          <Route path="hikes/:hikeId/segments/:segmentId" element={<SegmentDetailPage />} />
          <Route path="foods" element={<FoodsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
