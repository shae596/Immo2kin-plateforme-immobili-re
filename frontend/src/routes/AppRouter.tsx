import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { MainLayout } from '../layouts/MainLayout'
import { AdminActiveUsersPage } from '../pages/admin/AdminActiveUsersPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage'
import { AdminPropertiesPage } from '../pages/admin/AdminPropertiesPage'
import { AdminReservationsPage } from '../pages/admin/AdminReservationsPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminVerificationsPage } from '../pages/admin/AdminVerificationsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { MyPropertiesPage } from '../pages/MyPropertiesPage'
import { MyReservationsPage } from '../pages/MyReservationsPage'
import { MessagesPage } from '../pages/MessagesPage'
import { VerificationPage } from '../pages/VerificationPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OwnerReservationsPage } from '../pages/OwnerReservationsPage'
import { PropertiesMapPage } from '../pages/PropertiesMapPage'
import { PropertiesPage } from '../pages/PropertiesPage'
import { PropertyDetailPage } from '../pages/PropertyDetailPage'
import { PropertyEditPage } from '../pages/PropertyEditPage'
import { PropertyFormPage } from '../pages/PropertyFormPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { VerifyEmailPage } from '../pages/VerifyEmailPage'
import { AdminRoute } from './AdminRoute'
import { GuestRoute } from './GuestRoute'
import { OwnerRoute } from './OwnerRoute'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="properties/map" element={<PropertiesMapPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/:id" element={<PropertyDetailPage />} />
          <Route element={<GuestRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>
          <Route path="verify-email/:id/:hash" element={<VerifyEmailPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="reservations" element={<MyReservationsPage />} />
            <Route
              path="my/properties/reservations"
              element={
                <OwnerRoute>
                  <OwnerReservationsPage />
                </OwnerRoute>
              }
            />
            <Route
              path="my/verification"
              element={
                <OwnerRoute>
                  <VerificationPage />
                </OwnerRoute>
              }
            />
            <Route
              path="my/properties"
              element={
                <OwnerRoute>
                  <MyPropertiesPage />
                </OwnerRoute>
              }
            />
            <Route
              path="my/properties/new"
              element={
                <OwnerRoute>
                  <PropertyFormPage />
                </OwnerRoute>
              }
            />
            <Route
              path="my/properties/:id/edit"
              element={
                <OwnerRoute>
                  <PropertyEditPage />
                </OwnerRoute>
              }
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="properties" element={<AdminPropertiesPage />} />
          <Route path="reservations" element={<AdminReservationsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="active-users" element={<AdminActiveUsersPage />} />
          <Route path="verifications" element={<AdminVerificationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
